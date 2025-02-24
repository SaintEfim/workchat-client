import { fetchCurrentUser, getAccessToken } from './employees-service.js';

const CHAT_API_URL = 'http://localhost:1006/api/v1/chats';

/**
 * Проверяет, существует ли приватный чат между текущим пользователем и заданным сотрудником.
 * Эндпоинт: GET /api/v1/chats/user/{user_id}/colleague/{colleague_id}
 */
async function privateChatExists(colleagueId) {
  const currentUser = await fetchCurrentUser();
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token не найден");
  }

  const checkUrl = `${CHAT_API_URL}/user/${currentUser.id}/colleague/${colleagueId}`;
  const response = await fetch(checkUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Ошибка проверки чата: ${response.status}`);
  }

  const data = await response.json();
  return data.exists; // булево значение
}

/**
 * Получает приватный чат между текущим пользователем и указанным сотрудником (colleagueId).
 * Эндпоинт: GET /api/v1/chats/user/{user_id}?colleagueId=...&is_group=false
 * Возвращает первый найденный чат или null.
 */
async function getChatWithEmployee(colleagueId) {
  try {
    const currentUser = await fetchCurrentUser();
    const accessToken = getAccessToken();

    if (!accessToken) {
      throw new Error("Access token не найден");
    }

    // Запрашиваем чаты текущего пользователя с фильтрами colleagueId и is_group=false
    const url = `${CHAT_API_URL}/user/${currentUser.id}?colleagueId=${colleagueId}&is_group=false`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения чата: ${response.status}`);
    }

    const chats = await response.json();
    // Если найдены чаты, возвращаем первый; иначе null
    return chats.length > 0 ? chats[0] : null;
  } catch (error) {
    console.error("Ошибка при получении чата", error);
    return null;
  }
}

/**
 * Создаёт новый приватный чат (без имени), в котором участвуют текущий пользователь и сотрудник.
 */
