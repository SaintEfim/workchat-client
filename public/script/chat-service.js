// chat-service.js

// =======================================
// Константы URL API для чатов
// =======================================
const CHAT_API_URL = 'http://localhost:1006/api/v1/chats';

// =======================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ЧАТАМИ
// =======================================
/**
 * Создает новый чат через API chat service.
 * Формирует DTO согласно структуре ChatCreate:
 * {
 *   name: string,
 *   is_group: boolean,
 *   employee_ids: [uuid, uuid]
 * }
 * @param {Object} employee – выбранный сотрудник.
 * @returns {Promise<Object>} – данные созданного чата.
 */
async function createChat(employee) {
  // Предполагается, что функции getAccessToken() и getUserId() доступны глобально
  const accessToken = getAccessToken();
  const currentUserId = getUserId();

  if (!currentUserId || !accessToken) {
    throw new Error("User ID или access token не найдены");
  }

  const chatCreateDto = {
    name: `Чат с ${employee.name} ${employee.surname}`,
    is_group: false,
    employee_ids: [currentUserId, employee.id]
  };

  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(chatCreateDto)
  });

  if (!response.ok) {
    throw new Error(`Ошибка при создании чата! Статус: ${response.status}`);
  }

  return await response.json();
}

/**
 * Открывает чат с выбранным сотрудником.
 * Вызывает API для создания чата, а затем открывает окно чата.
 * @param {Object} employee
 */
export async function openChatWithEmployee(employee) {
  try {
    const chat = await createChat(employee);
    console.log("Чат успешно создан:", chat);
    // Здесь можно реализовать логику открытия окна чата, например:
    // window.location.href = `chat.html?chatId=${chat.id}`;
  } catch (error) {
    console.error("Ошибка при открытии чата:", error);
  }
}
