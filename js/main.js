// main.js

import { searchWeb, renderWebResults } from './webSearch.js';
import { searchImages, renderImageResults } from './imageSearch.js';
import { searchVideos, renderVideoResults } from './videoSearch.js';
import { searchNews, renderNewsResults, getSubscribedFeeds, setSubscribedFeeds, rssFeeds } from './rssNewsSearch.js';
import { renderMapResults, showMap, hideMap } from './mapSearch.js';
import { initializeChatEngine, renderChatMessages, handleSendMessage } from './chat.js';
import { loadSettings, createSettingsButton } from './settings.js';

const form = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResultsContainer = document.getElementById('search-results');
const tabs = document.querySelectorAll('.tab');
const header = document.querySelector('#logo'); // Get the logo element by ID

let scrollPosition = 0;

// Add these constants at the top with the other ones
const TAB_TYPES = ['web', 'image', 'video', 'news', 'shop', 'map', 'chat'];

const locationInfoContainer = document.getElementById('location-info'); // Ensure this ID matches your HTML

// Function to update the document title
function updateTitle(query = '', tab = 'web') {
    let title = 'ifi';
    const capitalizedTab = tab.charAt(0).toUpperCase() + tab.slice(1);

    if (query) {
        title = `${query} - ${title}`; // Prepend query if it exists
        if (tab !== 'web') {
            title += ` ${capitalizedTab}`; // Append tab name if not web
        }
    } else {
        if (tab !== 'web') {
            title += ` ${capitalizedTab}`; // Append tab name if not web
        }
    }
    document.title = title;
}

function createTabContents() {
    const tabContentsContainer = document.createElement('div');
    tabContentsContainer.classList.add('tab-contents-container');

    TAB_TYPES.forEach(type => {
        // Create tab content section
        const tabContent = document.createElement('div');
        tabContent.classList.add('tab-content', `${type}-content`);
        tabContent.style.display = 'none';

        // Create toolbar for this tab
        const toolbar = document.createElement('div');
        toolbar.classList.add('toolbar', `${type}-toolbar`);

        // Add specific toolbar content based on tab type
        if (type === 'news') {
            const subscriptionButton = createSubscriptionButton();
            toolbar.appendChild(subscriptionButton);
        }

        // Create results container for this tab
        const resultsContainer = document.createElement('div');
        resultsContainer.classList.add('search-results', `${type}-results`);

        // Add loading indicator (hidden by default)
        const loadingIndicator = document.createElement('div');
        loadingIndicator.classList.add('loading-indicator');
        loadingIndicator.textContent = 'Please wait...';
        loadingIndicator.style.display = 'none';
        
        // Assemble tab content
        tabContent.appendChild(toolbar);
        tabContent.appendChild(loadingIndicator);
        tabContent.appendChild(resultsContainer);
        
        tabContentsContainer.appendChild(tabContent);
    });

    return tabContentsContainer;
}

// Function to update URL: 'web' tab is implicit (no key), others use key. Query is 'q'.
function updateURL(query = '', tab = 'web') {
    const url = new URL(window.location.href);
    let searchString = '';

    // Handle chat tab specially
    if (tab === 'chat') {
        searchString = '?chat';
        if (query) {
            searchString += `&q=${encodeURIComponent(query)}`;
        }
    } else if (tab === 'web') {
        // If tab is 'web', only add 'q' parameter if query exists
        if (query) {
            searchString = `?q=${encodeURIComponent(query)}`;
        }
    } else if (tab && TAB_TYPES.includes(tab)) {
        // If it's another valid tab
        searchString = `?${tab}`;
        if (query) {
            searchString += `&q=${encodeURIComponent(query)}`;
        }
    } else {
        // Fallback/Error case: Treat as 'web' tab
        console.warn(`Invalid tab type specified: ${tab}. Defaulting to web.`);
        tab = 'web';
        if (query) {
            searchString = `?q=${encodeURIComponent(query)}`;
        }
    }

    url.search = searchString;

    // Update title whenever URL is updated
    updateTitle(query, tab);

    // Create state object with both query and tab
    const state = { 
        q: query || null,  // Use null instead of empty string for consistency
        tab: tab          // Always include the tab in state
    };

    // Only update history if URL actually changed
    if (window.location.href !== url.toString()) {
        history.pushState(state, '', url.toString());
    } else {
        // Even if URL didn't change, ensure state is updated
        history.replaceState(state, '', url.toString());
    }
}

