const sortSelect = document.getElementById('sort-by-select');
sortSelect.addEventListener('change', submitNewSearch);

const submitButton = document.getElementById('submit');
submitButton.addEventListener('click', event => {
  sortSelect.value = 'relevance';
  submitNewSearch(event);
});

const filtersButton = document.getElementById('filters-button');
filtersButton.addEventListener('click', handleToggleFiltersClick);

const previousPageButton = document.getElementById('previous-page-button');
previousPageButton.addEventListener('click', handlePaginationClick);

const nextPageButton = document.getElementById('next-page-button');
nextPageButton.addEventListener('click', handlePaginationClick);

let articles;
let totalHits;
let resultsPage;

function displayArticles() {
  const searchResults = document.getElementById('search-results-container');
  
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
      anchor.target = '_blank';
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

function updateNavDisplay() {
  const nav = document.querySelector('nav');
  const sortDiv = document.getElementById('sort-by-container');

  if (totalHits > 0) {
    if (resultsPage === 0) {
      previousPageButton.disabled = true;
      previousPageButton.classList.add('disabled');
    } else {
      previousPageButton.disabled = false;
      previousPageButton.classList.remove('disabled');
    }
    
    const numArticlesOnPage = articles.response.docs.length;
    if (numArticlesOnPage < 10) {
      nextPageButton.disabled = true;
      nextPageButton.classList.add('disabled');
    } else {
      nextPageButton.disabled = false;
      nextPageButton.classList.remove('disabled');
    }

    nav.style.display = 'flex';
    sortDiv.style.display = 'flex';
  } else {
    nav.style.display = 'none';
    sortDiv.style.display = 'none';
  }
}

function displayMetaInfo() {
  const metaInfoDiv = document.getElementById('total-hits-container');

  while (metaInfoDiv.firstChild) {
    metaInfoDiv.removeChild(metaInfoDiv.firstChild);
  }
  
  const totalHitsPara = document.createElement('p');
  totalHitsPara.textContent = `Your query returned ${totalHits} hits.`;
  metaInfoDiv.appendChild(totalHitsPara);
}

async function fetchArticles() {
  const baseURL = 'https://api.nytimes.com/svc/search/v2/articlesearch.json';
  const key = 'brtQ9fXA0I1ATPctklZe6RcanXZRklYl';
  let fullURL = `${baseURL}?api-key=${key}&page=${resultsPage}`;
  
  const query = document.getElementById('query-input').value;
  if (query) {
    fullURL += `&q=${query}`;
  }

  const beginDate = document.getElementById('begin-date').value;
  if (beginDate) {
    fullURL += `&begin_date=${beginDate}`;
  }
  
  const endDate = document.getElementById('end-date').value;
  if (endDate) {
    fullURL += `&end_date=${endDate}`;
  }

  const sortByValue = sortSelect.value;
  if (sortByValue) {
    fullURL += `&sort=${sortByValue}`;
  }

  let filterSubcomponents = [];
  const newsDeskFilters = Array.from(document.getElementById('newsdesk-fieldset').elements);
  const selectedNewsDesks = newsDeskFilters.filter(newsDesk => newsDesk.checked);

  if (selectedNewsDesks.length > 0) {
    const newsDeskComponent = getNewsDeskURLComponent(selectedNewsDesks);
    filterSubcomponents.push(newsDeskComponent);
  }

  const materialTypeFilters = Array.from(document.getElementById('material-types-fieldset').elements);
  const selectedTypes = materialTypeFilters.filter(type => type.checked);

  if (selectedTypes.length > 0) {
    const materialTypeComponent = getMaterialTypeURLComponent(selectedTypes);
    filterSubcomponents.push(materialTypeComponent);
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
  totalHits = articles.response.meta.hits;
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

function getMaterialTypeURLComponent(typesArray) {
  let filterOptions = '';

  for (let i = 0; i < typesArray.length; i++) {
    let currentType = typesArray[i].value;
    
    if (i === 0) {
      filterOptions += `"${currentType}"`;
    } else {
      filterOptions += ` "${currentType}"`;
    }
  }

  filterOptions = encodeURIComponent(filterOptions);
  return `type_of_material:(${filterOptions})`;
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
  const filtersDiv = document.getElementById('filters-container');
  
  if (!filtersDiv.style.display) {
    filtersDiv.style.display = 'grid';
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
    scroll(0, 0);
    updateNavDisplay();
    displayArticles();
  });
}

function submitNewSearch(event) {
  event.preventDefault();
  resultsPage = 0;
  fetchArticles().then(() => {
    updateNavDisplay();
    displayMetaInfo();
    displayArticles();
  });
}
