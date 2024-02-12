const chatSockets = {};

async function getChatSocket(mediaId) {
    if (!chatSockets[mediaId]) {
        chatSockets[mediaId] = new WebSocket(`ws://${window.location.host}/ws/chat/media/${parseInt(mediaId, 10)}/`);

        chatSockets[mediaId].onopen = function (event) {
            console.log('WebSocket opened:', event);
        };

        chatSockets[mediaId].onmessage = function (event) {
            const data = JSON.parse(event.data);
            console.log("data", data);
            increaseCommentCountById(data.media)
            if (data.media === mediaId) {
                const commentElement = createCommentElement(data);
                console.log(data);
                document.querySelector(`.c_window_${mediaId}`).appendChild(commentElement);
            }
        };

        chatSockets[mediaId].onerror = function (event) {
            console.error('WebSocket error:', event);
        };

        chatSockets[mediaId].onclose = function (event) {
            console.log('WebSocket closed:', event);
        };
    }

    return chatSockets[mediaId];
}

async function hideEmojiPanel(media_pk) {
    return new Promise((resolve, reject) => {
        try {
            const emojiPanelId = `emojiPanel_${media_pk}`;
            const emojiPanelElement = document.getElementById(emojiPanelId);
            if (emojiPanelElement) {
                emojiPanelElement.style.display = 'none';
                resolve();
            } else {
                reject(`Emoji panel with id ${emojiPanelId} not found.`);
            }
        } catch (error) {
            reject(error);
        }
    });
}


document.querySelectorAll('.messages_send img[data-media-pk]').forEach(sendButton => {
    const mediaPk = sendButton.getAttribute('data-media-pk');
    getChatSocket(mediaPk);

    sendButton.addEventListener('click', async () => {
        const messageInput = document.querySelector(`#messageInput_${mediaPk}`);
        if (messageInput.value.trim()) {
            await sendMessage(mediaPk);
            await hideEmojiPanel(mediaPk);
        }
    });
});

document.querySelectorAll('.messages_send input[type="text"]').forEach(inputField => {
    const mediaPk = inputField.closest('.messages_send').querySelector('img[data-media-pk]').getAttribute('data-media-pk');
    getChatSocket(mediaPk);

    inputField.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const messageInput = document.querySelector(`#messageInput_${mediaPk}`);
            if (messageInput.value.trim()) {
                await sendMessage(mediaPk);
                await hideEmojiPanel(mediaPk);
            }
        }
    });
});


async function scrollToBottom(mediaPk) {
    const mediaCommentWindow = document.querySelector(`.c_window_${mediaPk}`);
    await new Promise(resolve => {
        setTimeout(() => {
            mediaCommentWindow.scrollTop = mediaCommentWindow.scrollHeight;
            resolve();
        }, 100); // Задержка для гарантии, что вставка завершилась перед скроллингом
    });
}

function increaseCommentCountById(id) {
    const element = document.getElementById(`count_comments_by_${id}`);
    let currentCount = element.textContent.trim();
    currentCount = parseInt(currentCount) + 1;
    element.textContent = currentCount;
}


async function sendMessage(mediaPk) {
    const messageInput = document.querySelector(`#messageInput_${mediaPk}`);
    const messageText = messageInput.value.trim();

    if (!messageText) {
        return;
    }

    messageInput.value = '';

    try {
        const socket = await getChatSocket(mediaPk);
        const commentData = await addComment(mediaPk, messageText);
        console.log("Received commentData before createCommentElement:", commentData);

        socket.send(JSON.stringify({
            text: commentData.text,
            media: mediaPk,
            user: commentData.user.picture,
            username: commentData.user.username,
            created_at: commentData.created_at,
            id: commentData.id
        }));
        await hideEmojiPanel(mediaPk);
        await scrollToBottom(mediaPk);
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

function createCommentElement(commentData) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('user');

    const userInfoElement = document.createElement('div');
    userInfoElement.classList.add('user_info');

    const userIconWrapper = document.createElement('div');
    userIconWrapper.classList.add('user_icon_wrap');

    const userIconElement = document.createElement('div');
    userIconElement.classList.add('user_icon');
    userIconElement.style.backgroundImage = `url('${commentData.user.picture}')`;

    userIconWrapper.appendChild(userIconElement);
    userInfoElement.appendChild(userIconWrapper);

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

async function addComment(mediaId, commentText) {
    const data = {
        media: parseInt(mediaId),
        text: commentText
    };

    console.log("Отправка комментария:", data);

    try {
        const response = await fetch('/comments/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        });

        console.log("Получен ответ:", response);

        if (!response.ok) {
            console.error('Ошибка запроса:', response.statusText);
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        console.log("Ответ JSON:", responseData);
        return responseData;
    } catch (error) {
        console.error('Ошибка при добавлении комментария:', error);
        throw error;
    }
}
