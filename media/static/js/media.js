document.addEventListener('DOMContentLoaded', () => {
  const mediaElements = document.querySelectorAll('.media');

  mediaElements.forEach(mediaDiv => {
    const mediaId = mediaDiv.getAttribute('id').split('-')[1];
    let mediaFilesUrls;
    try {
      mediaFilesUrls = JSON.parse(mediaDiv.getAttribute('data-media-list-urls').replace(/'/g, '"'));
      console.log(mediaFilesUrls, 'asdasdasdasd')
    } catch (error) {
      console.error('Ошибка парсинга JSON для медиа с ID', mediaId, error);
      return;
    }

    // Находим элемент img с идентификатором "heart-media_{{ media.pk }}"
    const imgElement = document.getElementById(`heart-media_${mediaFilesUrls.id}`);

    // Если элемент найден, устанавливаем его src
    if (imgElement) {
      imgElement.src = '/static/' + mediaFilesUrls.src;

      // Находим соседний элемент span
      const spanElement = imgElement.nextElementSibling;
      if (spanElement) {
        if (mediaFilesUrls.hearts_count === 0) {
          // Если равно нулю, устанавливаем текст в пустую строку
          spanElement.textContent = '';
        } else {
          // Иначе устанавливаем значение hearts_count
          spanElement.textContent = mediaFilesUrls.hearts_count;
        }
      }
    }
    let currentIndex = parseInt(mediaDiv.getAttribute('data-current-index'), 10) || 0;

    // Функция для обновления изображения
    function updateImage() {
      if (mediaFilesUrls.files && mediaFilesUrls.files.length > currentIndex) {
        const mediaUrl = mediaFilesUrls.files[currentIndex];
        if (isVideo(mediaUrl)) {
          // Если медиа - видео, создаем и вставляем элемент <video>
          const videoElement = document.createElement('video');
          videoElement.style.objectFit = 'cover'
          videoElement.src = mediaUrl;
          videoElement.autoplay = true
          videoElement.loop = true;
          videoElement.muted = true;
          videoElement.controls = false;
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';

          mediaDiv.innerHTML = '';

          // Добавляем обработчик события для наведения курсора мыши на видео
          videoElement.addEventListener('mouseover', function () {
            videoElement.play(); // Воспроизводим видео при наведении
          });

          // Добавляем обработчик события для клика на видео
          videoElement.addEventListener('click', function () {
            if (videoElement.muted) {
              videoElement.muted = false; // Включаем звук, если был выключен
            } else {
              videoElement.muted = true; // Выключаем звук, если был включен
            }
          });


          // Вставляем видеоэлемент в .media
          mediaDiv.appendChild(videoElement);

          const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              // Если видео находится в видимой части окна
              if (entry.intersectionRatio > 0.7) {
                videoElement.play(); // Воспроизводим видео
              } else {
                videoElement.pause(); // Приостанавливаем видео
              }
            });
          }, {
            threshold: 0.7 // Порог видимости для обнаружения видео (в данном случае, если видео видно на 70% или более)
          });

          // Наблюдаем за видеоэлементом
          observer.observe(videoElement);
        } else {
          // Иначе устанавливаем фоновое изображение
          mediaDiv.style.backgroundImage = 'url(' + mediaUrl + ')';
        }
      } else {
        console.log('Нет изображений или видео для медиа с ID ' + mediaId);
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

  const mediaFilesUrls = JSON.parse(mediaDiv.dataset.mediaListUrls.replace(/'/g, '"'));

  let currentIndex = parseInt(mediaDiv.dataset.currentIndex, 10) || 0;

  currentIndex += direction;
  if (currentIndex >= mediaFilesUrls.files.length) {
    currentIndex = 0;
  } else if (currentIndex < 0) {
    currentIndex = mediaFilesUrls.files.length - 1;
  }

  mediaDiv.dataset.currentIndex = currentIndex;

  const mediaUrl = mediaFilesUrls.files[currentIndex];

  // Удаляем предыдущий медиа-элемент, если он существует и является видео
  const previousMediaElement = mediaDiv.querySelector('video');
  if (previousMediaElement) {
    previousMediaElement.pause();
    mediaDiv.removeChild(previousMediaElement);
  }


  mediaDiv.style.backgroundImage = 'none';

  if (isVideo(mediaUrl)) {
    // Если медиа - видео, создаем и вставляем элемент <video>
    const videoElement = document.createElement('video');
    videoElement.src = mediaUrl;
    videoElement.style.objectFit = 'cover';
    videoElement.autoplay = true;
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.controls = false;
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';

    // Добавляем обработчик события для наведения курсора мыши на видео
    videoElement.addEventListener('mouseover', function () {
      videoElement.play();
    });

    // Добавляем обработчик события для клика на видео
    videoElement.addEventListener('click', function () {
      if (videoElement.muted) {
        videoElement.muted = false;
      } else {
        videoElement.muted = true;
      }
    });


    videoElement.addEventListener('play', function () {
      videoElement.muted = false;
    });


    videoElement.addEventListener('pause', function () {
      videoElement.muted = true;
    });



    mediaDiv.appendChild(videoElement);


    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.intersectionRatio > 0.7) {
          videoElement.play();
        } else {
          videoElement.pause();
        }
      });
    }, {
      threshold: 0.7
    });

    observer.observe(videoElement);
  } else {
    mediaDiv.style.backgroundImage = 'url(' + mediaUrl + ')';
  }
}



