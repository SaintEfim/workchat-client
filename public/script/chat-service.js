import { fetchCurrentUser, getAccessToken } from './employees-service.js';

const CHAT_API_URL = 'http://localhost:1006/api/v1/chats';

/**
 * Получает чат между текущим пользователем и выбранным сотрудником.
 * @param {string} colleagueId – ID выбранного сотрудника.
 * @returns {Promise<Object|null>} – объект чата или null, если чат не найден.
 */
async function getChatWithEmployee(colleagueId) {
  try {
    const currentUser = await fetchCurrentUser();
    const accessToken = getAccessToken();

    if (!accessToken) {
      throw new Error("Access token не найден");
    }

    // Формируем URL с параметрами
    const url = `${CHAT_API_URL}/user/${currentUser.id}?colleagueId=${colleagueId}&is_group=false`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        //'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения чатов: ${response.status}`);
    }

    const chats = await response.json();
    // Если найден хотя бы один чат – возвращаем его
    return chats.length > 0 ? chats[0] : null;
  } catch (error) {
    console.error("Ошибка при получении чата", error);
    return null;
  }
}

/**
 * Создает новый чат с выбранным сотрудником.
 * @param {Object} employee – выбранный сотрудник.
 * @returns {Promise<Object>} – объект созданного чата.
 */
async function createChat(employee) {
  try {
    const currentUser = await fetchCurrentUser();
    const accessToken = getAccessToken();

    if (!accessToken) {
      throw new Error("Access token не найден");
    }

    const chatData = {
      name: `Чат: ${currentUser.name} & ${employee.name}`,
      is_group: false,
      employee_ids: [currentUser.id, employee.id]
    };

    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        //'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(chatData)
    });

    if (!response.ok) {
      throw new Error(`Ошибка создания чата: ${response.status}`);
    }

    const createdChat = await response.json();
    console.log("Чат успешно создан:", createdChat);
    return createdChat;
  } catch (error) {
    console.error("Ошибка при создании чата", error);
    throw error;
  }
}

/**
 * Загружает сообщения для чата и обновляет UI.
 * @param {string} chatId – ID чата.
 */
async function loadChatMessages(chatId) {
  const messageContainer = document.querySelector('.main-chat .message-container');
  if (!messageContainer) return;

  messageContainer.innerHTML = '';

  try {
    const accessToken = getAccessToken();
    const response = await fetch(`http://localhost:1006/api/v1/messages/chat/${chatId}`, {
      headers: {
        'Content-Type': 'application/json',
        //'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки сообщений: ${response.status}`);
    }

    const messages = await response.json();

    messages.forEach(message => {
      const messageEl = document.createElement('div');
      messageEl.classList.add('message');
      messageEl.textContent = message.text;

      const timeEl = document.createElement('div');
      timeEl.classList.add('message-time');
      timeEl.textContent = message.time;

      messageEl.appendChild(timeEl);
      messageContainer.appendChild(messageEl);
    });
  } catch (error) {
    console.error("Ошибка загрузки сообщений", error);
  }
}

/**
 * Открывает или создает чат с выбранным сотрудником.
 * @param {Object} employee – выбранный сотрудник.
 */
export async function openChatWithEmployee(employee) {
  try {
    let chat = await getChatWithEmployee(employee.id);
    
    if (!chat) {
      chat = await createChat(employee);
    }

    loadChatMessages(chat.id);
  } catch (error) {
    console.error("Ошибка при открытии чата", error);
  }
}

/**
 * Загружает все чаты текущего пользователя и обновляет UI боковой панели.
 */
export async function loadUserChats() {
  try {
    const currentUser = await fetchCurrentUser();
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error("Access token не найден");
    }

    const response = await fetch(`${CHAT_API_URL}/user/${currentUser.id}`, {
      headers: {
        'Content-Type': 'application/json',
        //'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения чатов: ${response.status}`);
    }

    const chats = await response.json();
    const chatListContainer = document.querySelector('.chat-list');
    if (!chatListContainer) return;
    chatListContainer.innerHTML = '';

    if (chats.length === 0) {
      chatListContainer.innerHTML = '<p>Чаты не найдены</p>';
      return;
    }

    chats.forEach(chat => {
      const chatItem = document.createElement('div');
      chatItem.classList.add('chat-item');
      chatItem.innerHTML = `
        <div class="chat-avatar"></div>
        <div>
          <h4>${chat.name}</h4>
        </div>
      `;

      // При клике загружаем переписку данного чата
      chatItem.addEventListener('click', () => {
        loadChatMessages(chat.id);
      });

      chatListContainer.appendChild(chatItem);
    });
  } catch (error) {
    console.error("Ошибка при загрузке чатов пользователя", error);
  }
}

// При загрузке страницы загружаем чаты пользователя
document.addEventListener('DOMContentLoaded', loadUserChats);
