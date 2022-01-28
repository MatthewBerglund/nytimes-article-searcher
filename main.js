const sortControls = document.getElementById('sort-by-container');
const sortSelect = document.getElementById('sort-by-select');
const filterMenu = document.getElementById('filters-container');
const filtersButton = document.getElementById('filters-button');
const queryInput = document.getElementById('query-input');
const articlesContainer = document.getElementById('articles-container');
const paginationTrigger = document.getElementById('pagination-trigger');
const beginDate = document.getElementById('begin-date');
const endDate = document.getElementById('end-date');
const locationInput = document.getElementById('location-search');

let searchSettings = {};
let articles, resultsPage;

bindEvents();

if (window.location.search) {
  const url = new URL(window.location);
  searchSettings.query = url.searchParams.get('q');
  searchSettings.begin = url.searchParams.get('begin');
  searchSettings.end = url.searchParams.get('end');
  searchSettings.sortBy = url.searchParams.get('sort');
  searchSettings.glocation = url.searchParams.get('glocation');

  if (url.searchParams.has('desks')) {
    searchSettings.newsDesks = url.searchParams.get('desks').split(',');
  } else {
    searchSettings.newsDesks = [];
  }

  if (url.searchParams.has('types')) {
    searchSettings.materialTypes = url.searchParams.get('types').split(',');
  } else {
    searchSettings.materialTypes = [];
  }

  setFormControls();
  submitNewSearch();
}

function bindEvents() {
  const submitButton = document.getElementById('submit');

  submitButton.addEventListener('click', event => {
    event.preventDefault();
    sortSelect.value = 'relevance';
    searchSettings = getFormData();
    updateBrowserURL();
    submitNewSearch();
  });
  
  sortSelect.addEventListener('change', () => {
    searchSettings.sortBy = sortSelect.value;
    updateBrowserURL();
    submitNewSearch();
  });

  filtersButton.addEventListener('click', event => {
    event.preventDefault();
    toggleFilterMenuVisibility();
  });

  const viewPortObserver = new IntersectionObserver(handleIntersections, { threshold: 0.1 });
  viewPortObserver.observe(paginationTrigger); 
}

function displaySearchResults() {
  const totalHits = articles.response.meta.hits;
  const totalHitsPara = document.getElementById('total-hits-msg');
  totalHitsPara.textContent = `Your query returned ${totalHits} hits.`;
  totalHitsPara.style.display = 'block';

  if (totalHits > 0) {
    const currentPageArticles = articles.response.docs;
    
    currentPageArticles.forEach(article => {
      const articleHTML = getArticleHTML(article);
      articlesContainer.appendChild(articleHTML);
    });

    sortControls.style.display = 'flex';

    // API limits pagination to 1000 articles (100 pages)
    const totalScrollableHits = (totalHits > 1000) ? 1000 : totalHits;
    const totalScrollablePages = Math.floor(totalScrollableHits / 10);
    paginationTrigger.style.display = (resultsPage === totalScrollablePages) ? 'none' : 'flex';
  }
}

