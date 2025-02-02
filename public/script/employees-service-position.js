// employees-service-position.js

const employeesServiceUrlGetPositions = `http://localhost:1003/api/v1/positions?withIncludes=false`;

/**
 * Загружает список позиций с сервера и заполняет выпадающий список.
 */
async function loadPositions() {
  try {
    const response = await fetch(employeesServiceUrlGetPositions, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { response: errorData };
    }

    const data = await response.json();
    const selectElement = document.getElementById('pet-select');
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="" disabled selected>Выберите профессию</option>';
    data.forEach(position => {
      const option = document.createElement('option');
      option.value = position.id;
      option.textContent = position.name;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading positions:', error);
    if (error.response && error.response.description) {
      alert(`Ошибка: ${error.response.description}`);
    } else {
      alert('Произошла ошибка при выполнении запроса. Пожалуйста, попробуйте еще раз.');
    }
  }
}

/**
 * Устанавливает обработчик изменения выбранной позиции.
 */
function setupPositionSelection() {
  const selectElement = document.getElementById('pet-select');
  if (selectElement) {
    selectElement.addEventListener('change', function () {
      const positionId = this.value;
      document.querySelector('[name="positionId"]').value = positionId;
    });
  }
}

// Инициализируем загрузку позиций при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  loadPositions();
  setupPositionSelection();
});
