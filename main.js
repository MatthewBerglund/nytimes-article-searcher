const submitButton = document.getElementById('submit');
submitButton.addEventListener('click', handleSubmitSearchClick);

let resultsPage;

function displayArticles(articles) {
  const searchResults = document.querySelector('.search-results');
  
  while (searchResults.firstChild) {
    searchResults.removeChild(searchResults.firstChild);
  }

  const articlesOnPage = articles.response.docs;

  if (articlesOnPage.length > 0) {
    const resultsNav = document.createElement('nav');
    searchResults.appendChild(resultsNav);

    const prevTen = document.createElement('button');
    prevTen.textContent = 'Previous 10';
    resultsNav.appendChild(prevTen);
    prevTen.addEventListener('click', handlePreviousPageClick);

    const nextTen = document.createElement('button');
    nextTen.textContent = 'Next 10';
    resultsNav.appendChild(nextTen);
    nextTen.addEventListener('click', handleNextPageClick); 
    
    articlesOnPage.forEach(article => {
      const articleDiv = document.createElement('div');
      articleDiv.setAttribute('class', 'article');

      const anchor = document.createElement('a');
      anchor.href = article.web_url;
      articleDiv.appendChild(anchor);

      const headline = document.createElement('h2');
      headline.textContent = article.headline.main;
      anchor.appendChild(headline);

      const abstractPara = document.createElement('p');
      abstractPara.textContent = article.abstract;
      articleDiv.appendChild(abstractPara);

      if (article.multimedia.length > 0) {
        const img = document.createElement('img');
        const imageURL = article.multimedia.filter(image => image.subtype === 'blog225')[0].url;
        img.src = `http://www.nytimes.com/${imageURL}`;
        articleDiv.appendChild(img);
      }

      const keywordsPara = document.createElement('p');
      keywordsPara.setAttribute('class', 'keywords');
      keywordsPara.textContent = 'Keywords: ';
      articleDiv.appendChild(keywordsPara);

      article.keywords.forEach(keyword => {
        const keywordSpan = document.createElement('span');
        keywordSpan.setAttribute('class', 'keyword');
        keywordSpan.textContent = keyword.value;
        keywordsPara.appendChild(keywordSpan);
      });

      searchResults.appendChild(articleDiv);
    });
  }
}

function fetchArticles() {
  const baseURL = 'https://api.nytimes.com/svc/search/v2/articlesearch.json';
  const key = 'brtQ9fXA0I1ATPctklZe6RcanXZRklYl';
  const query = document.getElementById('search-term').value;
  let fullURL = `${baseURL}?q=${query}&page=${resultsPage}&api-key=${key}`;
  
  let beginDate = document.getElementById('begin-date').value;
  let endDate = document.getElementById('end-date').value;

  if (beginDate) {
    beginDate = beginDate.replaceAll('-', '');
    fullURL += `&begin_date=${beginDate}`;
  }
  
  if (endDate) {
    endDate = endDate.replaceAll('-', '');
    fullURL += `&end_date=${endDate}`;
  }

  fetch(fullURL)
    .then(response => response.json())
    .then(articlesJson => {
      displayArticles(articlesJson);
    });
}

function handlePreviousPageClick() {
  if (resultsPage > 0) {
    resultsPage--;
  }
  fetchArticles();
}

function handleNextPageClick() {
  resultsPage++;
  fetchArticles();
}

function handleSubmitSearchClick(event) {
  event.preventDefault();
  resultsPage = 0;
  fetchArticles();
}