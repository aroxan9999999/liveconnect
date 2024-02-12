function change(elementId) {
    const element = document.getElementById(elementId);


    if (element.style.display === "none" || element.style.display === "") {
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
    if (elementId === "comment_wraper" && element.style.display !== "none") {
        document.body.classList.add('noscroll');
        cWindow.scrollTop = cWindow.scrollHeight;
        document.body.classList.remove('noscroll');
    }

}


function someOtherFunction(elementId) {
    // Do something with the elementId
    console.log("Element ID: " + elementId);
}
const insertEmoji = (emoji) => {
    const messageInput = document.getElementById('message_input');
    messageInput.value += emoji;
    messageInput.focus();
};

function scrollToBottom() {
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


scrollToBottom();


function music() {
    const csrfToken = getCookie('csrftoken')
    fetch('/music/', {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
    })
        .then(response => response.text())
        .then(data => console.log(data));
}


const cWindow = document.querySelector('.c_window');

cWindow.addEventListener('mouseenter', () => {
    document.body.classList.add('noscroll');
});

cWindow.addEventListener('mouseleave', () => {
    document.body.classList.remove('noscroll');
});



document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("customVideoPlayer");
    const slider = document.getElementById("videoSlider");
    const videoContainer = document.getElementById("customControls"); // Убедитесь, что у вас есть этот контейнер в HTML
    let clickTimeout = null; // Таймаут для определения одиночного клика
    let mouseHoverTimeout = null; // Таймер для задержки скрытия ползунка
    let controlTimeout_mouse

    // Показываем ползунок при наведении на видео
    video.addEventListener('mouseover', () => {
        videoContainer.style.opacity = 1;
        clearTimeout(mouseHoverTimeout);
    });

    // Скрываем ползунок после того, как курсор ушел с видео
    video.addEventListener('mouseout', () => {
        mouseHoverTimeout = setTimeout(() => {
            videoContainer.style.opacity = 0;
        }, 2000); // Задержка перед скрытием ползунка
    });

    // Инициализация видео и ползунка после загрузки метаданных
    video.addEventListener('loadedmetadata', () => {
        music()
        slider.max = video.duration;

    });

    // Обновление ползунка по мере воспроизведения видео
    video.addEventListener('timeupdate', () => {
        slider.value = video.currentTime;
    });


    // Переключение звука одинарным кликом
    video.addEventListener('click', () => {
        if (clickTimeout !== null) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
        } else {
            clickTimeout = setTimeout(() => {
                video.muted = !video.muted;
                displayMessage(video.muted ? "Sound off" : "Sound on");
                clickTimeout = null;
            }, 300); // Дает время для определения, является ли клик частью двойного клика
        }
    });

    // Функция для переключения пользовательского полноэкранного режима
    let fullscreenTimeout;

    function showControls() {
        videoContainer.style.opacity = 1;
        clearTimeout(fullscreenTimeout);
        fullscreenTimeout = setTimeout(() => {
            // Скрываем элементы управления, если видео воспроизводится и мы находимся в полноэкранном режиме
            if (!video.paused && video.hasAttribute('data-fullscreen')) {
                videoContainer.style.opacity = 0;
            }
        }, 3000); // Элементы управления скроются через 3 секунды бездействия
    }

    // Показываем элементы управления при движении мыши или нажатии клавиш
    document.addEventListener('mousemove', showControls);
    document.addEventListener('keydown', showControls);

    function toggleCustomFullscreen() {
        const fullscreenElement = document.fullscreenElement || document.mozFullScreenElement ||
            document.webkitFullscreenElement || document.msFullscreenElement;

        if (!fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) { // Firefox
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
                document.documentElement.msRequestFullscreen();
            }
            video.setAttribute('data-fullscreen', 'true');
            video.style.position = 'fixed';
            video.style.top = '0';
            video.style.left = '0';
            video.style.width = '100vw';
            video.style.height = '100vh';
            video.style.zIndex = '1000';
            slider.style.visibility = 'visible';
            document.body.style.cursor = 'none'; // Make cursor invisible
            controlTimeout = setTimeout(() => {
                slider.style.visibility = 'hidden';
            }, 2000); // Hide controls after 2 seconds of inactivity
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) { // Firefox
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE/Edge
                document.msExitFullscreen();
            }
            video.removeAttribute('data-fullscreen');
            video.style.position = '';
            video.style.top = '';
            video.style.left = '';
            video.style.width = '';
            video.style.height = '';
            video.style.zIndex = '';
            document.body.style.cursor = ''; // Make cursor visible
            clearTimeout(controlTimeout);
        }
    }

    video.addEventListener('mousemove', () => {
        slider.style.visibility = 'visible';
        showTooltip("Press 'P' to play/pause, 'F' for fullscreen");
        document.body.style.cursor = ''; // Show the cursor
        controlTimeout_mouse = setTimeout(() => {
            slider.style.visibility = 'hidden';
            document.body.style.cursor = 'none'; // Hide the cursor again after 2 seconds
        }, 1000);
    });

    video.addEventListener('mouseleave', () => {
        clearTimeout(controlTimeout_mouse); // Prevent hiding controls if the cursor is not on the video
    });

    // Tooltip function
    function showTooltip(message) {
        const tooltip = document.getElementById('videoTooltip') || createTooltip();
        tooltip.textContent = message;
        tooltip.style.visibility = 'visible';
        setTimeout(() => {
            tooltip.style.visibility = 'hidden';
        }, 5000);
    }
    // Переключение режима двойным кликом
    video.addEventListener('dblclick', () => {
        clearTimeout(clickTimeout); // Отменяем таймаут для одиночного клика
        clickTimeout = null;
        toggleCustomFullscreen();
        displayMessage(video.hasAttribute('data-fullscreen') ? "Fullscreen mode" : "Exit fullscreen mode");
    });

    // Пауза и воспроизведение с клавиши "P"
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'p' || e.key === 'з') {
            if (video.paused) {
                video.play();
                displayMessage("Playing");
            } else {
                video.pause();
                displayMessage("Paused");
            }
        } else if (e.key.toLowerCase() === 'f' || e.key === 'а') { // Для 'f' и 'а' (англ. и рус. раскладки)
            toggleCustomFullscreen();
        }
    });

    // Функция для отображения сообщений
    function displayMessage(message) {
        const messageDiv = document.getElementById('videoMessage') || createMessageDiv();
        messageDiv.innerText = message;
        messageDiv.style.display = 'block';
        clearTimeout(mouseHoverTimeout);
        mouseHoverTimeout = setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000); // Сообщение исчезает через 2 секунды
    }

    // Создание div для сообщений, если он не существует
    function createMessageDiv() {
        const messageDiv = document.createElement('div');
        messageDiv.id = 'videoMessage';
        document.body.appendChild(messageDiv);
        messageDiv.style.position = 'fixed';
        messageDiv.style.bottom = '20px';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translateX(-50%)';
        messageDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
        messageDiv.style.color = 'white';
        messageDiv.style.padding = '5px 10px';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.zIndex = '2001';
        messageDiv.style.display = 'none';
        return messageDiv;
    }

    function createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'videoTooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.bottom = '10px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.zIndex = '3000';
        tooltip.style.background = 'rgba(0,0,0,0.75)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '5px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '14px';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        return tooltip;
    }

});




