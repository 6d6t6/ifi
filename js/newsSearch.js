export function searchNews(query) {
    const apiKey = 'YOUR_NEWS_API_KEY';
    const url = `https://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.articles) {
                return data.articles;
            } else {
                throw new Error('No news results found');
            }
        });
}

export function renderNewsResults(articles, container) {
    container.innerHTML = '';

    articles.forEach(article => {
        const title = article.title;
        const url = article.url;
        const description = article.description;

        const resultItem = document.createElement('div');
        resultItem.classList.add('search-result-item');

        const titleElement = document.createElement('a');
        titleElement.href = url;
        titleElement.textContent = title;
        titleElement.classList.add('search-result-title');

        const descriptionElement = document.createElement('p');
        descriptionElement.textContent = description;
        descriptionElement.classList.add('search-result-description');

        resultItem.appendChild(titleElement);
        resultItem.appendChild(descriptionElement);

        container.appendChild(resultItem);
    });
}