async function createChat(employee) {
  try {
    const currentUser = await fetchCurrentUser();
    const accessToken = getAccessToken();

    if (!accessToken) {
      throw new Error("Access token не найден");
    }

    // Имя чата оставляем пустым, чтобы потом отображать как "Private Chat"
    const chatData = {
      name: ``,
      is_group: false,
      employee_ids: [currentUser.id, employee.id],
    };

    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(chatData),
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
 */
export async function loadChatMessages(chatId) {
  const messageContainer = document.querySelector('.main-chat .message-container');
  if (!messageContainer) return;

  messageContainer.innerHTML = '';

  try {
    const currentUser = await fetchCurrentUser();
    const accessToken = getAccessToken();
    const response = await fetch(`http://localhost:1006/api/v1/messages/chat/${chatId}`, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки сообщений: ${response.status}`);
    }

    const messages = await response.json();

    messages.forEach(message => {
      const messageEl = document.createElement('div');

      // Если отправитель - текущий пользователь, сообщение исходящее
      if (message.employee_id === currentUser.id) {
        messageEl.classList.add('message', 'outgoing');
      } else {
        messageEl.classList.add('message');
      }

      // Текст сообщения
      const textEl = document.createElement('span');
      textEl.textContent = message.text;
      messageEl.appendChild(textEl);

      // Время сообщения
      const timeEl = document.createElement('div');
      timeEl.classList.add('message-time');
      const msgTime = new Date(message.created_at);
      timeEl.textContent = msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      messageEl.appendChild(timeEl);

      messageContainer.appendChild(messageEl);
    });
  } catch (error) {
    console.error("Ошибка загрузки сообщений", error);
  }
}

/**
 * Удаляет чат по его ID.
 */
async function deleteChat(chatId) {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error("Access token не найден");
    }
    const response = await fetch(`${CHAT_API_URL}/${chatId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${accessToken}`
      }
    });
    if (!response.ok) {
      throw new Error(`Ошибка удаления чата: ${response.status}`);
    }
    console.log(`Чат с ID ${chatId} успешно удален`);
  } catch (error) {
    console.error("Ошибка при удалении чата", error);
    throw error;
  }
}

/**
 * Открывает (или создаёт) приватный чат с выбранным сотрудником,
 * используя эндпоинт PrivateChatExists для проверки.
 */
export async function openChatWithEmployee(employee) {
  try {
    // 1. Проверяем, существует ли уже приватный чат
    const exists = await privateChatExists(employee.id);

    let chat;
    if (exists) {
      // 2. Если чат есть, получаем его
      chat = await getChatWithEmployee(employee.id);
    } else {
      // 3. Если чата нет, создаём новый
      chat = await createChat(employee);
      // И сразу обновляем список чатов, чтобы он отобразился слева
      await loadUserChats();
    }

    // 4. Загружаем сообщения, если чат получен
    if (chat) {
      loadChatMessages(chat.id);
    }
  } catch (error) {
    console.error("Ошибка при открытии чата", error);
  }
}

/**
 * Показывает контекстное меню (правый клик) для удаления чата.
 */
function showContextMenu(event, chat) {
  event.preventDefault();

  // Удаляем старое меню, если оно есть
  const existingMenu = document.querySelector('.chat-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  const contextMenu = document.createElement('div');
  contextMenu.classList.add('chat-context-menu');
  contextMenu.style.position = 'absolute';
  contextMenu.style.top = `${event.pageY}px`;
  contextMenu.style.left = `${event.pageX}px`;
  contextMenu.style.background = '#fff';
  contextMenu.style.border = '1px solid #ccc';
  contextMenu.style.padding = '5px';
  contextMenu.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
  contextMenu.style.zIndex = '1000';

  const deleteOption = document.createElement('div');
  deleteOption.classList.add('chat-context-menu-item');
  deleteOption.textContent = 'Удалить чат';
  deleteOption.style.padding = '5px 10px';
  deleteOption.style.cursor = 'pointer';
  deleteOption.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (confirm("Вы уверены, что хотите удалить этот чат?")) {
      try {
        await deleteChat(chat.id);
        loadUserChats();
      } catch (error) {
        alert("Ошибка удаления чата");
      }
    }
    contextMenu.remove();
  });

  contextMenu.appendChild(deleteOption);
  document.body.appendChild(contextMenu);

  // Скрываем меню при клике вне его
  document.addEventListener('click', function removeContextMenu() {
    contextMenu.remove();
    document.removeEventListener('click', removeContextMenu);
  });
}

/**
 * Загружает все чаты текущего пользователя и отображает их в левой панели.
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
        // 'Authorization': `Bearer ${accessToken}`
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

      // Если имя чата пустое (приватный чат) - формируем название по собеседнику
      let chatTitle = chat.name;
      if (!chatTitle || chatTitle.trim() === '') {
        const colleague = chat.employees.find(emp => emp.id !== currentUser.id);
        chatTitle = colleague ? `${colleague.name} ${colleague.surname}` : "Private Chat";
      }

      chatItem.innerHTML = `
        <div class="chat-avatar"></div>
        <div class="chat-info">
          <h4>${chatTitle}</h4>
        </div>
      `;

      // При клике правой кнопкой — меню с опцией "Удалить"
      chatItem.addEventListener('contextmenu', (event) => {
        showContextMenu(event, chat);
      });

      // При клике левой кнопкой — открываем переписку
      chatItem.addEventListener('click', () => {
        loadChatMessages(chat.id);
      });

      chatListContainer.appendChild(chatItem);
    });
  } catch (error) {
    console.error("Ошибка при загрузке чатов пользователя", error);
  }
}

// При загрузке страницы — отображаем все чаты и вешаем обработчик на "Все чаты"
document.addEventListener('DOMContentLoaded', () => {
  const allChatsBtn = document.getElementById('allChatsBtn');
  if (allChatsBtn) {
    allChatsBtn.addEventListener('click', () => {
      loadUserChats();
    });
  }

  loadUserChats();
});