// Function to get parameters from URL: Defaults to 'web' if no other tab key found.
function getURLParams() {
    const url = new URL(window.location.href);
    let activeTab = 'web'; // Default tab
    let query = url.searchParams.get('q') || '';
    
    // First check for chat parameter specifically
    if (url.searchParams.has('chat')) {
        activeTab = 'chat';
    } else {
        // Then check other non-web tabs
        for (const type of TAB_TYPES) {
            if (type === 'web' || type === 'chat') continue;
            if (url.searchParams.has(type)) {
                activeTab = type;
                break;
            }
        }
    }

    return {
        q: query,
        tab: activeTab
    };
}

// Update the popstate event listener to handle state more consistently
window.addEventListener('popstate', function(event) {
    // Get state from event or parse URL if no state exists
    const state = event.state || getURLParams();
    const { q, tab } = state;
    
    // Set the search input value, handling null/undefined
    searchInput.value = q || ''; 
    
    // Set the active tab
    setActiveTab(`${tab}-tab`);

    // Update the title
    updateTitle(q, tab);
    
    // Perform search if there's a query, or clear results if appropriate
    if (q) {
        performSearch(q, tab);
    } else {
        // Clear results if query is empty (except for map and chat tabs)
        const resultsContainer = document.querySelector(`.${tab}-results`);
        if (resultsContainer && tab !== 'map' && tab !== 'chat') { 
            resultsContainer.innerHTML = '';
        }
    }
});

window.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.container');
    const tabContents = createTabContents();
    container.appendChild(tabContents);

    // Load saved settings
    loadSettings();

    // Add settings button to the top right corner
    const settingsButton = createSettingsButton();
    document.body.appendChild(settingsButton);

    // Get parameters from URL (using 'q')
    const { q, tab } = getURLParams();
    
    // Set the search input value if there's a query
    searchInput.value = q || '';
    
    // Set the active tab
    setActiveTab(`${tab}-tab`);

    // Update title on initial load
    updateTitle(q, tab);
    
    // Perform search if there's a query
    if (q) {
        performSearch(q, tab);
    } else {
        // Set default active tab if no tab or query in URL
        // `getURLParams` already defaults to 'web', so setActiveTab handles it
        // No specific action needed here unless q is present but tab isn't (which getURLParams prevents)
        
        // We might want to ensure the URL reflects the default state if loaded without params
        // updateURL('', 'web'); // Optional: update URL to show default state ?web=
    }
});

