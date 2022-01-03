const submitButton = document.getElementById('submit');
submitButton.addEventListener('click', handleSubmitSearchClick);

const toggleFiltersButton = document.getElementById('toggle-filters');
toggleFiltersButton.addEventListener('click', handleToggleFiltersClick);

let articles;
let resultsPage;

function displayArticles() {
  const searchResults = document.querySelector('.search-results');
  
  while (searchResults.firstChild) {
    searchResults.removeChild(searchResults.firstChild);
  }

  const articlesOnPage = articles.response.docs;

  if (articlesOnPage.length > 0) {
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

      const articleImage = article.multimedia.find(image => image.subtype === 'blog225');
      
      if (articleImage) {
        const imgEl = document.createElement('img');
        imgEl.src = `http://www.nytimes.com/${articleImage.url}`;
        articleDiv.appendChild(imgEl);
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

function displayNavigation() {
  const resultsNav = document.createElement('nav');
  
  const previousPage = document.createElement('button');
  previousPage.addEventListener('click', handlePaginationClick);
  previousPage.id = 'prev-page-button';
  previousPage.textContent = '<';

  if (resultsPage === 0) {
    previousPage.disabled = true;
    previousPage.classList.add('disabled');
  }

  resultsNav.appendChild(previousPage);
  
  const nextPage = document.createElement('button');
  nextPage.addEventListener('click', handlePaginationClick);
  nextPage.id = 'next-page-button';
  nextPage.textContent = '>';
  
  if (articles.response.docs.length < 10) {
    nextPage.disabled = true;
    nextPage.classList.add('disabled');
  }

  resultsNav.appendChild(nextPage);
  document.querySelector('.search-results').appendChild(resultsNav);
}

function displayMetaInfo() {
  const metaInfoDiv = document.querySelector('.meta-info');

  while (metaInfoDiv.firstChild) {
    metaInfoDiv.removeChild(metaInfoDiv.firstChild);
  }
  
  const totalHits = articles.response.meta.hits;
  const totalHitsPara = document.createElement('p');
  totalHitsPara.textContent = `Your query returned ${totalHits} hits.`;
  metaInfoDiv.appendChild(totalHitsPara);
}

async function fetchArticles() {
  const baseURL = 'https://api.nytimes.com/svc/search/v2/articlesearch.json';
  const key = 'brtQ9fXA0I1ATPctklZe6RcanXZRklYl';
  const query = document.getElementById('search-term').value;
  let fullURL = `${baseURL}?q=${query}&page=${resultsPage}&api-key=${key}`;
  
  let beginDate = document.getElementById('begin-date').value;
  let endDate = document.getElementById('end-date').value;

  if (beginDate) {
    fullURL += `&begin_date=${beginDate}`;
  }
  
  if (endDate) {
    fullURL += `&end_date=${endDate}`;
  }

  let filterSubcomponents = [];
  const newsDeskFilters = Array.from(document.getElementById('newsdesk').elements);
  const selectedFilters = newsDeskFilters.filter(option => option.checked);

  if (selectedFilters.length > 0) {
    const newsDeskComponent = getNewsDeskURLComponent(selectedFilters);
    filterSubcomponents.push(newsDeskComponent);
  }

  const location = document.getElementById('location-filter').value;
  
  if (location) {
    const locationComponent = getLocationURLComponent(location);
    filterSubcomponents.push(locationComponent);
  }

  if (filterSubcomponents.length > 0) {
    fullURL += getFilterURLComponent(filterSubcomponents);
  }

  const response = await fetch(fullURL);
  articles = await response.json();
}

function getFilterURLComponent(subcomponentArray) {
  let urlComponent = '&fq=';

  for (let i = 0; i < subcomponentArray.length; i++) {
    let currentSubcomponent = subcomponentArray[i];
    if (i === 0) {
      urlComponent += currentSubcomponent;
    } else {
      urlComponent += ` AND ${currentSubcomponent}`;
    }
  }

  return urlComponent;
}

function getLocationURLComponent(locationString) {
  locationString.trim();
  locationString = encodeURIComponent(`"${locationString}"`);
  return `glocations:(${locationString})`;
}

function getNewsDeskURLComponent(newsDeskArray) {
  let filterOptions = '';

  for (let i = 0; i < newsDeskArray.length; i++) {
    let currentNewsDesk = newsDeskArray[i].value;
    
    if (i === 0) {
      filterOptions += `"${currentNewsDesk}"`;
    } else {
      filterOptions += ` "${currentNewsDesk}"`;
    }
  }

  filterOptions = encodeURIComponent(filterOptions);
  return `news_desk:(${filterOptions})`;
}

function handleToggleFiltersClick(event) {
  event.preventDefault();

  const button = event.target;
  const filtersDiv = document.getElementById('filters');
  
  if (!filtersDiv.style.display) {
    filtersDiv.style.display = 'block';
    button.textContent = 'Hide filters';
  } else {
    filtersDiv.style.display = '';
    button.textContent = 'Show filters';
  }
}

function handlePaginationClick(event) {
  if (event.target.id === 'next-page-button') {
    resultsPage++;
  } else {
    resultsPage--;
  }

  fetchArticles().then(() => {
    displayArticles();
    displayNavigation();
    scroll(0, 0);
  });
}

function handleSubmitSearchClick(event) {
  event.preventDefault();
  resultsPage = 0;
  fetchArticles().then(() => {
    displayArticles();
    displayNavigation();
    displayMetaInfo();
  });
}