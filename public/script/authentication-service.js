const authenticationServiceUrl = `http://localhost:1005/api/v1/authentication/login`;

const userAuthentication = {
    email: '',
    password: '',
}

document.forms.authorize.onsubmit = function () {
    userAuthentication.email = this.email.value;
    userAuthentication.password = this.password.value;
    
    fetch(authenticationServiceUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userAuthentication),
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
            alert("Успешная авторизация")
            document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${data.ExpiresIn}; SameSite=Strict`;
            document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${data.ExpiresIn}; SameSite=Strict`;

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