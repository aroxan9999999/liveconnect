

const roomName = JSON.parse(document.getElementById('room-name').textContent);



const chatSocket = new WebSocket(
  'ws://'
  + window.location.host
  + '/ws/chat/reels/'
  + roomName
  + '/'
);




async function sendData(reels_id, message) {
  const csrftoken = getCookie('csrftoken');
  const response = await fetch('/create_reels_comments/' + reels_id + '/' + encodeURIComponent(message) + '/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken
    },
    body: JSON.stringify({ reels_id, message })
  });

  const data = await response.json();
  return data;
}


chatSocket.onmessage = function (e) {
  const data = JSON.parse(e.data);
  const chatContainer = document.querySelector('.chat-container');

  // Создаем новый элемент сообщения
  const newMessage = document.createElement('div');
  newMessage.classList.add('message', 'received');

  // Формируем содержимое сообщения на основе полученных данных
  newMessage.innerHTML = `
        <img src="${data.user_picture_url}" alt="User" class="avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="username">${data.username}</span>
                <span class="timestamp">${data.created_at}</span>
            </div>
            <p class="message-text">${data.message}</p>
        </div>
    `;

  // Добавляем сообщение в контейнер чата
  let count = document.querySelector(".comments_count");
  let count_n = Number(count.textContent.trim()); // Удаляем пробелы в начале и конце строки
  count.textContent = count_n + 1;
  chatContainer.appendChild(newMessage);
  document.body.classList.add('noscroll');
  document.getElementById("emojiPanel").style.display = 'none'
  cWindow.scrollTop = cWindow.scrollHeight;

  // Прокручиваем контейнер вниз, чтобы показать новое сообщение
  chatContainer.scrollTop = chatContainer.scrollHeight;
};



document.querySelector('#message_input').focus();
document.querySelector('#message_input').onkeyup = function (e) {
  if (e.key === 'Enter') {
    document.querySelector('#chat-message-submit').click();
  }
};


document.querySelector('#chat-message-submit').onclick = async function (e) {
  const messageInputDom = document.querySelector('#message_input');
  const message = messageInputDom.value;
  const reels_id = roomName

  try {
    const responseData = await sendData(reels_id, message);
    const userPictureUrl = responseData.user.picture.url;
    const username = responseData.user.username;
    const createdAt = responseData.created_at;

    const data = {
      'user': {
        'picture': { 'url': userPictureUrl },
        'username': username
      },
      'created_at': createdAt,
      'message': message
    };

    chatSocket.send(JSON.stringify(data));
    messageInputDom.value = '';
  } catch (error) {
    console.error('There was an error sending data through WebSocket:', error);
  }
};

