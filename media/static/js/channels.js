const xmn_chatSockets = {};

async function openChatSocketForImages() {
    const loveImages = document.querySelectorAll('img.love');
    for (let img of loveImages) { // Заменили const на let
        const objectId = img.getAttribute('data-object-id');
        const chanel_id = objectId.replace(/['"]/g, '');
        const xmn_socket = await media_hert_getChatSocket(chanel_id);
        console.log(xmn_socket, 'socket') // Ожидание получения сокета
        img.onclick = function (e) {        
            const userId = img.getAttribute('data-user-id');
            i_love_you(objectId.split("-").pop(), userId)
                .then(data => {
                                       
                    img.src = data.hearted ? "/media/static/icons/heart.svg" : "/media/static/icons/lowe.svg";

                    const jsonData = { hearts_count: data.hearts_count, object_Id: objectId.replace(/"/g, '')};
                    if (xmn_socket.readyState === WebSocket.OPEN) { // Проверка состояния сокета
                        xmn_socket.send(JSON.stringify(jsonData));
                    } else {
                        console.error('WebSocket is not open');
                    }
                    console.log(data);
                });
        };
    }
}



openChatSocketForImages();



async function media_hert_getChatSocket(channel_id) {
    if (!xmn_chatSockets[channel_id]) {
        xmn_chatSockets[channel_id] = new WebSocket(`ws://${window.location.host}/ws/toggle_heart/${channel_id}/`);

        xmn_chatSockets[channel_id].onopen = function (event) {
            console.log('WebSocket opened:', event);
        };

        xmn_chatSockets[channel_id].onmessage = function (e) {
            const data = JSON.parse(e.data);
            const objectId = data.object_id;
        
            const imageElement = document.getElementById(`${objectId}`);
            if (imageElement) {
                const loveNumberElement = imageElement.nextElementSibling;
                if (loveNumberElement && loveNumberElement.classList.contains('love_number')) {
                    loveNumberElement.textContent = data.hearts_count;
                } else {
                    console.error("Элемент с классом 'love_number' не найден или не существует.");
                }
            } else {
                console.error(`Элемент с ID 'heart-${objectId}' не найден.`);
            }
        };

        xmn_chatSockets[channel_id].onerror = function (event) {
            console.error('WebSocket error:', event);
        };

        xmn_chatSockets[channel_id].onclose = function (event) {
            console.log('WebSocket closed:', event);
        };
    }

    return xmn_chatSockets[channel_id];
}

async function i_love_you(objectId, userId) {
    const csrfToken = getCookie('csrftoken');
    const url = `/toggle_heart/${objectId}/${userId}/`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({})
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        return null; 
    }
}