const videoContainer = document.getElementById('customVideoPlayer');
const slider_s = document.getElementById("videoSlider");
const icons = document.querySelector('.reels_icon')

// Set initial scroll position
window.scrollBy(0, 10);

// Wait for 1 second before enabling scrolling
setTimeout(() => {
    document.addEventListener('wheel', handleScroll);
}, 1000);

function handleScroll(event) {
    if (!document.body.classList.contains('noscroll')) {
        const scrollDirection = event.deltaY;

        if (scrollDirection > 0) {
            if (next_reel_url !== 'None') {
                videoContainer.style.opacity = 1;
                slider_s.style.opacity = 1;
                document.body.classList.add('scrolling');

                setTimeout(() => {
                    videoContainer.style.opacity = 0.2;
                    icons.style.opacity = 0.1;
                    document.body.classList.remove('scrolling');
                    window.location = next_reel_url;
                }, 1000);
            }
        } else {
            if (previous_reel_url !== 'None') {
                videoContainer.style.opacity = 1;
                slider_s.style.opacity = 1;
                document.body.classList.add('scrolling');

                setTimeout(() => {
                    videoContainer.style.opacity = 0.2;
                    slider_s.style.opacity = 0.1;
                    icons.style.opacity = 0.1;
                    document.body.classList.remove('scrolling');
                    window.location = previous_reel_url;
                }, 1500);
            }
        }
    }
}


// Remove event listeners after scrolling is complete
setTimeout(() => {
    document.removeEventListener('wheel', handleScroll);
}, 999);