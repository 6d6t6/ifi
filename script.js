const form = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const searchResults = document.getElementById('search-results');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

window.addEventListener('DOMContentLoaded', function () {
    // Check if there's an active tab
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab) {
        // If no active tab, default to "Web" tab
        const webTab = document.getElementById('web-tab');
        setActiveTab('web-tab');
        switchTabContent('web-tab');
    }
});

form.addEventListener('submit', function (event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query === '') return;

    const activeTabId = document.querySelector('.tab.active').id;
    if (activeTabId === 'web-tab') {
        searchWeb(query);
    } else if (activeTabId === 'image-tab') {
        searchImages(query);
    } else if (activeTabId === 'video-tab') {
        searchVideos(query);
    }
});

tabs.forEach(tab => {
    tab.addEventListener('click', function () {
        const tabId = this.id;
        setActiveTab(tabId);
        switchTabContent(tabId);
    });
});

function setActiveTab(tabId) {
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === tabId) {
            tab.classList.add('active');
        }
    });
}

function switchTabContent(tabId) {
    tabContents.forEach(content => {
        content.style.display = 'none';
        if (content.id === `${tabId}-content`) {
            content.style.display = 'block';
        }
    });
}

function searchWeb(query) {
    const apiKey = 'AIzaSyAkz9xe3WZ36UvGP0gI5Qa5aeOpFHBCNyU';
    const cx = '107d783bdf73443d3';
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.items) {
                renderWebResults(data.items);
            } else {
                searchResults.innerHTML = 'No results found';
            }
        })
        .catch(error => {
            console.error('Error fetching search results:', error);
        });
}

function renderWebResults(items) {
    searchResults.innerHTML = '';

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

        searchResults.appendChild(resultItem);
    });
}

function searchImages(query) {
    const apiKey = 'AIzaSyAkz9xe3WZ36UvGP0gI5Qa5aeOpFHBCNyU';
    const cx = '107d783bdf73443d3';
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&searchType=image`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.items) {
                renderImageResults(data.items);
            } else {
                searchResults.innerHTML = 'No image results found';
            }
        })
        .catch(error => {
            console.error('Error fetching image results:', error);
        });
}


function renderImageResults(items) {
    searchResults.innerHTML = '';
  
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
  
    searchResults.appendChild(gridContainer);
  }
  