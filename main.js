let articles;
let resultsPage;

const sortSelect = document.getElementById('sort-by-select');
const filtersButton = document.getElementById('filters-button');
const filterMenu = document.getElementById('filters-container');
const queryInput = document.getElementById('query-input');
const previousPageButton = document.getElementById('previous-page-button');
const nextPageButton = document.getElementById('next-page-button');
const articlesContainer = document.getElementById('articles-container');

bindEvents();

function bindEvents() {
  const submitButton = document.getElementById('submit');

  submitButton.addEventListener('click', event => {
    event.preventDefault();
    submitNewSearch();
  });
  
  sortSelect.addEventListener('change', () => {
    toggleLoading();
    resultsPage = 0;
    fetchArticles().then(() => {
      toggleLoading();
      displaySearchResults();
    });
  });

  filtersButton.addEventListener('click', event => {
    event.preventDefault();
    toggleFilterMenuVisibility();
  });

  previousPageButton.addEventListener('click', () => {
    toggleLoading();
    resultsPage--;
    fetchArticles().then(() => {
      toggleLoading();
      displaySearchResults();
    });
    scroll(0, 0);
  });

  nextPageButton.addEventListener('click', () => {
    toggleLoading();
    resultsPage++;
    fetchArticles().then(() => {
      toggleLoading();
      displaySearchResults();
    });
    scroll(0, 0);
  });
}

function configurePaginationButtons(pageArticles) {
  const numArticlesOnPage = pageArticles.length;
  
  if (numArticlesOnPage < 10) {
    nextPageButton.disabled = true;
    nextPageButton.classList.add('disabled');
  } else {
    nextPageButton.disabled = false;
    nextPageButton.classList.remove('disabled');
  }

  if (resultsPage === 0) {
    previousPageButton.disabled = true;
    previousPageButton.classList.add('disabled');
  } else {
    previousPageButton.disabled = false;
    previousPageButton.classList.remove('disabled');
  }
}

function displaySearchResults() {
  const searchResultsDiv = document.getElementById('search-results-container');
  const sortControls = document.getElementById('sort-by-container');

  searchResultsDiv.style.display = 'none';
  sortControls.style.display = 'none';

  while (articlesContainer.firstChild) {
    articlesContainer.removeChild(articlesContainer.firstChild);
  }

  const totalHits = articles.response.meta.hits; 
  displayTotalHits(totalHits);

  if (totalHits > 0) {
    const currentPageArticles = articles.response.docs;
    
    currentPageArticles.forEach(article => {
      const articleHTML = getArticleHTML(article);
      articlesContainer.appendChild(articleHTML);
    });

    sortControls.style.display = 'flex';
    searchResultsDiv.style.display = 'block';
    configurePaginationButtons(currentPageArticles);
  }
}

function displayTotalHits(totalHits) {
  const totalHitsPara = document.getElementById('total-hits-msg');
  totalHitsPara.textContent = `Your query returned ${totalHits} hits.`;
  totalHitsPara.style.display = 'block';
}

async function fetchArticles() {
  const baseURL = 'https://api.nytimes.com/svc/search/v2/articlesearch.json';
  const key = 'brtQ9fXA0I1ATPctklZe6RcanXZRklYl';
  let fullURL = `${baseURL}?api-key=${key}&page=${resultsPage}`;

  const query = queryInput.value.trim();

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

  let queryFilters = getFilterValuesForURL();

  if (queryFilters.length > 0) {
    queryFilters = queryFilters.join(' AND ');
    fullURL += `&fq=${queryFilters}`;
  }

  const response = await fetch(fullURL);
  articles = await response.json();
}

function getArticleHTML(article) {
  const articleTemplate = document.querySelector('template');
  const articleHTML = articleTemplate.content.cloneNode(true);

  const anchor = articleHTML.querySelector('a');
  anchor.href = article.web_url;

  const headline = articleHTML.querySelector('h2');
  headline.textContent = article.headline.main;

  const abstractPara = articleHTML.querySelector('.article-abstract');
  abstractPara.textContent = article.abstract;

  const articleImage = article.multimedia.find(image => image.subtype === 'blog225');
  const imgEl = articleHTML.querySelector('img');

  if (articleImage) {
    imgEl.src = `http://www.nytimes.com/${articleImage.url}`;
  } else {
    imgEl.style.display = 'none';
  }

  const keywordsPara = articleHTML.querySelector('.keywords');

  if (article.keywords.length > 0) {
    article.keywords.forEach(keyword => {
      const keywordLink = getKeywordLink(keyword);
      keywordsPara.appendChild(keywordLink);
    });
  } else {
    keywordsPara.style.display = 'none';
  }

  return articleHTML;
}

function getFilterValuesForURL() {
  let filterValues = [];

  const newsDeskFilters = document.getElementById('newsdesk-fieldset');
  const newsDeskValues = valuesFromFieldset(newsDeskFilters);

  if (newsDeskValues) {
    filterValues.push(`news_desk:(${newsDeskValues})`);
  }

  const materialTypeFilters = document.getElementById('material-types-fieldset');
  const materialTypeValues = valuesFromFieldset(materialTypeFilters);

  if (materialTypeValues) {
    filterValues.push(`type_of_material:(${materialTypeValues})`);
  }

  let location = document.getElementById('location-search').value.trim();

  if (location) {
    location = encodeURIComponent(`"${location}"`);
    filterValues.push(`glocations.contains:(${location})`);
  }

  return filterValues;
}

function getKeywordLink(keyword) {
  const keywordLink = document.createElement('a');
  keywordLink.setAttribute('class', 'keyword');
  keywordLink.setAttribute('tabindex', '0');
  keywordLink.textContent = keyword.value;

  keywordLink.addEventListener('click', event => {
    const searchForm = document.querySelector('form');
    searchForm.reset();

    if (filterMenu.style.display === 'grid') {
      toggleFilterMenuVisibility();
    }

    queryInput.value = event.target.textContent;
    submitNewSearch();
    scroll(0, 0);
  });

  return keywordLink;
}

function submitNewSearch() {
  toggleLoading();
  resultsPage = 0;
  sortSelect.value = 'relevance';
  fetchArticles().then(() => {
    toggleLoading();
    displaySearchResults();
  });
}

function toggleFilterMenuVisibility() {
  if (filterMenu.style.display === '') {
    filterMenu.style.display = 'grid';
    filtersButton.textContent = 'Hide filters';
  } else {
    filterMenu.style.display = '';
    filtersButton.textContent = 'Show filters';
  }
}

function toggleLoading() {
  const loadingMsg = document.getElementById('loading-msg');

  if (loadingMsg.dataset.visibility === 'hidden') {
    loadingMsg.style.visibility = 'visible';
    articlesContainer.style.opacity = 0.25;
    loadingMsg.dataset.visibility = 'visible';
  } else {
    loadingMsg.style.visibility = 'hidden';
    articlesContainer.style.opacity = 1;
    loadingMsg.dataset.visibility = 'hidden';
  }
}

function valuesFromFieldset(fieldset) {
  const elements = Array.from(fieldset.elements);
  const selectedElements = elements.filter(element => element.checked);

  if (selectedElements.length > 0) {
    let values = selectedElements.map(element => `"${element.value}"`).join(' ');
    return encodeURIComponent(values);
  }
}
