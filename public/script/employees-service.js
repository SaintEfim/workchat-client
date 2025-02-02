// Константы URL API
const API_BASE_URL = 'http://localhost:1003/api/v1/employees';
const EMPLOYEE_API_URL = `${API_BASE_URL}/`; // для получения текущего сотрудника

// Глобальные переменные
let defaultChatListHTML = ""; // исходный HTML списка чатов

// ==============================
// UTILS
// ==============================

/**
 * Извлекает значение cookie по имени.
 * @param {string} name – имя cookie.
 * @returns {string|null}
 */
function getCookie(name) {
  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='));
  return value ? value.split('=')[1] : null;
}

/**
 * Получает токен доступа из cookie.
 * @returns {string|null}
 */
function getAccessToken() {
  return getCookie('accessToken');
}

/**
 * Получает идентификатор пользователя из cookie.
 * @returns {string|null}
 */
function getUserId() {
  return getCookie('userId');
}

// ==============================
// API FUNCTIONS
// ==============================

/**
 * Получает данные текущего сотрудника с сервера.
 * @returns {Promise<Object>}
 */
async function fetchCurrentUser() {
  const userId = getUserId();
  const accessToken = getAccessToken();

  if (!userId || !accessToken) {
    throw new Error("User ID or access token not found in cookies");
  }

  const response = await fetch(`${EMPLOYEE_API_URL}${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Выполняет поиск сотрудников по введённому запросу.
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function fetchEmployeesByQuery(query) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token not found in cookies");
  }

  const tokens = query.trim().split(/\s+/);
  let filters = "";
  if (tokens.length === 1) {
    filters = `name@=*${tokens[0]}`;
  } else if (tokens.length === 2) {
    filters = `name@=*${tokens[0]},surname@=*${tokens[1]}`;
  } else if (tokens.length >= 3) {
    filters = `name@=*${tokens[0]},surname@=*${tokens[1]},patronymic@=*${tokens[2]}`;
  }

  const params = new URLSearchParams();
  params.append("Filters", filters);

  const response = await fetch(`${API_BASE_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// ==============================
// UI FUNCTIONS
// ==============================

/**
 * Обновляет информацию о текущем пользователе в меню.
 * @param {Object} employee
 */
function updateUserInfo(employee) {
  const userInfoElement = document.querySelector('.menu-user-info h3');
  if (userInfoElement && employee) {
    userInfoElement.textContent = `${employee.name} ${employee.surname}`;
  }
}

/**
 * Открывает модальное окно профиля текущего пользователя.
 * @param {Object} employee
 */
function showProfileModal(employee) {
  const modal = document.getElementById("profileModal");
  modal.style.display = "flex";
  document.getElementById("profileName").textContent =
    `${employee.name} ${employee.surname} ${employee.patronymic || ""}`;
  document.getElementById("profilePosition").textContent =
    employee.position?.name || "Должность не указана";
  document.getElementById("profileEmail").textContent = employee.email || "";

  const patronymicSection = document.getElementById("patronymicSection");
  if (patronymicSection) {
    patronymicSection.style.display = employee.patronymic ? "block" : "none";
  }
}

/**
 * Закрывает модальное окно профиля.
 */
function closeProfileModal() {
  document.getElementById("profileModal").style.display = "none";
}

/**
 * Обновляет список сотрудников на странице.
 * @param {Array} employees
 */
function updateChatList(employees) {
  const chatListContainer = document.querySelector('.chat-list');
  if (!chatListContainer) return;

  chatListContainer.innerHTML = "";
  if (employees.length === 0) {
    chatListContainer.innerHTML = "<p>Сотрудники не найдены</p>";
    return;
  }

  employees.forEach(employee => {
    const chatItem = document.createElement("div");
    chatItem.classList.add("chat-item");
    chatItem.innerHTML = `
      <div class="chat-avatar"></div>
      <div>
        <h4>${employee.name} ${employee.surname}</h4>
        <p>${employee.position?.name || "Должность не указана"}</p>
      </div>
    `;

    // При клике на сотрудника открываем чат (а не профиль)
    chatItem.addEventListener("click", () => {
      openChatWithEmployee(employee);
    });
    chatListContainer.appendChild(chatItem);
  });
}

/**
 * Восстанавливает исходное содержимое списка чатов.
 */
function restoreDefaultChatList() {
  const chatListContainer = document.querySelector('.chat-list');
  if (chatListContainer && defaultChatListHTML) {
    chatListContainer.innerHTML = defaultChatListHTML;
  }
}

/**
 * Функция открытия чата с выбранным сотрудником.
 * Реализуйте логику по необходимости.
 * @param {Object} employee
 */
function openChatWithEmployee(employee) {
  console.log("Открываем чат с сотрудником:", employee);
  // Здесь можно реализовать переход в окно чата или иную логику.
}

// ==============================
// INITIALIZATION
// ==============================

/**
 * Инициализирует обработчики событий и загружает первоначальные данные.
 */
async function init() {
  // Сохраняем исходный HTML списка чатов
  const chatListContainer = document.querySelector('.chat-list');
  if (chatListContainer) {
    defaultChatListHTML = chatListContainer.innerHTML;
  }

  try {
    const currentUser = await fetchCurrentUser();
    updateUserInfo(currentUser);
  } catch (error) {
    console.error("Ошибка при получении данных текущего пользователя:", error);
  }

  // Обработчик для открытия профиля (только по клику на "Мой профиль")
  document
    .querySelector(".menu-item:nth-child(1)")
    .addEventListener("click", async () => {
      try {
        const currentUser = await fetchCurrentUser();
        showProfileModal(currentUser);
      } catch (error) {
        console.error("Ошибка при открытии профиля:", error);
      }
    });

  // Обработчики закрытия модального окна профиля
  document.querySelector(".close-btn").addEventListener("click", closeProfileModal);
  document.querySelector(".profile-modal").addEventListener("click", (e) => {
    if (e.target === document.querySelector(".profile-modal")) {
      closeProfileModal();
    }
  });

  // Обработчик ввода в поле поиска сотрудников
  const searchInput = document.querySelector(".search-input");
  if (searchInput) {
    let debounceTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimeout);
      const query = e.target.value;
      debounceTimeout = setTimeout(async () => {
        if (query.trim().length === 0) {
          restoreDefaultChatList();
        } else {
          try {
            const employees = await fetchEmployeesByQuery(query);
            updateChatList(employees);
          } catch (error) {
            console.error("Ошибка при поиске сотрудников:", error);
          }
        }
      }, 300);
    });
  }
}

// Запускаем инициализацию после загрузки DOM
document.addEventListener("DOMContentLoaded", init);
