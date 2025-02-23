// registration-service.js
import { beforeAuthorize } from './authentication-service.js';
const registrationServiceUrl = `http://localhost:1001/api/v1/registration/register`;

const userRegistration = {
  name: '',
  surname: '',
  patronymic: '',
  email: '',
  password: '',
  positionId: '',
};

/**
 * Обрабатывает отправку формы регистрации.
 */
async function handleRegistration(event) {
  event.preventDefault();

  const form = document.forms.registration;
  userRegistration.name = form.name.value.trim();
  userRegistration.surname = form.surname.value.trim();
  userRegistration.patronymic = form.patronymic.value.trim() || null;
  userRegistration.email = form.email.value.trim();
  userRegistration.password = form.password.value;
  userRegistration.positionId = form.positionId.value;

  try {
    const response = await fetch(registrationServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userRegistration),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { response: errorData };
    }

    const data = await response.json();
    console.log('Registration response:', data);

    if (data.accessToken && data.refreshToken) {
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${data.expiresIn}; SameSite=Strict`;
      document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${data.expireIn}; SameSite=Strict`;
      await beforeAuthorize();
      console.log('Tokens have been saved to cookies');
      window.location.href = 'chat';
    }
  } catch (error) {
    console.error('Registration error:', error);
    if (error.response && error.response.description) {
      alert(`Ошибка: ${error.response.description}`);
    } else {
      alert('Произошла ошибка при выполнении запроса. Пожалуйста, попробуйте еще раз.');
    }
  }
}

// Регистрация обработчика события отправки формы регистрации
document.addEventListener('DOMContentLoaded', () => {
  const registrationForm = document.forms.registration;
  if (registrationForm) {
    registrationForm.addEventListener('submit', handleRegistration);
  }
});
