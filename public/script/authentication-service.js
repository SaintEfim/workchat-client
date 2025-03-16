// authentication-service.js

const serverIp = window.location.hostname; // Автоматически берёт IP, с которого открыт сайт
const authenticationServiceUrlLogin = `http://${serverIp}:1005/api/v1/authentication/login`;
const authenticationServiceUrlGetId = `http://${serverIp}:1005/api/v1/authentication/getId`;

const userAuthentication = {
  email: "",
  password: "",
};

/**
 * Выполняет дополнительный запрос для получения ID пользователя и сохраняет его в cookie.
 */
export async function beforeAuthorize() {
  const accessToken = getCookie('accessToken');
  console.log("Access token:", accessToken);

  const response = await fetch(authenticationServiceUrlGetId, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    }
  });

  console.log("GetId response status:", response.status);
  if (!response.ok) {
    return Promise.reject(response);
  }
  const data = await response.json();
  console.log("Received ID data:", data);
  if (!data.id) {
    throw new Error("ID not found in response");
  }
  document.cookie = `userId=${data.id}; path=/; max-age=3600; SameSite=Strict`;
  console.log("UserID cookie set:", document.cookie);
  return data;
}

/**
 * Обрабатывает отправку формы авторизации.
 */
async function handleAuthentication(event) {
  event.preventDefault();

  const form = document.forms.authorize;
  userAuthentication.email = form.email.value.trim();
  userAuthentication.password = form.password.value;

  try {
    const response = await fetch(authenticationServiceUrlLogin, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userAuthentication),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { response: errorData };
    }

    const data = await response.json();
    console.log("Auth Response:", data);

    if (data.accessToken && data.refreshToken) {
      const maxAge = data.expiresIn || 3600;
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${maxAge}; SameSite=Strict`;
      document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${maxAge}; SameSite=Strict`;
      console.log("Tokens have been saved to cookies");
      await beforeAuthorize();
      window.location.href = "chat";
    }
  } catch (error) {
    console.error("Authentication error:", error);
    // Очищаем куки при ошибке
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    if (error.response?.description) {
      alert(`Ошибка: ${error.response.description}`);
    } else {
      alert("Произошла ошибка при выполнении запроса. Пожалуйста, попробуйте еще раз.");
    }
  }
}

// Вспомогательная функция для получения cookie
function getCookie(name) {
  const value = document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="));
  return value ? value.split("=")[1] : null;
}

// Регистрация обработчика события отправки формы авторизации
document.addEventListener("DOMContentLoaded", () => {
  const authorizeForm = document.forms.authorize;
  if (authorizeForm) {
    authorizeForm.addEventListener("submit", handleAuthentication);
  }
});
