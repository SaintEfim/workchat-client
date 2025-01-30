const employeesServiceUrlGetOneById = `http://localhost:1003/api/v1/employees/`;

function getElementById() {
  return new Promise((resolve, reject) => {
    // Получаем ID из кук
    const userId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userId="))
      ?.split("=")[1];

    // Получаем токен из кук
    const accessToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];

    // Проверяем наличие ID и токена
    if (!userId || !accessToken) {
      console.error("User ID or access token not found in cookies");
      reject("User ID or access token not found in cookies");
      return;
    }

    // Выполняем запрос к API
    fetch(`${employeesServiceUrlGetOneById}${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Employee data:", data);
        updateUserInfo(data);
        resolve(data); // Возвращаем данные через resolve
      })
      .catch((error) => {
        console.error("Error fetching employee data:", error);
        reject(error);
      });
  });
}

function updateUserInfo(employee) {
  const userInfoElement = document.querySelector(".menu-user-info h3");

  if (userInfoElement && employee) {
    // Формируем полное имя
    const fullName = `${employee.name} ${employee.surname}`;
    userInfoElement.textContent = fullName;
  }
}

// Вызов функции при загрузке страницы
document.addEventListener("DOMContentLoaded", getElementById);

function showProfileModal(employee) {
  const modal = document.getElementById("profileModal");
  modal.style.display = "flex";

  document.getElementById(
    "profileName"
  ).textContent = `${employee.name} ${employee.surname} ${employee.patronymic}`;
  document.getElementById("profilePosition").textContent =
    employee.position?.name || "Должность не указана";
  document.getElementById("profileSurname").textContent = employee.surname;
  document.getElementById("profileFirstName").textContent = employee.name;
  document.getElementById("profilePatronymic").textContent =
    employee.patronymic || "—";

  // Скрываем блок с отчеством если оно отсутствует
  document.getElementById("patronymicSection").style.display =
    employee.patronymic ? "block" : "none";
}

function closeProfileModal() {
  document.getElementById("profileModal").style.display = "none";
}

// Обработчики событий
document.addEventListener("DOMContentLoaded", () => {
  // Открытие профиля
  document
    .querySelector(".menu-item:nth-child(1)")
    .addEventListener("click", () => {
      getElementById().then(showProfileModal);
    });

  // Закрытие модального окна
  document
    .querySelector(".close-btn")
    .addEventListener("click", closeProfileModal);
  document.querySelector(".profile-modal").addEventListener("click", (e) => {
    if (e.target === document.querySelector(".profile-modal"))
      closeProfileModal();
  });
});
