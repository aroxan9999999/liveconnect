from django import forms
from .models import Comment
from .models import Reels


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['text']


class ReelsForm(forms.ModelForm):
    class Meta:
        model = Reels
        fields = ['title', 'file']