form.addEventListener('submit', function (event) {
    event.preventDefault();
    const query = searchInput.value.trim(); // Still get query from input
    
    const activeTabId = document.querySelector('.tab.active').id;
    const activeTab = activeTabId.replace('-tab', '');
    
    // Update URL (which now also calls updateTitle)
    updateURL(query, activeTab);
    
    // Handle chat tab differently
    if (activeTab === 'chat') {
        // Send message to chat
        const chatResults = document.querySelector('.chat-results');
        if (chatResults) {
            handleSendMessage(query, chatResults);
        }
        // Clear input but don't update URL with empty query
        searchInput.value = '';
        return;
    }
    
    // Perform search only if there is a query
    if (query) {
        // For news tab, we want to force a refresh to get the latest feeds
        if (activeTab === 'news') {
            performSearch(query, activeTab, true);
        } else {
            performSearch(query, activeTab);
        }
    } else {
        // Optional: Clear results if query is empty
        const resultsContainer = document.querySelector(`.${activeTab}-results`);
        if (resultsContainer && activeTab !== 'map') { // Don't clear map view itself
            resultsContainer.innerHTML = '';
        }
        // Potentially hide loading indicator too
        const loadingIndicator = document.querySelector(`.${activeTab}-content .loading-indicator`);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
});

tabs.forEach(tab => {
    tab.addEventListener('click', function () {
        const tabId = this.id;
        const activeTab = tabId.replace('-tab', '');
        const currentQuery = searchInput.value.trim(); // Get current query
        
        // Update URL (which now also calls updateTitle)
        updateURL(currentQuery, activeTab);
        
        setActiveTab(tabId);
        
        // Re-run search on tab switch if a query exists
        if (currentQuery) {
            // For news tab, we want to force a refresh to get the latest feeds
            if (activeTab === 'news') {
                performSearch(currentQuery, activeTab, true);
            } else {
                performSearch(currentQuery, activeTab);
            }
        }
    });
});

function openView(contentHTML, title, onClose) {
    const view = document.createElement('div');
    view.classList.add('view'); // Generic view class
    view.innerHTML = `
        <div class="view-header">
            <button class="back-button">
                <span class="back-button-icon">arrow_back</span>
            </button>
            <h2>${title}</h2>
        </div>
        <div class="view-content">
            ${contentHTML}
        </div>
    `;
    document.body.appendChild(view);

    // Save scroll position and hide main UI
    scrollPosition = window.scrollY;
    document.querySelector('.container').classList.add('hidden');

    const backButton = view.querySelector('.back-button');
    backButton.onclick = () => {
        document.body.removeChild(view);
        // Show main UI and restore scroll position
        document.querySelector('.container').classList.remove('hidden');
        window.scrollTo(0, scrollPosition);
        if (onClose) onClose();
    };
}

function openArticleView(content, title) {
    openView(`<p>${content}</p>`, title);
}

function openSubscriptionView() {
    const contentHTML = `
        <div class="subscription-grid">
            ${rssFeeds.map(feed => {
                const isChecked = getSubscribedFeeds().includes(feed.source);
                return `
                    <div class="subscription-item" data-source="${feed.source}">
                        <div class="subscription-icon">
                            <span class="material-symbols-rounded">rss_feed</span>
                        </div>
                        <span class="subscription-label">${feed.source}</span>
                        <input type="checkbox" class="hidden-checkbox" id="${feed.source}" 
                            ${isChecked ? 'checked' : ''}>
                        <span class="material-symbols-rounded checkbox-icon">
                            ${isChecked ? 'check_box' : 'add'}
                        </span>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    openView(contentHTML, 'Manage Subscriptions');

    // Add click handlers for the entire item
    const view = document.querySelector('.view');
    view.querySelectorAll('.subscription-item').forEach(item => {
        item.addEventListener('click', () => {
            const checkbox = item.querySelector('.hidden-checkbox');
            checkbox.checked = !checkbox.checked;
            const checkboxIcon = item.querySelector('.checkbox-icon');
            checkboxIcon.textContent = checkbox.checked ? 'check_box' : 'add';
            toggleSubscription(item.dataset.source, checkbox.checked);
        });
    });
}

function toggleSubscription(source, isSubscribed) {
    const subscribedFeeds = getSubscribedFeeds();
    if (isSubscribed) {
        subscribedFeeds.push(source);
    } else {
        const index = subscribedFeeds.indexOf(source);
        if (index > -1) {
            subscribedFeeds.splice(index, 1);
        }
    }
    setSubscribedFeeds(subscribedFeeds);
}

function setActiveTab(tabId) {
    // Update tab buttons
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === tabId) {
            tab.classList.add('active');
        }
    });

    // Show active tab content, hide others
    const activeType = tabId.replace('-tab', '');
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    const activeContent = document.querySelector(`.${activeType}-content`);
    if (activeContent) { // Add check to ensure content exists
        activeContent.style.display = 'block';
    }

    // Add or remove map-active class from container and body
    const container = document.querySelector('.container');
    if (activeType === 'map') {
        container.classList.add('map-active');
        document.body.classList.add('map-active');
        showMap();
    } else {
        container.classList.remove('map-active');
        document.body.classList.remove('map-active');
        hideMap();
        
        // Hide location info when switching away from map
        if (locationInfoContainer) {
            locationInfoContainer.style.display = 'none'; // Ensure it's hidden
        }
    }

    // Handle chat tab - move form to bottom
    if (activeType === 'chat') {
        container.classList.add('chat-active');
        document.body.classList.add('chat-active');
        
        // Only initialize chat if not already initialized
        if (!window.isChatInitialized) {
            initializeChatEngine().then(() => {
                window.isChatInitialized = true;
                // Render chat messages
                const chatResults = document.querySelector('.chat-results');
                if (chatResults) {
                    renderChatMessages(chatResults);
                }
            });
        } else {
            // If chat is already initialized, just render messages
            const chatResults = document.querySelector('.chat-results');
            if (chatResults) {
                renderChatMessages(chatResults);
            }
        }
    } else {
        container.classList.remove('chat-active');
        document.body.classList.remove('chat-active');
    }

    // Initialize map if map tab is selected and not already initialized
    // Check if map instance exists before rendering
    if (activeType === 'map') {
        const mapResults = activeContent?.querySelector('.map-results'); // Optional chaining
        if (mapResults) {
             // Pass the current query (q) from URL if available
            const { q } = getURLParams(); 
            renderMapResults(q, mapResults);
        }
    }
}

