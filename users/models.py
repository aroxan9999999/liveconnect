from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import EmailValidator
from django.contrib.auth.hashers import make_password


class SocialLiveUser(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    birth_date = models.DateField(null=True, blank=True)
    picture = models.ImageField(upload_to='media_files/', default='/icons/user.svg', blank=True)
    phone = models.CharField(max_length=15, unique=True, blank=True, null=True)
    password = models.CharField(max_length=128)
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following', blank=True)

    def save(self, *args, **kwargs):
        if not self.picture:
            self.picture = 'media/icons/user.svg'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
