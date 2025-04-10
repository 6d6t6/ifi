const parser = new RSSParser();
const corsProxy = 'https://corsproxy.io/?url=';
let cachedItems = [];
let lastFetchTime = 0;
const cacheDuration = 60000; // 1 minute
let subscriptionsChanged = false; // Flag to track subscription changes

// Map feed URLs to source names
export const rssFeeds = [
    { url: `${corsProxy}http://feeds.abcnews.com/abcnews/topstories`, source: 'ABC News' },
    { url: `${corsProxy}https://www.aol.com/rss-index.xml`, source: 'Aol' },
    { url: `${corsProxy}https://feedx.net/rss/ap.xml`, source: 'Associated Press' },
    { url: `${corsProxy}https://feeds.bbci.co.uk/news/rss.xml`, source: 'BBC News' },
    { url: `${corsProxy}https://www.buzzfeed.com/index.xml`, source: 'BuzzFeed' },
    { url: `${corsProxy}https://www.cbsnews.com/latest/rss/main`, source: 'CBS News' },
    { url: `${corsProxy}https://www.cnbc.com/id/100003114/device/rss/rss.html`, source: 'CNBC' },
    { url: `${corsProxy}https://collider.com/feed/`, source: 'Collider' },
    { url: `${corsProxy}https://www.etonline.com/news/rss`, source: 'Entertainment Tonight' },
    { url: `${corsProxy}https://www.euronews.com/rss`, source: 'Euronews' },
    { url: `${corsProxy}https://moxie.foxnews.com/google-publisher/latest.xml`, source: 'Fox News' },
    { url: `${corsProxy}https://hollywoodlife.com/feed/`, source: 'Hollywood Life' },
    { url: `${corsProxy}https://chaski.huffpost.com/us/auto/vertical/us-news`, source: 'HuffPost' },
    { url: `${corsProxy}https://feeds.feedburner.com/ign/all`, source: 'IGN' },
    { url: `${corsProxy}https://www.indiewire.com/feed/`, source: 'IndieWire' },
    { url: `${corsProxy}https://www.musicbusinessworldwide.com/feed/`, source: 'Music Business Worldwide' },
    { url: `${corsProxy}https://www.nasa.gov/rss/dyn/breaking_news.rss`, source: 'NASA' },
    { url: `${corsProxy}https://www.nerdwallet.com/blog/feed/`, source: 'NerdWallet' },
    { url: `${corsProxy}https://www.politico.com/rss/politicopicks.xml`, source: 'Politico Picks' },
    { url: `${corsProxy}https://www.polygon.com/rss/index.xml`, source: 'Polygon' },
    { url: `${corsProxy}https://www.popsugar.com/news/feed`, source: 'POPSUGAR' },
    { url: `${corsProxy}https://openrss.org/www.reuters.com/world/`, source: 'Reuters' },
    { url: `${corsProxy}https://techcrunch.com/feed/`, source: 'TechCrunch' },
    { url: `${corsProxy}https://www.theguardian.com/world/rss`, source: 'The Guardian' },
    { url: `${corsProxy}https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml`, source: 'The New York Times' },
    { url: `${corsProxy}https://feeds.a.dj.com/rss/RSSWorldNews.xml`, source: 'The Wall Street Journal' },
    { url: `${corsProxy}https://feeds.washingtonpost.com/rss/world`, source: 'The Washington Post' },
    { url: `${corsProxy}https://www.theverge.com/rss/index.xml`, source: 'The Verge' },
    { url: `${corsProxy}https://time.com/feed/`, source: 'TIME' },
    { url: `${corsProxy}https://www.tmz.com/rss.xml`, source: 'TMZ' },
    { url: `${corsProxy}https://www.tvfanatic.com/feed/`, source: 'TV Fanatic' },
    { url: `${corsProxy}http://tvline.com/feed/`, source: 'TVLine' },
    { url: `${corsProxy}https://www.usmagazine.com/feed/`, source: 'Us Weekly' },
    { url: `${corsProxy}https://variety.com/feed/`, source: 'Variety' },
    { url: `${corsProxy}https://www.yahoo.com/news/rss`, source: 'Yahoo News' }
    
    // Add more RSS feed URLs and their sources as needed 
];

