async function getEmailDomains() {
    try {
        const response = await fetch('http://localhost:1002/api/v1/email-domains?withIncludes=false', {
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

        return data.map(item => item.domainName); // Возвращаем массив доменов
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить домены.');
        return [];
    }
}

async function setupEmailAutocomplete() {
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
        datalist.innerHTML = ''; // Очищаем datalist
        suggestionsDiv.innerHTML = '';

        if (!value.includes('@')) {
            suggestionsDiv.innerHTML = 'Возможные домены: ' + domains.slice(0, 5).join(', ');
            return;
        }

        const [_, domainPart] = value.split('@');
        const matchingDomains = domains
            .filter(domain => domain.startsWith(domainPart))
            .slice(0, 10); // Ограничиваем список до 10 элементов

        if (matchingDomains.length) {
            suggestionsDiv.innerHTML = 'Доступные домены: ' + matchingDomains.join(', ');
        } else {
            suggestionsDiv.innerHTML = 'Нет совпадений';
        }

        // Добавляем только до 10 элементов в datalist
        matchingDomains.forEach(domain => {
            const option = document.createElement('option');
            option.value = value.split('@')[0] + '@' + domain;
            datalist.appendChild(option);
        });
    });
}
