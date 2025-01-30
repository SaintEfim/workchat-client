// Функция для удаления всех кук
function deleteAllCookies() {
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/");
    });
  }
  
  // Ждём загрузки DOM перед поиском кнопки
  document.addEventListener("DOMContentLoaded", () => {
    // Находим кнопку выхода по классу и тексту
    const logoutButton = Array.from(document.querySelectorAll(".menu-item"))
      .find(el => el.textContent.includes("Выйти"));
  
    // Добавляем обработчик клика
    if (logoutButton) {
      logoutButton.addEventListener("click", (event) => {
        event.preventDefault(); // Предотвращаем стандартное поведение
  
        // Удаляем все куки
        deleteAllCookies();
  
        // Перенаправляем на страницу входа
        window.location.href = "/"; // Измените, если нужен другой путь
      });
    } else {
      console.error("Кнопка выхода не найдена!");
    }
  });
  