// Default popular sources to subscribe to
const defaultSubscribedSources = [
    'The New York Times',
    'BBC News',
    'Reuters'
];

export function getSubscribedFeeds() {
    const subscribedFeeds = localStorage.getItem('subscribedFeeds');
    if (!subscribedFeeds) {
        // If no subscriptions exist, return the default sources
        return defaultSubscribedSources;
    }
    return JSON.parse(subscribedFeeds);
}

export function setSubscribedFeeds(subscribedFeeds) {
    localStorage.setItem('subscribedFeeds', JSON.stringify(subscribedFeeds));
    subscriptionsChanged = true; // Set flag when subscriptions are updated
}

export async function preloadFeeds(forceRefresh = false, useAllSources = false, useDefaultSources = false) {
    const now = Date.now();
    // Use cache if valid and not forcing refresh
    if (!forceRefresh && !subscriptionsChanged && now - lastFetchTime < cacheDuration) return;

    cachedItems = [];
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block'; // Show loading indicator
    }

    // Determine which feeds to use
    let feedsToUse = [];
    
    if (useAllSources) {
        // Use all available feeds
        feedsToUse = rssFeeds.map(feed => feed.source);
    } else if (useDefaultSources) {
        // Use default sources
        feedsToUse = defaultSubscribedSources;
    } else {
        // Use subscribed feeds
        feedsToUse = getSubscribedFeeds();
    }
    
    // If no feeds are available, return early
    if (feedsToUse.length === 0) {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        subscriptionsChanged = false; // Reset the flag
        return [];
    }

    for (const feed of rssFeeds) {
        if (!feedsToUse.includes(feed.source)) continue; // Skip feeds not in our list

        try {
            const feedData = await parser.parseURL(feed.url);
            feedData.items.forEach(item => {
                item.feedSource = feed.source;
                item.pubDate = new Date(item.pubDate);
                if (isNaN(item.pubDate.getTime())) {
                    console.warn(`Skipping item with invalid date from ${feed.source}`);
                    return; // Skip items with invalid dates
                }
                cachedItems.push(item);
            });
            console.log(`✅ ${feed.source}`);
        } catch (error) {
            console.error(`❌ ${feed.source}: ${error.message}`);
        }
    }
    lastFetchTime = now;
    subscriptionsChanged = false; // Reset the flag after fetching
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none'; // Hide loading indicator
    }
}

export async function searchNews(query, searchAllSources = false, useDefaultSources = false) {
    // Call preloadFeeds with the appropriate parameters
    await preloadFeeds(true, searchAllSources, useDefaultSources);

    // If no items are cached, return empty array
    if (cachedItems.length === 0) {
        return [];
    }

    // Filter items based on the query
    const filteredItems = cachedItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        (item.content && item.content.toLowerCase().includes(query.toLowerCase()))
    );

    // Sort items by publication date, most recent first
    filteredItems.sort((a, b) => b.pubDate - a.pubDate);

    return filteredItems;
}

