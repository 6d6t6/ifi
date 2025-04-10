// settings.js

// API keys (initially empty)
let webSearchApiKey = '';
let webSearchCx = '';
let videoSearchApiKey = '';

// Load saved settings from localStorage
export function loadSettings() {
    webSearchApiKey = localStorage.getItem('webSearchApiKey') || '';
    webSearchCx = localStorage.getItem('webSearchCx') || '';
    videoSearchApiKey = localStorage.getItem('videoSearchApiKey') || '';
}

// Save settings to localStorage
export function saveSettings() {
    localStorage.setItem('webSearchApiKey', webSearchApiKey);
    localStorage.setItem('webSearchCx', webSearchCx);
    localStorage.setItem('videoSearchApiKey', videoSearchApiKey);
}

// Get API keys for use in search functions
export function getWebSearchApiKey() {
    return webSearchApiKey;
}

export function getWebSearchCx() {
    return webSearchCx;
}

export function getVideoSearchApiKey() {
    return videoSearchApiKey;
}

// Check if API keys are configured
export function isWebSearchConfigured() {
    return webSearchApiKey && webSearchCx;
}

export function isVideoSearchConfigured() {
    return videoSearchApiKey;
}

// Update API keys
export function updateWebSearchApiKey(key) {
    webSearchApiKey = key;
    saveSettings();
}

export function updateWebSearchCx(cx) {
    webSearchCx = cx;
    saveSettings();
}

export function updateVideoSearchApiKey(key) {
    videoSearchApiKey = key;
    saveSettings();
}

// Create settings button
export function createSettingsButton() {
    const settingsButton = document.createElement('button');
    settingsButton.classList.add('settings-button');
    settingsButton.innerHTML = `
        <span class="material-symbols-rounded">settings</span>
    `;
    settingsButton.onclick = openSettingsView;
    return settingsButton;
}

// Open settings view
export function openSettingsView() {
    const contentHTML = `
        <div class="settings-container">
            <div class="settings-section">
                <h3>Web & Image Search API</h3>
                <div class="settings-field">
                    <label for="web-search-api-key">API Key:</label>
                    <input type="password" id="web-search-api-key" value="${webSearchApiKey}" placeholder="Enter your Google Custom Search API key">
                </div>
                <div class="settings-field">
                    <label for="web-search-cx">Search Engine ID (cx):</label>
                    <input type="text" id="web-search-cx" value="${webSearchCx}" placeholder="Enter your Google Custom Search Engine ID">
                </div>
                <p class="settings-info">These settings are used for both web and image search. Get your API key from the <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a>.</p>
            </div>
            
            <div class="settings-section">
                <h3>Video Search API</h3>
                <div class="settings-field">
                    <label for="video-search-api-key">API Key:</label>
                    <input type="password" id="video-search-api-key" value="${videoSearchApiKey}" placeholder="Enter your YouTube Data API key">
                </div>
                <p class="settings-info">This API key is used for video search. Get your API key from the <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a>.</p>
            </div>
            
            <div class="settings-actions">
                <button id="save-settings" class="primary-button">Save Settings</button>
                <button id="reset-settings" class="secondary-button">Clear Settings</button>
            </div>
        </div>
    `;

    // Use the openView function from main.js
    window.openView(contentHTML, 'Settings');

    // Add event listeners after the view is created
    setTimeout(() => {
        const saveButton = document.getElementById('save-settings');
        const resetButton = document.getElementById('reset-settings');
        
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                const webApiKey = document.getElementById('web-search-api-key').value;
                const webCx = document.getElementById('web-search-cx').value;
                const videoApiKey = document.getElementById('video-search-api-key').value;
                
                updateWebSearchApiKey(webApiKey);
                updateWebSearchCx(webCx);
                updateVideoSearchApiKey(videoApiKey);
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.classList.add('settings-success');
                successMessage.textContent = 'Settings saved successfully!';
                
                const settingsContainer = document.querySelector('.settings-container');
                settingsContainer.appendChild(successMessage);
                
                // Remove success message after 3 seconds
                setTimeout(() => {
                    successMessage.remove();
                }, 3000);
            });
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                // Clear all values
                document.getElementById('web-search-api-key').value = '';
                document.getElementById('web-search-cx').value = '';
                document.getElementById('video-search-api-key').value = '';
                
                // Update the stored values
                updateWebSearchApiKey('');
                updateWebSearchCx('');
                updateVideoSearchApiKey('');
                
                // Show reset message
                const resetMessage = document.createElement('div');
                resetMessage.classList.add('settings-success');
                resetMessage.textContent = 'Settings cleared!';
                
                const settingsContainer = document.querySelector('.settings-container');
                settingsContainer.appendChild(resetMessage);
                
                // Remove reset message after 3 seconds
                setTimeout(() => {
                    resetMessage.remove();
                }, 3000);
            });
        }
    }, 100);
} 