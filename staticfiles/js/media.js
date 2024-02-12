document.addEventListener('DOMContentLoaded', () => {
  const mediaElements = document.querySelectorAll('.media');

  mediaElements.forEach(mediaDiv => {
    const mediaId = mediaDiv.getAttribute('id').split('-')[1];
    // Преобразуем строку JSON в объект JavaScript
    let mediaFilesUrls;
    try {
      mediaFilesUrls = JSON.parse(mediaDiv.getAttribute('data-media-list-urls').replace(/'/g, '"'));
    } catch (error) {
      console.error('Ошибка парсинга JSON для медиа с ID', mediaId, error);
      return;
    }

    let currentIndex = parseInt(mediaDiv.getAttribute('data-current-index'), 10) || 0;

    // Функция для обновления изображения
    function updateImage() {
      if (mediaFilesUrls.files && mediaFilesUrls.files.length > currentIndex) {
        mediaDiv.style.backgroundImage = 'url(' + mediaFilesUrls.files[currentIndex] + ')';
      } else {
        console.log('Нет изображений для медиа с ID ' + mediaId);
      }
    }

    mediaDiv.setAttribute('data-current-index', currentIndex);
    updateImage();
  });
});

function changeImage(mediaId, direction) {
  const mediaDiv = document.getElementById('media-' + mediaId);
  if (!mediaDiv) {
    console.error('Медиа-элемент не найден:', mediaId);
    return;
  }

  let mediaFilesUrls = JSON.parse(mediaDiv.getAttribute('data-media-list-urls').replace(/'/g, '"'));
  let currentIndex = parseInt(mediaDiv.getAttribute('data-current-index'), 10) || 0;

  currentIndex += direction;
  if (currentIndex >= mediaFilesUrls.files.length) {
    currentIndex = 0;
  } else if (currentIndex < 0) {
    currentIndex = mediaFilesUrls.files.length - 1;
  }

  mediaDiv.setAttribute('data-current-index', currentIndex);
  mediaDiv.style.backgroundImage = 'url(' + mediaFilesUrls.files[currentIndex] + ')';
}




function toggleMenu() {
  var menu = document.querySelector('.menu_create');
  menu.style.display = 'block';
  document.body.classList.add('no-scroll');
}

function closeMenu() {
  var menu = document.querySelector('.menu_create');
  menu.style.display = 'none';
  document.body.classList.remove('no-scroll');
}

const menuCreate = document.querySelector('.menu_create');
const previewContainer = document.createElement('div');
previewContainer.classList.add('preview');
previewContainer.style.cssText = `
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-content: flex-start;
    position: absolute;
    top: 13%;
    right: 1%;
    height: 700px;
    width: 500px;
    border: 1px solid rgb(15, 7, 15);
    overflow-y: scroll;
`;
menuCreate.appendChild(previewContainer);

const inputFile = document.querySelector('input[type="file"]');


inputFile.addEventListener('change', (event) => {
  selectedFiles = Array.from(event.target.files); // Обновляем массив файлов
  displayPreviews(selectedFiles); // Функция для отображения предпросмотров
});

function displayPreviews(files) {
  previewContainer.innerHTML = ''; // Очистка предпросмотра
  files.forEach((file, index) => {
    const previewDiv = document.createElement('div');
    previewDiv.classList.add('upload_files_preview');
    previewDiv.style.cssText = `
        width: calc(50% - 4px);
        height: 240px;
        border: 2px solid black;
        margin: 2px;
        box-sizing: border-box;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    // Добавление изображения или медиа в зависимости от типа файла
    if (file.type.startsWith('image/')) {
      previewDiv.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
      previewDiv.style.backgroundRepeat = 'no-repeat';
      previewDiv.style.backgroundSize = 'cover';
      previewDiv.style.backgroundPosition = 'center';
    } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      const media = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
      media.src = URL.createObjectURL(file);
      media.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
      `;
      media.controls = true;
      media.autoplay = true;
      previewDiv.appendChild(media);
    }

    // Кнопка удаления файла
    const deleteSpan = document.createElement('span');
    deleteSpan.classList.add('delete_file');
    deleteSpan.textContent = 'x';
    deleteSpan.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 20px;
        font-weight: bold;
        transition: font-size 0.5s ease;
        display: block;
        z-index: 20001;
    `;
    deleteSpan.addEventListener('click', () => {
       console.log('Перед удалением:', selectedFiles);
      selectedFiles.splice(index, 1); // Удаление файла из массива
      console.log('После удаления:', selectedFiles);
      displayPreviews(selectedFiles); // Обновление предпросмотров
    });

    previewDiv.appendChild(deleteSpan);
    previewContainer.appendChild(previewDiv);
  });
}

// При отправке формы добавляем выбранные файлы в FormData
let selectedFiles = [];
// Получаем элементы формы и кнопки
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const submitButton = document.querySelector('#submit-files-button'); // Убедитесь, что у кнопки есть этот id

  const inputFile = document.querySelector('input[type="file"]');
  inputFile.addEventListener('change', (event) => {
    selectedFiles = Array.from(event.target.files); // Обновляем массив файлов
    console.log('Файлы выбраны:', selectedFiles); // Выводим информацию о выбранных файлах
    // Здесь может быть код для отображения предпросмотра файлов
    displayPreviews(selectedFiles);
  });

  submitButton.addEventListener('click', (event) => {
    event.preventDefault();
    
    if (!form.checkValidity()) {
      form.reportValidity(); // Это покажет стандартные сообщения об ошибках для невалидных полей
      return; // Выходим из функции, не отправляя форму
    }

    const formData = new FormData(form);
    formData.delete('files');
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    console.log('Отправляемые файлы:', selectedFiles);

    fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'same-origin'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Сетевой ответ был не ok.');
      }
      return response.json();
    })
    .then(data => {
      if (data.status === 'success') {
        console.log('Запись успешно добавлена');
        window.location.href = data.redirect_url; // Редирект
      }
    })
    .catch(error => {
      console.error('Произошла проблема с вашим fetch запросом:', error);
    });
  });

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
});


// Объект для хранения WebSocket соединений для каждого чата
const chatSockets = {};

// Функция для инициализации или получения WebSocket соединения для заданного чата
function getChatSocket(mediaId) {
    if (!chatSockets[mediaId]) {
        chatSockets[mediaId] = new WebSocket(`ws://${window.location.host}/ws/chat/${mediaId}`);
        chatSockets[mediaId].addEventListener('message', function (event) {
            // Обработка входящих сообщений (при необходимости)
        });
    } else {
      console.log('Сокет для чата с ID', mediaId, 'уже существует.');
    }
    return chatSockets[mediaId];
}

// Функция для отправки комментария и отображения его на странице
function sendMessage(mediaPk) {
    const messageInput = document.querySelector('#messageInput_' + mediaPk);
    const messageText = messageInput.value;
    messageInput.value = '';

    const socket = getChatSocket(mediaPk);

    addComment(mediaPk, messageText)
        .then(commentData => {
            const commentElement = createCommentElement(commentData);
            document.querySelector('.c_window_' + mediaPk).appendChild(commentElement);

            socket.send(JSON.stringify({
                'text': commentData.text,
                'media': mediaPk,
                'user': commentData.user.picture,
                'created_at': commentData.created_at,
                'id': commentData.id
            }));
        })
        .catch(error => {
            console.error('Ошибка при добавлении комментария:', error);
        });
}

// Функция для создания DOM элемента комментария
function createCommentElement(commentData) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('user');

    const userInfoElement = document.createElement('div');
    userInfoElement.classList.add('user_info');

    const userIconElement = document.createElement('div');
    userIconElement.classList.add('user_icon');
    userIconElement.style.backgroundImage = `url('${commentData.user.picture}')`;
    userInfoElement.appendChild(userIconElement);

    const messageInfoElement = document.createElement('div');
    messageInfoElement.classList.add('message_info');

    const userNameElement = document.createElement('span');
    userNameElement.classList.add('user_name');
    userNameElement.textContent = commentData.user.username;
    messageInfoElement.appendChild(userNameElement);

    const timeElement = document.createElement('small');
    timeElement.classList.add('time');
    timeElement.textContent = new Date(commentData.created_at).toLocaleString();
    messageInfoElement.appendChild(timeElement);

    userInfoElement.appendChild(messageInfoElement);
    messageElement.appendChild(userInfoElement);

    const userTextElement = document.createElement('p');
    userTextElement.classList.add('user_text');
    userTextElement.textContent = commentData.text;
    messageElement.appendChild(userTextElement);

    return messageElement;
}

// Функция для отправки POST-запроса на добавление комментария
function addComment(mediaId, commentText) {
    const data = {
        media: mediaId,
        text: commentText
    };

    return fetch('/comments/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}

// Функция для получения значения cookie по имени
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Подключение функции sendMessage к кнопке отправки для каждого чата


// Подключение функции sendMessage к кнопке отправки для каждого чата
document.querySelectorAll('.messages_send').forEach(sendButton => {
  sendButton.addEventListener('click', (event) => {
      const mediaPk = sendButton.querySelector('img[data-media-pk]').getAttribute('data-media-pk');
      sendMessage(mediaPk);
  });
});