export function renderNewsResults(items, container, performSearchFn) {
    container.innerHTML = '';

    // Check if there are no subscribed sources AND no items to display
    const subscribedFeeds = getSubscribedFeeds();
    if (subscribedFeeds.length === 0 && (!items || items.length === 0)) {
        const noSubscriptionsMessage = document.createElement('div');
        noSubscriptionsMessage.classList.add('no-subscriptions-message');
        noSubscriptionsMessage.innerHTML = `
            <p>You haven't subscribed to any news sources yet.</p>
            <div class="subscription-actions">
                <button class="subscription-action-button" id="search-top-sources">
                    <span class="material-symbols-rounded">search</span> Search Top Sources <span class="material-symbols-rounded">info</span>
                </button>
                <button class="subscription-action-button" id="search-all-sources">
                    <span class="material-symbols-rounded">search</span> Search All Sources <span class="material-symbols-rounded">info</span>
                </button>
                <p class="search-all-sources-note">(Searching all may take longer)</p>
            </div>
        `;
        container.appendChild(noSubscriptionsMessage);
        
        // Add event listeners for the buttons
        document.getElementById('search-top-sources').addEventListener('click', () => {
            const query = document.getElementById('search-input').value.trim();
            // Force a refresh and use default sources
            performSearchFn(query, 'news', true, false, true);
        });
        
        document.getElementById('search-all-sources').addEventListener('click', () => {
            const query = document.getElementById('search-input').value.trim();
            // Force a refresh and use all sources
            performSearchFn(query, 'news', true, true, false);
        });
        
        return;
    }

    // If there are no results but we have subscribed sources, show a message with action buttons
    if (!items || items.length === 0) {
        const noResultsMessage = document.createElement('div');
        noResultsMessage.classList.add('no-results-message');
        noResultsMessage.innerHTML = `
            <p>No results found. Try a different search term or search in more sources.</p>
            <div class="subscription-actions">
                <button class="subscription-action-button" id="search-top-sources">
                    <span class="material-symbols-rounded">search</span> Search Top Sources
                </button>
                <button class="subscription-action-button" id="search-all-sources">
                    <span class="material-symbols-rounded">search</span> Search All Sources
                </button>
                <p class="search-all-sources-note">(may take longer)</p>
            </div>
        `;
        container.appendChild(noResultsMessage);
        
        // Add event listeners for the buttons
        document.getElementById('search-top-sources').addEventListener('click', () => {
            const query = document.getElementById('search-input').value.trim();
            // Force a refresh and use default sources
            performSearchFn(query, 'news', true, false, true);
        });
        
        document.getElementById('search-all-sources').addEventListener('click', () => {
            const query = document.getElementById('search-input').value.trim();
            // Force a refresh and use all sources
            performSearchFn(query, 'news', true, true, false);
        });
        
        return;
    }

    items.forEach(item => {
        if (!item.pubDate || isNaN(item.pubDate.getTime())) return; // Skip if date is invalid

        const title = item.title;
        const link = item.link;
        const description = item.contentSnippet || item.content;

        // Extract image URL from different possible tags
        let thumbnail = 'default-thumbnail.jpg'; // Default image
        if (item.enclosure && item.enclosure.url) {
            thumbnail = item.enclosure.url;
        } else if (item['media:content'] && item['media:content']['@_url']) {
            thumbnail = item['media:content']['@_url'];
        } else if (item['media:thumbnail'] && item['media:thumbnail']['@_url']) {
            thumbnail = item['media:thumbnail']['@_url'];
        } else if (item['media:content'] && item['media:content'].url) {
            thumbnail = item['media:content'].url;
        } else if (item['media:thumbnail'] && item['media:thumbnail'].url) {
            thumbnail = item['media:thumbnail'].url;
        } else if (item['media:group'] && item['media:group']['media:content'] && item['media:group']['media:content'].url) {
            thumbnail = item['media:group']['media:content'].url;
        }

        // Use feed source and author
        const author = item.author || item['dc:creator'] || '';
        const source = item.feedSource || 'Unknown Source';
        const pubDate = formatRelativeDate(item.pubDate);

        const resultItem = document.createElement('div');
        resultItem.classList.add('search-result-item');

        const thumbnailElement = document.createElement('img');
        thumbnailElement.src = thumbnail;
        thumbnailElement.alt = 'Thumbnail';
        thumbnailElement.classList.add('search-result-thumbnail');

        const textContainer = document.createElement('div');
        textContainer.classList.add('text-container');

        const titleElement = document.createElement('a');
        titleElement.href = link;
        titleElement.textContent = title;
        titleElement.classList.add('search-result-title');

        const descriptionElement = document.createElement('p');
        descriptionElement.classList.add('search-result-description');
        handleDescription(description, descriptionElement, title);

        const authorElement = document.createElement('p');
        authorElement.textContent = author;
        authorElement.classList.add('search-result-author');

        const sourceElement = document.createElement('p');
        sourceElement.textContent = source;
        sourceElement.classList.add('search-result-source');

        const dateElement = document.createElement('p');
        dateElement.textContent = pubDate;
        dateElement.classList.add('search-result-date');

        textContainer.appendChild(titleElement);
        textContainer.appendChild(descriptionElement);
        if (author) {
            textContainer.appendChild(authorElement);
        }
        textContainer.appendChild(sourceElement);
        textContainer.appendChild(dateElement);

        resultItem.appendChild(thumbnailElement);
        resultItem.appendChild(textContainer);

        container.appendChild(resultItem);
    });

    // Update timestamps every 60 seconds
    setInterval(() => {
        container.querySelectorAll('.search-result-date').forEach((dateElement, index) => {
            const item = items[index];
            if (item && item.pubDate) {
                dateElement.textContent = formatRelativeDate(item.pubDate);
            }
        });
    }, 60000);
}

