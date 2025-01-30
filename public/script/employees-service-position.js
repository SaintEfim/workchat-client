const employeesServiceUrlGetPositions = `http://localhost:1003/api/v1/positions?withIncludes=false`;

function getPosition() {
    fetch(employeesServiceUrlGetPositions, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
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
        const selectElement = document.getElementById('pet-select');
        
        selectElement.innerHTML = '<option value="" disabled selected>Выберите проффессию</option>';

        data.forEach(position => {
            const option = document.createElement('option');
            option.value = position.id;  
            option.textContent = position.name;  
            selectElement.appendChild(option);
        });
    })
    .catch((error) => {
        console.error('Error:', error);

        if (error.response && error.response.description) {
            alert(`Ошибка: ${error.response.description}`);
        } else {
            alert('Произошла ошибка при выполнении запроса. Пожалуйста, попробуйте еще раз.');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    getPosition();

    const selectElement = document.getElementById('pet-select');
    if (selectElement) {
        selectElement.addEventListener('change', function() {
            const positionId = this.value; 
            document.querySelector('[name="positionId"]').value = positionId; 
        });
    }
});