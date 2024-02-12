from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Media, Comment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    picture = serializers.ImageField()  # или другой тип поля, соответствующий вашей модели

    class Meta:
        model = User
        fields = ['picture']


class CommentSerializer(serializers.ModelSerializer):
    media = serializers.IntegerField()
    user = serializers.ReadOnlyField(source='user.id')

    class Meta:
        model = Comment
        fields = ['id', 'media', 'text', 'created_at', 'user']