function createSubscriptionButton() {
    const subscriptionButton = document.createElement('button');
    subscriptionButton.classList.add('subscription-button');
    subscriptionButton.innerHTML = `
        <span class="material-symbols-rounded">checklist</span>
    `;
    subscriptionButton.onclick = openSubscriptionView;
    return subscriptionButton;
}

function performSearch(query, type, forceRefresh = false, searchAllSources = false, useDefaultSources = false) {
    // Ensure query is a string
    query = String(query || ''); 
    
    const resultsContainer = document.querySelector(`.${type}-results`);
    const loadingIndicator = document.querySelector(`.${type}-content .loading-indicator`);
    
    // Check if elements exist before manipulating
    if (!resultsContainer || !loadingIndicator) {
        console.error(`Could not find results container or loading indicator for type: ${type}`);
        return; // Exit if essential elements are missing
    }

    // Skip search for chat type - it's handled by the chat module
    if (type === 'chat') {
        return;
    }

    // Clear previous results and show loading indicator
    if (type !== 'map') {
        resultsContainer.innerHTML = '';
    }
    loadingIndicator.style.display = 'block';

    // Define search functions map
    const searchFunctions = {
        web: searchWeb,
        image: searchImages,
        video: searchVideos,
        news: (q) => searchNews(q, searchAllSources, useDefaultSources),
        // Add shop later if implemented
        map: (q) => Promise.resolve(renderMapResults(q, resultsContainer))
    };

    // Define render functions map
    const renderFunctions = {
        web: renderWebResults,
        image: renderImageResults,
        video: renderVideoResults,
        news: (items, container) => renderNewsResults(items, container, performSearch),
        map: () => {} // Map rendering is handled directly
    };

    // Get the appropriate search function
    const searchFn = searchFunctions[type];
    const renderFn = renderFunctions[type];

    if (searchFn) {
        searchFn(query)
            .then(items => {
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                if (renderFn && type !== 'map') {
                    renderFn(items, resultsContainer);
                }
            })
            .catch(error => {
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                
                // Handle API_NOT_CONFIGURED error specially
                if (error.message === 'API_NOT_CONFIGURED') {
                    if (renderFn && type !== 'map') {
                        renderFn('API_NOT_CONFIGURED', resultsContainer);
                    }
                } else {
                    console.error(`Error searching ${type}:`, error);
                    if (resultsContainer && type !== 'map') {
                        resultsContainer.innerHTML = `<p>Error loading results: ${error.message}</p>`;
                    }
                }
            });
    } else if (type !== 'map' && type !== 'chat') {
        console.warn(`Search type '${type}' not implemented.`);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (resultsContainer) resultsContainer.innerHTML = `<p>Search type '${type}' is not available yet.</p>`;
    }
}

// Add event listener for the header click
header.addEventListener('click', function() {
    searchInput.value = ''; // Clear search input
    updateURL('', 'web'); // Reset URL and title
    setActiveTab('web-tab'); // Set web tab as active

    // Clear web results and hide loading indicator
    const webResultsContainer = document.querySelector('.web-results');
    const webLoadingIndicator = document.querySelector('.web-content .loading-indicator');
    if (webResultsContainer) {
        webResultsContainer.innerHTML = '';
    }
    if (webLoadingIndicator) {
        webLoadingIndicator.style.display = 'none';
    }
});

// Make openView function available globally
window.openView = openView;