// Проверка, является ли URL медиа видео
function isVideo(url) {
  return ['.mp4', '.webm', '.ogg'].some(ext => url.endsWith(ext));
}



const openEmojiPanel = (panelId) => {
  const emojiPanel = document.getElementById(`emojiPanel_${panelId}`);
  emojiPanel.style.display = emojiPanel.style.display === 'none' ? 'block' : 'none';
};


const insertEmoji = (emoji, panelId) => {
  const messageInput = document.getElementById(`messageInput_${panelId}`);
  messageInput.value += emoji;
  messageInput.focus();
};

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
    display: none;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-content: flex-start;
    position: absolute;
    top: 10%;
    right: 1%;
    height: 666px;
    width: 500px;
    overflow-y: scroll;
`;
menuCreate.appendChild(previewContainer);

const inputFile = document.querySelector('.media-file');


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
      media.controls = false;
      media.autoplay = true;
      media.loop = true;
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
    previewContainer.style.display = 'flex';
    previewContainer.style.border = 'none'
    previewContainer.appendChild(previewDiv);
  });
}



// При отправке формы добавляем выбранные файлы в FormData
let selectedFiles = [];
// Получаем элементы формы и кнопки
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.form-media');
  const submitButton = document.querySelector('#submit-files-button'); // Убедитесь, что у кнопки есть этот id

  const inputFile = document.querySelector('.media-file');
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

  document.getElementById('reelForm').addEventListener('submit', function (e) {
    e.preventDefault();  // Предотвращаем стандартную отправку формы

    const formData = new FormData(this);
    const csrftoken = getCookie('csrftoken'); // Получаем CSRF-токен из кук

    fetch('/create_reels/', {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRFToken': csrftoken, // Добавляем CSRF-токен в заголовок запроса
      },
      credentials: 'include', // Указываем, чтобы куки (включая CSRF-токен) были включены в запрос
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          window.location.href = data.redirect;  // Перенаправление на URL, полученный от сервера
        } else {
          alert("An error occurred, please try again.");
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  });

});




function hide_scrollMaxBottom(mediaPk) {
  const mediaCommentWindow = document.querySelector(`.c_window_${mediaPk}`);
  const parentElement = mediaCommentWindow.parentElement;
  if (parentElement.style.display === 'block') {
    parentElement.style.display = 'none';
    const emojiPanel = document.getElementById(`emojiPanel_${mediaPk}`);
    if (emojiPanel && emojiPanel.style.display === 'block') {
      emojiPanel.style.display = 'none';
    }
  } else {
    parentElement.style.display = 'block';
    mediaCommentWindow.scrollTop = mediaCommentWindow.scrollHeight;
  }
}


