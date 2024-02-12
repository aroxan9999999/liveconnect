from django.contrib.auth import get_user_model
from PIL import Image
from io import BytesIO
import sys
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import models
from django.http import request
from .utils import format_numbers_correctly
from .utils import get_toggle_heart

User = get_user_model()


class File(models.Model):
    file = models.FileField(upload_to='media_files/')
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.file and hasattr(self.file, 'content_type'):
            if self.file.content_type.startswith('image'):
                # Открытие изображения
                img = Image.open(self.file)
                output_size = (389, 695)  # Измените размеры здесь
                img.thumbnail(output_size, Image.ANTIALIAS)

                # Сохранение измененного изображения в памяти
                output = BytesIO()
                img_format = img.format if img.format else 'JPEG'  # Предполагаем JPEG, если формат не определен
                img.save(output, format=img_format, quality=100)
                output.seek(0)

                # Обновление файла в модели
                self.file = InMemoryUploadedFile(output, 'FileField',
                                                 "%s.%s" % (self.file.name.split('.')[0], img_format.lower()),
                                                 img.format, sys.getsizeof(output), None)
        super(File, self).save(*args, **kwargs)


class Media(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    files = models.ManyToManyField(File)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def media_comment_count(self):
        count = Comment.objects.filter(media__pk=self.pk).count()
        return format_numbers_correctly(str(count))

    def get_toggle_heart(self, request):
        return get_toggle_heart(f'media_{self.pk}', request.user.pk)


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    media = models.ForeignKey(Media, on_delete=models.CASCADE, related_name='comments', blank=True, null=True)
    reels = models.ForeignKey('Reels', on_delete=models.CASCADE, related_name='reels_comments', blank=True, null=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class Reels(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='media_reels')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reels_user')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def reel_comment_count(self):
        count = Comment.objects.filter(reels__pk=self.pk).count()
        return format_numbers_correctly(str(count))


