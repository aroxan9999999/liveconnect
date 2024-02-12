import json
from channels.generic.websocket import AsyncWebsocketConsumer


class CommentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Получаем ID медиа из пути URL, по которому было установлено соединение WebSocket
        self.media_id = self.scope['url_route']['kwargs']['media_pk']
        self.room_group_name = f'chat_{self.media_id}'

        # Присоединяемся к группе чата
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Отключаемся от группы чата
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        text = text_data_json['text']
        media = text_data_json['media']
        user_picture = text_data_json['user']
        user_username = text_data_json['username']
        created_at = text_data_json['created_at']

        # Теперь передаем полученные данные в group_send
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'text': text,
                'media': media,
                'user': {
                    'picture': user_picture,
                    'username': user_username
                },
                'created_at': created_at,
            }
        )

    # Обработчик для отправки сообщения в WebSocket
    async def chat_message(self, event):
        # Извлекаем информацию о пользователе из события
        user_picture = event['user']['picture']
        user_username = event['user']['username']
        print(user_username)
        print(event)

        # Отправляем сообщение обратно в WebSocket
        await self.send(text_data=json.dumps({
            'text': event['text'],
            'media': event['media'],
            'user': {
                'picture': user_picture,
                'username': user_username
            },
            'created_at': event['created_at'],
        }))


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["reels_pk"]
        self.room_group_name = f"chat_{self.room_name}"
        print("Room name:", self.room_name)
        print("Room group name:", self.room_group_name)

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        user_picture_url = text_data_json['user']['picture']['url']
        username = text_data_json['user']['username']
        created_at = text_data_json['created_at']

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat.message", 'message': message, 'user_picture_url': user_picture_url,
             'username': username, 'created_at': created_at, })

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        user_picture_url = event['user_picture_url']
        username = event['username']
        created_at = event['created_at']
        print('event', event)

        # Send message to WebSocket
        await self.send(text_data=json.dumps(
            {"message": message, 'user_picture_url': user_picture_url, 'username': username,
             'created_at': created_at, }))


class HeartConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["channel_id"]
        self.room_group_name = f"channel_{self.room_name}"
        print("Room name:", self.room_name)
        print("Room group name:", self.room_group_name)

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        print(text_data_json)
        count = text_data_json['hearts_count']
        objectid = text_data_json['object_Id']

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat.message", 'hearts_count': count, 'object_id': objectid})

    # Receive message from room group
    async def chat_message(self, event):
        count = event["hearts_count"]
        objectid = event['object_id']
        print('event', event)

        # Send message to WebSocket
        await self.send(text_data=json.dumps(
            {"hearts_count": count, 'object_id': objectid}))
