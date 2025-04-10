import { getVideoSearchApiKey, isVideoSearchConfigured } from './settings.js';

export function searchVideos(query) {
    if (!isVideoSearchConfigured()) {
        return Promise.reject(new Error('API_NOT_CONFIGURED'));
    }

    const apiKey = getVideoSearchApiKey();
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${query}&type=video&key=${apiKey}`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.items) {
                return data.items;
            } else {
                throw new Error('No video results found');
            }
        });
}

export function renderVideoResults(items, container) {
    container.innerHTML = '';

    if (items === 'API_NOT_CONFIGURED') {
        const warning = document.createElement('div');
        warning.classList.add('api-warning');
        warning.innerHTML = `
            <span class="material-symbols-rounded api-warning-icon">warning</span>
            <div class="api-warning-content">
                <h3 class="api-warning-title">API Configuration Required</h3>
                <p class="api-warning-text">
                    To use video search, you need to configure your YouTube API key in the settings.
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
    gridContainer.classList.add('video-grid-container');

    items.forEach(item => {
        const videoId = item.id.videoId;
        const thumbnailUrl = item.snippet.thumbnails.high.url;
        const title = item.snippet.title;
        const channelTitle = item.snippet.channelTitle;

        const gridItem = document.createElement('div');
        gridItem.classList.add('video-grid-item');

        const thumbnailElement = document.createElement('img');
        thumbnailElement.src = thumbnailUrl;
        thumbnailElement.classList.add('video-result-thumbnail');

        const titleElement = document.createElement('div');
        titleElement.classList.add('video-result-title');
        titleElement.textContent = title;

        const channelElement = document.createElement('div');
        channelElement.classList.add('video-result-channel');
        channelElement.textContent = channelTitle;

        gridItem.appendChild(thumbnailElement);
        gridItem.appendChild(titleElement);
        gridItem.appendChild(channelElement);

        gridItem.addEventListener('click', () => {
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
        });

        gridContainer.appendChild(gridItem);
    });

    container.appendChild(gridContainer);
}
