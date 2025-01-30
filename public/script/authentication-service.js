const authenticationServiceUrlLogin = `http://localhost:1005/api/v1/authentication/login`;
const authenticationServiceUrlGetId = `http://localhost:1005/api/v1/authentication/getId`;

const userAuthentication = {
  email: "",
  password: "",
};

function beforeAuthorize() {
    const accessToken = document.cookie
      .split("; ")
      .find(row => row.startsWith("accessToken="))
      ?.split("=")[1];
  
    console.log("Access token:", accessToken); // Добавьте лог
  
    return fetch(authenticationServiceUrlGetId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    })
    .then(response => {
      console.log("GetId response status:", response.status);
      if (!response.ok) return Promise.reject(response);
      return response.json();
    })
    .then(data => {
      console.log("Received ID data:", data);
      
      if (!data.id) {
        throw new Error("ID not found in response");
      }
      
      document.cookie = `userId=${data.id}; path=/; max-age=3600; SameSite=Strict`;
      console.log("UserID cookie set:", document.cookie);
      return data;
    });
  }

document.forms.authorize.onsubmit = function () {
  userAuthentication.email = this.email.value;
  userAuthentication.password = this.password.value;

  fetch(authenticationServiceUrlLogin, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userAuthentication),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData) => {
          const error = new Error("Network response was not ok");
          error.response = errorData;
          throw error;
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log("Auth Response:", data);

      if (data.accessToken && data.refreshToken) {
        // Используем переданное с сервера время жизни токена
        const maxAge = data.expiresIn || 3600;

        document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${maxAge}; SameSite=Strict`;
        document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${maxAge}; SameSite=Strict`;

        console.log("Tokens have been saved to cookies");

        // Возвращаем промис для цепочки
        return beforeAuthorize();
      }
    })
    .then(() => {
      // Перенаправляем только после успешного выполнения всех операций
      window.location.href = "chat";
    })
    .catch((error) => {
      console.error("Error:", error);

      // Очищаем куки при ошибке
      document.cookie =
        "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      if (error.response?.description) {
        alert(`Ошибка: ${error.response.description}`);
      } else {
        alert(
          "Произошла ошибка при выполнении запроса. Пожалуйста, попробуйте еще раз."
        );
      }
    });

  return false;
};
