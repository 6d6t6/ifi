import { getWebSearchApiKey, getWebSearchCx, isWebSearchConfigured } from './settings.js';

export function searchWeb(query) {
    if (!isWebSearchConfigured()) {
        return Promise.reject(new Error('API_NOT_CONFIGURED'));
    }

    const apiKey = getWebSearchApiKey();
    const cx = getWebSearchCx();
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.items) {
                return data.items;
            } else {
                throw new Error('No web results found');
            }
        });
}

export function renderWebResults(items, container) {
    container.innerHTML = '';

    if (items === 'API_NOT_CONFIGURED') {
        const warning = document.createElement('div');
        warning.classList.add('api-warning');
        warning.innerHTML = `
            <span class="material-symbols-rounded api-warning-icon">warning</span>
            <div class="api-warning-content">
                <h3 class="api-warning-title">API Configuration Required</h3>
                <p class="api-warning-text">
                    To use web search, you need to configure your Google Custom Search API settings.
                    <br><br>
                    <span class="api-warning-link" onclick="document.querySelector('.settings-button').click()">
                        Click here to open settings
                    </span>
                </p>
            </div>
        `;
        container.appendChild(warning);
        return;
    }

    items.forEach(item => {
        const title = item.title;
        const url = item.link;
        const faviconUrl = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&defaulticon=darkpng&size=32`;

        const resultItem = document.createElement('div');
        resultItem.classList.add('search-result-item');

        const faviconElement = document.createElement('img');
        faviconElement.src = faviconUrl;
        faviconElement.alt = 'Favicon';
        faviconElement.classList.add('search-result-favicon');

        const textContainer = document.createElement('div');
        textContainer.classList.add('text-container');

        const titleElement = document.createElement('a');
        titleElement.href = url;
        titleElement.textContent = title;
        titleElement.classList.add('search-result-title');

        const urlElement = document.createElement('p');
        urlElement.textContent = url;
        urlElement.classList.add('search-result-url');

        textContainer.appendChild(titleElement);
        textContainer.appendChild(urlElement);

        resultItem.appendChild(faviconElement);
        resultItem.appendChild(textContainer);

        container.appendChild(resultItem);
    });
}
