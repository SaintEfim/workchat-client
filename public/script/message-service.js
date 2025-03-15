import { fetchCurrentUser, getAccessToken } from './employees-service.js';

const MESSAGE_SERVICE_WS_URL = 'ws://localhost:1007/api/v1/messages/connect';
const MESSAGE_SERVICE_HTTP_URL = 'http://localhost:1007/api/v1/messages';

export let messageSocket = null;
let currentChat = null;
const subscriptions = new Set();

export function setCurrentChat(chatId) {
  if (currentChat !== chatId) {
    currentChat = chatId;
    if (chatId && !subscriptions.has(chatId)) {
      subscriptions.add(chatId);
    }
  }
}

export function connectMessageService(clientId) {
  // Если сокет уже создан и открыт, повторное подключение не требуется
  if (messageSocket && messageSocket.readyState === WebSocket.OPEN) {
    console.log("WebSocket уже подключен");
    return;
  }

  const token = getAccessToken();
  if (!token) {
    console.error("Токен не найден");
    return;
  }

  const wsUrl = new URL(MESSAGE_SERVICE_WS_URL);
  wsUrl.searchParams.append('token', encodeURIComponent(token));
  
  messageSocket = new WebSocket(wsUrl.toString());

  messageSocket.onopen = () => {
    messageSocket.send(JSON.stringify({ Id: clientId }));
    console.log('WebSocket подключен');
    restoreSubscriptions();
  };

  messageSocket.onmessage = event => handleSocketMessage(event);
  messageSocket.onerror = error => console.error('WebSocket ошибка:', error);
}

function handleSocketMessage(event) {
  try {
    console.log('Получено WS сообщение:', event.data);
    const data = JSON.parse(event.data);
    
    if (data.text && data.create_at) {
      console.log('Добавление сообщения в чат:', data);
      handleNewMessage(data);
    } else {
      console.warn('Неизвестный формат сообщения:', data);
    }
  } catch (e) {
    console.error("Ошибка обработки сообщения:", e);
  }
}

function handleNewMessage(message) {
  if (currentChat) {
    addMessageToChat(message);
  }
}

function restoreSubscriptions() {
  if (subscriptions.size > 0) {
    console.log('Восстановление подписок:', Array.from(subscriptions));
  }
}

export async function sendMessage(messageData) {
  const token = getAccessToken();
  try {
    console.log('Отправка сообщения:', messageData);
    const response = await fetch(MESSAGE_SERVICE_HTTP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        chat_id: messageData.chatId,
        sender_id: messageData.senderId,
        receiver_id: messageData.receiverId,
        text: messageData.text
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Ошибка ${response.status}`);
    }
    
    console.log('Сообщение успешно отправлено, добавляем в UI:', messageData.text);
    addMessageToChat({
      text: messageData.text,
      create_at: new Date().toISOString(),
      sender_id: messageData.senderId
    });

    return data;
  } catch (error) {
    console.error('Ошибка отправки:', error);
    throw error;
  }
}

function addMessageToChat(message) {
  const messageContainer = document.querySelector('.message-container');
  if (!messageContainer) {
    console.warn('Контейнер сообщений не найден');
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const isOutgoing = message.sender_id === currentUser?.id;

  console.log('Добавление сообщения в DOM:', message);
  
  const messageHTML = `
    <div class="message ${isOutgoing ? 'outgoing' : ''}">
      ${!isOutgoing ? '<div class="message-avatar"></div>' : ''}
      <div class="message-content">
        <span>${message.text}</span>
        <div class="message-time">
          ${new Date(message.create_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  `;

  messageContainer.insertAdjacentHTML('beforeend', messageHTML);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}
