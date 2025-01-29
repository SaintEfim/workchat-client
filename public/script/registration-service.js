const userRegistration = {
    name: '',
    surname: '',
    patronymic: '',
    email: '',
    password: '',
    positionId: '',
}

document.forms.registration.onsubmit = function () {
    userRegistration.name = this.name.value;
    userRegistration.surname = this.surname.value;
    userRegistration.patronymic = this.patronymic.value.trim() === '' ? null : this.patronymic.value;
    userRegistration.email = this.email.value;
    userRegistration.password = this.password.value;
    userRegistration.positionId = this.positionId.value;
    
    fetch('http://localhost:1001/api/v1/registration/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userRegistration),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                const error = new Error('Network response was not ok');
                error.response = errorData;
                throw error;
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Response:', data);

        if (data.accessToken && data.refreshToken) {
            alert("Успешная регистрация");
            document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${3600}; SameSite=Strict`;
            document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${3600}; SameSite=Strict`;
            
            console.log('Tokens have been saved to cookies');
        }
    })
    .catch((error) => {
        console.error('Error:', error);

        if (error.response && error.response.description) {
            alert(`Ошибка: ${error.response.description}`);
        } else {
            alert('Произошла ошибка при выполнении запроса. Пожалуйста, попробуйте еще раз.');
        }
    });

    return false;
};


