import { getWebSearchApiKey, getWebSearchCx, isWebSearchConfigured } from './settings.js';

export function searchImages(query) {
    if (!isWebSearchConfigured()) {
        return Promise.reject(new Error('API_NOT_CONFIGURED'));
    }

    const apiKey = getWebSearchApiKey();
    const cx = getWebSearchCx();
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&searchType=image`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.items) {
                return data.items;
            } else {
                throw new Error('No image results found');
            }
        });
}

export function renderImageResults(items, container) {
    container.innerHTML = '';

    if (items === 'API_NOT_CONFIGURED') {
        const warning = document.createElement('div');
        warning.classList.add('api-warning');
        warning.innerHTML = `
            <span class="material-symbols-rounded api-warning-icon">warning</span>
            <div class="api-warning-content">
                <h3 class="api-warning-title">API Configuration Required</h3>
                <p class="api-warning-text">
                    To use image search, you need to configure your Google Custom Search API settings.
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

    const gridContainer = document.createElement('div');
    gridContainer.classList.add('image-grid-container');

    items.forEach(item => {
        const imageUrl = item.link;

        const gridItem = document.createElement('div');
        gridItem.classList.add('image-grid-item');

        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.classList.add('image-result-image');

        imageElement.onerror = function() {
            this.src = 'imgfallback.svg';
        };

        gridItem.appendChild(imageElement);
        gridContainer.appendChild(gridItem);
    });

    container.appendChild(gridContainer);
}
