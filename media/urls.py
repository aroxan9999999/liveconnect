from django.urls import path
from . import views


urlpatterns = [
    path('comments/', views.CommentCreateView.as_view(), name='comments'),
    path('', views.MediaListView.as_view(), name='media_list'),
    path('add_comment/', views.AddCommentView.as_view(), name='add_comment'),
    path('reels/', views.get_first_reel, name='first_rells'),
    path('reels/<int:pk>/', views.get_next_and_previous_reel, name='next_reel'),
    path('music/', views.music, name='next_reel'),
    path('toggle_heart/<str:object_id>/<int:user_id>/', views.toggle_heart, name='toggle_heart'),
    path('create_reels/', views.create_reel, name='create_reels'),
    path('create_reels_comments/<int:reels_id>/<str:message>/', views.reels_comment, name='create_reels_comments')
]
