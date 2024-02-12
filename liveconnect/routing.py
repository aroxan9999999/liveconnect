from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from . import consumers
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r"ws/chat/media/(?P<media_pk>\d+)/$", consumers.CommentConsumer.as_asgi()),
    re_path(r"ws/chat/reels/(?P<reels_pk>\d+)/$", consumers.ChatConsumer.as_asgi()),
    re_path(r"ws/toggle_heart/(?P<channel_id>[\w-]+)/$", consumers.HeartConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter(websocket_urlpatterns),
})
