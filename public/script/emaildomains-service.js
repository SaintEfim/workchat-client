// emaildomains-service.js

const emailDomainsServiceUrl = `http://localhost:1002/api/v1/email-domains?withIncludes=false`;

/**
 * Загружает список доменов с сервера.
 * @returns {Promise<Array<string>>} Массив доменных имен.
 */
async function getEmailDomains() {
  try {
    const response = await fetch(emailDomainsServiceUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Ошибка загрузки доменов');
    }

    const data = await response.json();
    console.log('Ответ API:', data);
    if (!Array.isArray(data)) {
      throw new Error('Некорректный формат ответа API');
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
 */
export async function setupEmailAutocomplete() {
  const emailInput = document.getElementById('email');
  const datalist = document.getElementById('emailDomains');
  const suggestionsDiv = document.getElementById('emailSuggestions');

  if (!emailInput || !datalist || !suggestionsDiv) {
    console.error("Ошибка: не найдены необходимые элементы в DOM.");
    return;
  }

  const domains = await getEmailDomains();
  if (!domains.length) return;

  emailInput.addEventListener('input', function () {
    const value = this.value.trim();
    datalist.innerHTML = '';
    suggestionsDiv.innerHTML = '';

    if (!value.includes('@')) {
      suggestionsDiv.textContent = 'Возможные домены: ' + domains.slice(0, 5).join(', ');
      return;
    }

    const [localPart, domainPart] = value.split('@');
    const matchingDomains = domains
      .filter(domain => domain.startsWith(domainPart))
      .slice(0, 10);

    if (matchingDomains.length) {
      suggestionsDiv.textContent = 'Доступные домены: ' + matchingDomains.join(', ');
    } else {
      suggestionsDiv.textContent = 'Нет совпадений';
    }

    matchingDomains.forEach(domain => {
      const option = document.createElement('option');
      option.value = `${localPart}@${domain}`;
      datalist.appendChild(option);
    });
  });
}
