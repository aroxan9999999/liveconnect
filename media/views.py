from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from django.views.decorators.http import require_POST
from django.views.generic.list import ListView
from django.http import HttpResponse
import pyautogui
from .forms import ReelsForm
from .serializers import CommentSerializer
from django.views.decorators.csrf import csrf_exempt
from .models import Comment, Media, File, Reels
from django.views.decorators.csrf import csrf_protect
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.contrib.auth.decorators import login_required
from django.db.models import Case, When, Value, IntegerField
import json
from .utils import redis_client, get_toggle_heart


class AddCommentView(View):
    @method_decorator(login_required)
    def post(self, request, *args, **kwargs):
        user = request.user
        media_id = request.POST.get('media_id')
        text = request.POST.get('text')

        if not user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)

        if not text:
            return JsonResponse({'error': 'No text provided'}, status=400)

        try:
            media = Media.objects.get(id=media_id)
        except Media.DoesNotExist:
            return JsonResponse({'error': 'Media not found'}, status=404)

        comment = Comment.objects.create(user=user, media=media, text=text)

        return JsonResponse({
            'success': True,
            'username': user.username,
            'comment': text,
            'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })


class MediaListView(ListView, View):
    model = Media
    template_name = 'media_list.html'
    context_object_name = 'media_list'

    def get_queryset(self):
        return super().get_queryset().prefetch_related('files')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        media_files_urls = []
        request = self.request
        for media in context['media_list']:
            files_urls = [file.file.url for file in media.files.all()]
            data = get_toggle_heart(f'media_{media.pk}', request.user.pk)
            new_data = {"count": data['hearts_count'], "src": data['src']}
            media_files_urls.append({
                'id': media.id,
                'title': media.title,
                'description': media.description,
                'files': files_urls,
                'created_at': media.created_at.strftime('%Y-%m-%d %H:%M:%S').isoformat(),
                'updated_at': media.updated_at.strftime('%Y-%m-%d %H:%M:%S').isoformat(),
                'hearts_count': new_data['count'],
                'src': new_data['src'],
            })
        context['media_files_urls'] = media_files_urls
        return context

    @method_decorator(csrf_protect)
    @method_decorator(login_required)
    def post(self, request, *args, **kwargs):
        title = request.POST.get('title')
        description = request.POST.get('description')

        media = Media.objects.create(
            user=request.user,
            title=title,
            description=description
        )

        files = request.FILES.getlist('files')
        for file in files:
            if file.content_type.startswith('image/') or file.content_type.startswith('video/'):
                file_instance = File.objects.create(file=file)
                media.files.add(file_instance)

        return JsonResponse({'status': 'success', 'redirect_url': reverse('media_list')})


class CommentCreateView(View):
    def post(self, request):
        data = json.loads(request.body)
        print('data', data)
        print(f'request_user {request.user}')

        serializer = CommentSerializer(data=json.loads(request.body))
        if serializer.is_valid():
            print(serializer.validated_data)
            media_id = int(serializer.validated_data['media'])
            print(media_id)
            media = Media.objects.get(pk=media_id)
            comment = serializer.save(user=request.user, media=media)
            response_data = {
                "id": comment.id,
                "text": comment.text,
                "media": comment.media.id,
                "user": {
                    "picture": request.user.picture.url,
                    "username": request.user.username
                },
                "created_at": comment.created_at
            }
            print(f"data sended yo javascript {response_data}")
            return JsonResponse(response_data, status=201)
        print(serializer.errors)
        return JsonResponse(serializer.errors, status=400)


def get_first_reel(request):
    try:
        # Получение списка id пользователей, на которых подписан текущий пользователь
        user_following_ids = request.user.following.values_list('id', flat=True)

        # Создание условной логики сортировки
        conditional_ordering = Case(
            When(user__id__in=user_following_ids, then=Value(0)),
            default=Value(1),
            output_field=IntegerField()
        )

        # Получение первого Reels, учитывая подписки и дату создания
        first_reel = Reels.objects.annotate(
            is_followed=conditional_ordering
        ).order_by('is_followed', 'created_at').first()

        if first_reel is not None:
            return redirect("next_reel", pk=first_reel.pk)
        else:
            return JsonResponse({'error': 'No available Reels found.'}, status=404)

    except Reels.DoesNotExist:
        return JsonResponse({'error': 'No Reels found.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_next_and_previous_reel(request, pk):
    try:
        current_reel = Reels.objects.get(pk=pk)
        user_following_ids = request.user.following.values_list('id', flat=True)

        # Условная логика сортировки
        conditional_ordering = Case(
            When(user__id__in=user_following_ids, then=Value(0)),
            default=Value(1),
            output_field=IntegerField()
        )

        base_query = Reels.objects.select_related('user').exclude(pk=current_reel.pk)

        # Получение следующего Reel
        next_reel = base_query.filter(
            created_at__gt=current_reel.created_at
        ).annotate(
            is_followed=conditional_ordering
        ).order_by('is_followed', 'created_at').first()

        # Получение предыдущего Reel
        previous_reel = base_query.filter(
            created_at__lt=current_reel.created_at
        ).annotate(
            is_followed=conditional_ordering
        ).order_by('-is_followed', '-created_at').first()

        response_data = {
            'next_reel_url': reverse('next_reel', kwargs={'pk': next_reel.pk}) if next_reel else None,
            'previous_reel_url': reverse('next_reel', kwargs={'pk': previous_reel.pk}) if previous_reel else None,
        }

        reels_data = {
            'reels_content': current_reel.file.url,
            'reels_id': current_reel.id,
            'reel_title': current_reel.title,
            'comments': current_reel.reels_comments.all(), }
        rells = current_reel
        data = get_toggle_heart(f'reels_{rells.pk}', request.user.pk)

        new_data = {"count": data['hearts_count'], "src": data['src']}
        response_data.update(new_data)
        response_data.update(reels_data)
        return render(request, template_name='reels.html', context=response_data)

    except Reels.DoesNotExist:
        return JsonResponse({'error': 'Reel not found'}, status=404)


@csrf_exempt(login_required)
@require_POST
def music(request):
    pyautogui.press('p')
    return HttpResponse('Success')


def reels_comment(request, reels_id, message):
    user = request.user
    reels = get_object_or_404(Reels, pk=reels_id)
    comment = Comment.objects.create(reels=reels, text=message, user=user)
    data = {
        'user': {
            'picture': {'url': user.picture.url},
            'username': user.username
        },
        'created_at': comment.created_at.strftime('%m-%d %H:%M:%S')
    }
    return JsonResponse(data, status=200)


def toggle_heart(requset, object_id, user_id):
    key = f"hearts:{object_id}"
    already_hearted = redis_client.sismember(key, user_id)

    if already_hearted:
        redis_client.srem(key, user_id)
        hearted = False
        increment = -1  # Уменьшаем счетчик, так как сердечко убрано
    else:
        redis_client.sadd(key, user_id)
        hearted = True
        increment = 1  # Увеличиваем счетчик, так как добавлено сердечко

    count = redis_client.scard(key)

    # Обновление рейтинга в зависимости от типа объекта
    update_objects_ranking(object_id, increment)

    return JsonResponse({"hearts_count": count, "hearted": hearted})


def update_objects_ranking(object_id, increment):
    if object_id.startswith("reels_"):
        ranking_key = "reels_ranking"
    elif object_id.startswith("media_"):
        ranking_key = "media_ranking"
    else:
        return  # Неверный тип объекта

    # Увеличение или уменьшение рейтинга
    redis_client.zincrby(ranking_key, increment, object_id)


def get_top_objects(request, object_type):
    # Определение ключа ранжирования в зависимости от типа объекта
    if object_type == 'reels':
        ranking_key = "reels_ranking"
    elif object_type == 'media':
        ranking_key = "media_ranking"
    else:
        return JsonResponse({"error": "Invalid object type"}, status=400)

    top_objects = redis_client.zrevrange(ranking_key, 0, 99, withscores=True)
    top_objects_info = []

    object_ids = [obj_id.decode("utf-8") for obj_id, _ in top_objects]

    for i, obj_id in enumerate(object_ids):
        hearts_count = int(redis_client.zscore(ranking_key, obj_id))

        if object_type == 'reels':
            current_url = reverse('reels_detail', kwargs={'pk': obj_id})
            next_object_id = object_ids[i + 1] if i + 1 < len(object_ids) else None
            next_url = reverse('reels_detail', kwargs={'pk': next_object_id}) if next_object_id else None

            top_objects_info.append({
                "object_id": obj_id,
                "hearts_count": hearts_count,
                "current_url": current_url,
                "next_url": next_url
            })

        elif object_type == 'media':
            top_objects_info.append({"media_id": obj_id, "hearts_count": hearts_count})

    if object_type == 'reels':
        return JsonResponse(top_objects_info, safe=False)
    else:  # for media
        return JsonResponse(top_objects_info, safe=False)


def create_reel(request):
    if request.method == 'POST':
        form = ReelsForm(request.POST, request.FILES)
        if form.is_valid():
            reel = form.save(commit=False)
            reel.user = request.user
            reel.save()
            # Получаем URL для перенаправления
            redirect_url = reverse('next_reel', kwargs={'pk': reel.pk})
            return JsonResponse({"success": True, "redirect": redirect_url})
        else:
            return JsonResponse({"success": False, "errors": form.errors})
    return JsonResponse({"success": False})
