// employees-service.js
import { openChatWithEmployee } from './chat-service.js';


const API_BASE_URL = 'http://localhost:1003/api/v1/employees';
const EMPLOYEE_API_URL = `${API_BASE_URL}/`;

function getCookie(name) {
  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='));
  return value ? value.split('=')[1] : null;
}

export function getAccessToken() {
  return getCookie('accessToken');
}

function getUserId() {
  return getCookie('userId');
}

/**
 * Получает данные текущего сотрудника с сервера.
 */
export async function fetchCurrentUser() {
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

  return await response.json();
}

/**
 * Выполняет поиск сотрудников по введённому запросу (имя, фамилия, отчество).
 */
async function fetchEmployeesByQuery(query) {
  const userId = getUserId();
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
  // Исключаем из результатов самого текущего пользователя
  return data.filter(employee => employee.id !== userId);
}

/**
 * Обновляет информацию о текущем пользователе в меню (шапка).
 */
function updateUserInfo(employee) {
  const userInfoElement = document.querySelector('.menu-user-info h3');
  if (userInfoElement && employee) {
    userInfoElement.textContent = `${employee.name} ${employee.surname}`;
  }
}

/**
 * Открывает модальное окно профиля текущего пользователя.
 */
function showProfileModal(employee) {
  const modal = document.getElementById("profileModal");
  if (!modal) return;

  modal.style.display = "flex";
  document.getElementById("profileName").textContent =
    `${employee.name} ${employee.surname} ${employee.patronymic || ""}`;
  document.getElementById("profilePosition").textContent =
    employee.position?.name || "Должность не указана";
  document.getElementById("profileEmail").textContent = employee.email || "";
}

/**
 * Закрывает модальное окно профиля.
 */
function closeProfileModal() {
  const modal = document.getElementById("profileModal");
  if (modal) {
    modal.style.display = "none";
  }
}

/**
 * Отображает список найденных сотрудников (результат поиска) вместо списка чатов.
 */
function showFoundEmployees(employees) {
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

    // При клике — создаём/открываем приватный чат
    chatItem.addEventListener("click", () => {
      openChatWithEmployee(employee);
    });

    chatListContainer.appendChild(chatItem);
  });
}

/**
 * Инициализация: загрузка данных текущего пользователя, настройка поиска, модального окна профиля.
 */
async function init() {
  try {
    const currentUser = await fetchCurrentUser();
    updateUserInfo(currentUser);
  } catch (error) {
    console.error("Ошибка при получении данных текущего пользователя:", error);
  }

  // Обработчик на "Мой профиль"
  const profileMenuItem = document.querySelector(".menu-item:nth-child(1)");
  if (profileMenuItem) {
    profileMenuItem.addEventListener("click", async () => {
      try {
        const currentUser = await fetchCurrentUser();
        showProfileModal(currentUser);
      } catch (error) {
        console.error("Ошибка при открытии профиля:", error);
      }
    });
  }

  // Закрытие профиля
  const closeBtn = document.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeProfileModal);
  }
  const profileModal = document.querySelector(".profile-modal");
  if (profileModal) {
    profileModal.addEventListener("click", (e) => {
      if (e.target === profileModal) {
        closeProfileModal();
      }
    });
  }

  // Поиск сотрудников
  const searchInput = document.querySelector(".search-input");
  if (searchInput) {
    let debounceTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimeout);
      const query = e.target.value.trim();
      debounceTimeout = setTimeout(async () => {
        if (query.length === 0) {
          // Если строка поиска пуста — грузим все чаты
          import('./chat-service.js').then(module => {
            module.loadUserChats();
          });
        } else {
          try {
            const employees = await fetchEmployeesByQuery(query);
            showFoundEmployees(employees);
          } catch (error) {
            console.error("Ошибка при поиске сотрудников:", error);
          }
        }
      }, 300);
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
