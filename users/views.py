from django.contrib.auth import authenticate, login, get_user_model
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.core.mail import send_mail
from django.shortcuts import redirect, render
from django.template.loader import render_to_string
from django.urls import reverse
from django.contrib.sites.shortcuts import get_current_site
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from dotenv import load_dotenv
from .forms import CustomUserCreationForm

load_dotenv()
User = get_user_model()


def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.is_active = False
            user = form.save()
            token = default_token_generator.make_token(user)
            user_id = urlsafe_base64_encode(force_bytes(user.pk))
            domain = get_current_site(request).domain
            link = reverse('activate', kwargs={'uidb64': user_id, 'token': token})
            activate_url = 'http://{}{}'.format(domain, link)
            context = {'activate_url': activate_url}
            html_message = render_to_string('activation_email.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                'Подтверждение регистрации',
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
                html_message=html_message
            )
            return redirect('account_activation_sent')
    else:
        form = CustomUserCreationForm()
    return render(request, 'registration/signup.html', {'form': form})


def account_activation_sent_view(request):
    return render(request, 'registration/account_activation_sent.html')


def activate(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, token):
        user.is_active = True
        user.save()
        login(request, user)
        return redirect('home')
    else:
        context = {
            "message": "Ссылка активации недействительна, попробуйте запросить новую."
        }
        return render(request, 'registration/activation_invalid.html', context)


def resend_activation_email(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            user = User.objects.get(email=email, is_active=False)
        except User.DoesNotExist:
            # Если пользователь с данным email не найден или уже активирован
            context = {"message": "Аккаунт с данным email не нуждается в активации или не существует. "}
            return render(request, 'registration/activation_invalid.html', context)

        # Создаем новый токен активации и отправляем письмо
        token = default_token_generator.make_token(user)
        user_id = urlsafe_base64_encode(force_bytes(user.pk))
        domain = get_current_site(request).domain
        link = reverse('activate', kwargs={'uidb64': user_id, 'token': token})
        activate_url = 'http://{}{}'.format(domain, link)
        context = {'activate_url': activate_url}
        html_message = render_to_string('activation_email.html', context)
        plain_message = strip_tags(html_message)

        send_mail(
            'Подтверждение регистрации',
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            html_message=html_message
        )
        context = {"message": "Новая ссылка для активации была отправлена на ваш email."}
        return render(request, 'registration/account_activation_sent.html.html', context)
    else:
        return render(request, 'registration/resend_activation_email_form.html')


def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                if user.is_active:
                    login(request, user)
                    return redirect('media_list')
                else:
                    return render(request, 'login.html', {
                        'form': form,
                        'error_message': 'Ваш аккаунт заблокирован.'
                    })
            else:
                return render(request, 'login.html', {
                    'form': form,
                    'error_message': 'Неправильный логин или пароль'
                })
    else:
        form = AuthenticationForm()
    return render(request, 'registration/login.html', {'form': form})
