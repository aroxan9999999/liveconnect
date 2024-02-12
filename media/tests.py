from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import Media

class MediaTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='12345')

    def test_create_media(self):
        self.client.login(username='testuser', password='12345')
        url = reverse('media_upload')
        data = {'title': 'Test Media', 'file': []}
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Media.objects.count(), 1)
        self.assertEqual(Media.objects.get().title, 'Test Media')