let scrollPosition = 0;

function openArticleView(content, title) {
    const articleView = document.createElement('div');
    articleView.classList.add('article-view');
    articleView.innerHTML = `
        <div class="article-header">
            <button class="back-button">
                <span class="back-button-icon">arrow_back</span>
            </button>
            <h2>${title}</h2>
        </div>
        <div class="article-content">
            <p>${content}</p>
        </div>
    `;
    document.body.appendChild(articleView);

    // Save scroll position and hide main UI
    scrollPosition = window.scrollY;
    document.querySelector('.container').classList.add('hidden');

    const backButton = articleView.querySelector('.back-button');
    backButton.onclick = () => {
        document.body.removeChild(articleView);
        // Show main UI and restore scroll position
        document.querySelector('.container').classList.remove('hidden');
        window.scrollTo(0, scrollPosition);
    };
}

function handleDescription(description, element, title) {
    const maxLength = 120;
    const longLength = 420;

    if (!description) {
        element.textContent = 'No description available.';
        return;
    }

    const truncateText = (text, length) => {
        if (text.length <= length) return text;
        const truncated = text.substring(0, length);
        return truncated.substring(0, truncated.lastIndexOf(' '));
    };

    if (description.length <= maxLength) {
        element.textContent = description;
    } else if (description.length <= longLength) {
        const truncated = truncateText(description, maxLength);
        element.textContent = truncated + ' ';
        const expandLink = document.createElement('a');
        expandLink.textContent = '•••';
        expandLink.href = '#';
        expandLink.style.textDecoration = 'none';
        expandLink.style.color = '#7ec79e';
        expandLink.onclick = (e) => {
            e.preventDefault();
            element.textContent = description;
        };
        element.appendChild(expandLink);
    } else {
        const truncated = truncateText(description, maxLength);
        element.textContent = truncated + ' ';
        const articleLink = document.createElement('a');
        articleLink.textContent = '•••';
        articleLink.href = '#';
        articleLink.style.textDecoration = 'none';
        articleLink.style.color = '#7ec79e';
        articleLink.onclick = (e) => {
            e.preventDefault();
            openArticleView(description, title);
        };
        element.appendChild(articleLink);
    }
}

function formatRelativeDate(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // Difference in seconds

    if (diff < 60) return `${diff} second${diff !== 1 ? 's' : ''} ago`;
    if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    if (diff < 604800) {
        const days = Math.floor(diff / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    if (diff < 2419200) {
        const weeks = Math.floor(diff / 604800);
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    }
    if (diff < 29030400) {
        const months = Math.floor(diff / 2419200);
        return `${months} month${months !== 1 ? 's' : ''} ago`;
    }

    return date.toLocaleDateString(); // Fallback to exact date
}