async function fetchArticles() {
  const baseURL = 'https://api.nytimes.com/svc/search/v2/articlesearch.json';
  const key = 'brtQ9fXA0I1ATPctklZe6RcanXZRklYl';
  let fullURL = `${baseURL}?api-key=${key}&page=${resultsPage}`;

  if (searchSettings.query) {
    fullURL += `&q=${searchSettings.query}`;
  }

  if (searchSettings.begin) {
    fullURL += `&begin_date=${searchSettings.begin}`;
  }

  if (searchSettings.end) {
    fullURL += `&end_date=${searchSettings.end}`;
  }

  if (searchSettings.sortBy) {
    fullURL += `&sort=${searchSettings.sortBy}`;
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

  if (article.abstract) {
    abstractPara.textContent = article.abstract;
    abstractPara.style.display = 'block';
  }
  
  const articleImage = article.multimedia.find(image => image.subtype === 'blog225');
  const imgEl = articleHTML.querySelector('img');

  if (articleImage) {
    imgEl.src = `http://www.nytimes.com/${articleImage.url}`;
    imgEl.style.display = 'block';
  }

  const keywordsPara = articleHTML.querySelector('.keywords');

  if (article.keywords.length > 0) {
    article.keywords.forEach(keyword => {
      const keywordLink = getKeywordLink(keyword);
      keywordsPara.appendChild(keywordLink);
    });

    keywordsPara.style.display = 'flex';
  }

  return articleHTML;
}

function getFormData() {
  const formData = {};
  formData.query = queryInput.value.trim();
  formData.begin = beginDate.value;
  formData.end = endDate.value;
  formData.sortBy = sortSelect.value;
  formData.glocation = locationInput.value.trim();

  const newsDeskFieldset = document.getElementById('newsdesk-fieldset');
  formData.newsDesks = valuesFromFieldset(newsDeskFieldset);

  const materialsFieldset = document.getElementById('material-types-fieldset');
  formData.materialTypes = valuesFromFieldset(materialsFieldset);
  
  return formData;
}

function getFilterValuesForURL() {
  let filterValues = [];
 
  if (searchSettings.newsDesks.length > 0) {
    let values = searchSettings.newsDesks.map(newsDesk => `"${newsDesk}"`);
    let componentString = encodeURIComponent(values.join(' '));
    filterValues.push(`news_desk:(${componentString})`)
  }

  if (searchSettings.materialTypes.length > 0) {
    let values = searchSettings.materialTypes.map(type => `"${type}"`);
    let componentString = encodeURIComponent(values.join(' '));
    filterValues.push(`type_of_material:(${componentString})`)
  }

  if (searchSettings.glocation) {
    let componentString = encodeURIComponent(`"${searchSettings.glocation}"`);
    filterValues.push(`glocations.contains:(${componentString})`);
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
    
    queryInput.value = event.target.textContent;
    sortSelect.value = 'relevance';
    searchSettings = getFormData();
    updateBrowserURL();

    if (filterMenu.style.display === 'grid') {
      toggleFilterMenuVisibility();
    }

    submitNewSearch();
    scroll(0, 0);
  });

  return keywordLink;
}

function handleIntersections(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      paginationTrigger.style.visibility = 'visible';
      resultsPage++;
      
      fetchArticles().then(() => {
        displaySearchResults();
        paginationTrigger.style.visibility = 'hidden';
      });
    }
  });
}

function setFormControls() {
  queryInput.value = searchSettings.query;
  beginDate.value = searchSettings.begin;
  endDate.value = searchSettings.end;
  locationInput.value = searchSettings.glocation;
  sortSelect.value = searchSettings.sortBy;

  searchSettings.newsDesks.forEach(newsDesk => {
    let checkbox = document.querySelector(`input[value="${newsDesk}"]`);
    checkbox.checked = true;
  });

  searchSettings.materialTypes.forEach(type => {
    let checkbox = document.querySelector(`input[value="${type}"]`);
    checkbox.checked = true;
  });
}

function submitNewSearch() {
  toggleLoading();
  resultsPage = 0;
  
  fetchArticles().then(() => {
    sortControls.style.display = 'none';
    paginationTrigger.style.display = 'none';

    while (articlesContainer.firstChild) {
      articlesContainer.removeChild(articlesContainer.firstChild);
    }

    displaySearchResults();
    toggleLoading();
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

function updateBrowserURL() {
  const url = new URL(window.location);

  if (searchSettings.query) {
    url.searchParams.set('q', searchSettings.query);
  } else {
    url.searchParams.delete('q');
  }

  if (searchSettings.begin) {
    url.searchParams.set('begin', searchSettings.begin);
  } else {
    url.searchParams.delete('begin');
  }

  if (searchSettings.end) {
    url.searchParams.set('end', searchSettings.end);
  } else {
    url.searchParams.delete('end');
  }

  if (searchSettings.sortBy) {
    url.searchParams.set('sort', searchSettings.sortBy);
  } else {
    url.searchParams.delete('sort');
  }

  const location = searchSettings.glocation;
  const newsDesks = searchSettings.newsDesks;
  const materialTypes = searchSettings.materialTypes;

  if (location) {
    url.searchParams.set('glocation', locationInput.value);
  } else {
    url.searchParams.delete('glocation');
  }
  
  if (newsDesks.length > 0) {
    let componentString = newsDesks.join(',');
    url.searchParams.set('desks', componentString);
  } else {
    url.searchParams.delete('desks');
  }

  if (materialTypes.length > 0) {
    let componentString = materialTypes.join(',');
    url.searchParams.set('types', componentString);
  } else {
    url.searchParams.delete('types');
  }

  // Set browser URL without refreshing page
  window.history.pushState({}, '', url);
}

function valuesFromFieldset(fieldset) {
  const elements = Array.from(fieldset.elements);
  const selectedElements = elements.filter(element => element.checked);
  const values = selectedElements.map(element => element.value);
  return values;
}