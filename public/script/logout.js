import { messageSocket } from './message-service.js';

// Функция для удаления всех кук
function deleteAllCookies() {
  document.cookie.split(";").forEach((cookie) => {
    document.cookie = cookie
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Закрываем сокет если он существует
  if (messageSocket && messageSocket.readyState === WebSocket.OPEN) {
    messageSocket.close();
  }

  const logoutButton = Array.from(document.querySelectorAll(".menu-item"))
    .find(el => el.textContent.includes("Выйти"));

  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      deleteAllCookies();
      window.location.href = "/";
    });
  } else {
    console.error("Кнопка выхода не найдена!");
  }
});