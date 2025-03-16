// emaildomains-service.js

const serverIp = window.location.hostname; // Автоматически берёт IP, с которого открыт сайт
const emailDomainsServiceUrl = `http://${serverIp}:1002/api/v1/email-domains?withIncludes=false`;

// Кэш для стандартного списка доменов (без фильтра)
let cachedDomains = [];

// Переменные для предотвращения лишнего обновления DOM
let lastInputValue = "";
let lastSuggestionsText = "";

/**
 * Загружает список доменов с сервера с фильтрацией через Sieve.
 * @param {string} [query] - Необязательная подстрока для фильтрации доменов.
 * @returns {Promise<Array<string>>} Массив доменных имен.
 */
async function getEmailDomains(query = "") {
  try {
    const params = new URLSearchParams();

    // Если передан непустой запрос – формируем Sieve фильтр для поля domainName
    if (query.trim().length > 0) {
      // Используем оператор @= и подстановочные символы * для поиска по подстроке
      params.append("Filters", `domainName@=*${query.trim()}`);
    }

    const url = emailDomainsServiceUrl + (params.toString() ? `&${params.toString()}` : "");
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Ошибка загрузки доменов');
    }

    const data = await response.json();
    console.log('Ответ API:', data);

    if (!Array.isArray(data)) {
      throw new Error('Некорректный формат ответа API');
    }

    // Если запрос без фильтра – кэшируем результат
    if (query.trim().length === 0) {
      cachedDomains = data.map(item => item.domainName);
      return cachedDomains;
    }
    return data.map(item => item.domainName);
  } catch (error) {
    console.error('Ошибка при получении доменов:', error);
    alert('Не удалось загрузить домены.');
    return [];
  }
}

/**
 * Настраивает автодополнение email-доменов для поля ввода.
 * При вводе значения происходит запрос с дебаунсом и обновление DOM только при изменении данных.
 */
export async function setupEmailAutocomplete() {
  const emailInput = document.getElementById('email');
  const datalist = document.getElementById('emailDomains');
  const suggestionsDiv = document.getElementById('emailSuggestions');

  if (!emailInput || !datalist || !suggestionsDiv) {
    console.error("Ошибка: не найдены необходимые элементы в DOM.");
    return;
  }

  // Функция для обновления подсказок доменов
  async function updateDomainSuggestions() {
    const value = emailInput.value.trim();
    // Если значение ввода не изменилось – ничего не делаем
    if (value === lastInputValue) return;
    lastInputValue = value;

    // Подготовим переменную для нового текста подсказок
    let newSuggestionsText = "";
    let domains = [];

    // Если символ "@" не введён или фильтр после "@" слишком короткий – используем кэш
    if (!value.includes('@')) {
      if (cachedDomains.length === 0) {
        cachedDomains = await getEmailDomains();
      }
      domains = cachedDomains;
      newSuggestionsText = 'Возможные домены: ' + domains.slice(0, 5).join(', ');
    } else {
      const parts = value.split('@');
      const localPart = parts[0];
      const domainPart = parts[1] || "";
      // Если после "@" введено менее 2 символов – используем кэш
      if (domainPart.length < 2) {
        if (cachedDomains.length === 0) {
          cachedDomains = await getEmailDomains();
        }
        domains = cachedDomains;
        newSuggestionsText = 'Возможные домены: ' + domains.slice(0, 5).join(', ');
      } else {
        domains = await getEmailDomains(domainPart);
        if (domains.length) {
          newSuggestionsText = 'Доступные домены: ' + domains.join(', ');
        } else {
          newSuggestionsText = 'Нет совпадений';
        }
      }
    }

    // Обновляем DOM только если текст подсказок изменился
    if (newSuggestionsText !== lastSuggestionsText) {
      suggestionsDiv.textContent = newSuggestionsText;
      lastSuggestionsText = newSuggestionsText;
    }

    // Заполняем datalist вариантами (ограничим до 10 вариантов)
    datalist.innerHTML = '';
    domains.slice(0, 10).forEach(domain => {
      const option = document.createElement('option');
      const localPart = value.split('@')[0];
      option.value = `${localPart}@${domain}`;
      datalist.appendChild(option);
    });
  }

  // Дебаунс: задержка обновления подсказок (300 мс)
  let debounceTimeout;
  emailInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(updateDomainSuggestions, 300);
  });
}
