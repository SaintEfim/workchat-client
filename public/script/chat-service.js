// chat-service.js

import { fetchCurrentUser, getAccessToken } from './employees-service.js';


// Константа URL API для сервиса чатов
const CHAT_API_URL = 'http://localhost:1006/api/v1/chats';

/**
 * Создает новый чат с выбранным сотрудником.
 * @param {Object} employee – выбранный сотрудник.
 * @returns {Promise<Object>} – объект созданного чата.
 */
async function createChat(employee) {
  // Используем функции fetchCurrentUser и getAccessToken из employee-service.js
  try {
    const currentUser = await fetchCurrentUser();
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error("Access token не найден");
    }

    // Формируем объект для создания чата (ChatCreate DTO)
    const chatData = {
      name: ``,
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
 * Загружает сообщения для созданного чата и обновляет UI.
 * @param {string} chatId – идентификатор созданного чата.
 */
async function loadChatMessages(chatId) {
  const messageContainer = document.querySelector('.main-chat .message-container');
  if (!messageContainer) return;

  // Очищаем предыдущие сообщения
  messageContainer.innerHTML = '';

  try {
    const accessToken = getAccessToken();
    const response = await fetch(`http://localhost:1006/api/v1/chats/${chatId}/messages`, {
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
      // При желании можно сравнить senderId с id текущего пользователя для добавления класса 'outgoing'
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
 * Обрабатывает процесс открытия чата с выбранным сотрудником.
 * @param {Object} employee – выбранный сотрудник.
 */
export async function openChatWithEmployee(employee) {
  try {
    const createdChat = await createChat(employee);
    loadChatMessages(createdChat.id);
  } catch (error) {
    console.error("Ошибка при открытии чата", error);
  }
}
