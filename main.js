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

let searchSettings, articles, resultsPage;

bindEvents();

if (window.location.search) {
  setFormControls();
  submitNewSearch();
}

function updateAppURL() {
  const url = new URL(window.location);
  url.searchParams.set('sort', sortSelect.value);

  if (queryInput.value) {
    url.searchParams.set('q', queryInput.value.trim());
  } else {
    url.searchParams.delete('q');
  }

  if (beginDate.value) {
    url.searchParams.set('begin_date', beginDate.value);
  } else {
    url.searchParams.delete('begin_date');
  }

  if (endDate.value) {
    url.searchParams.set('end_date', endDate.value);
  } else {
    url.searchParams.delete('end_date');
  }

  let queryFilters = getFilterValuesForURL();

  if (queryFilters.length > 0) {
    queryFilters = queryFilters.join(' AND ');
    url.searchParams.set('fq', queryFilters);
  } else {
    url.searchParams.delete('fq');
  }

  window.history.pushState({}, '', url);
}

function bindEvents() {
  const submitButton = document.getElementById('submit');

  submitButton.addEventListener('click', event => {
    event.preventDefault();
    sortSelect.value = 'relevance';
    updateAppURL();
    submitNewSearch();
  });
  
  sortSelect.addEventListener('change', () => {
    updateAppURL();
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
  const searchComponents = window.location.search;
  const fullURL = baseURL + searchComponents + `&api-key=${key}` + `&page=${resultsPage}`; 
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

function getFilterValuesForURL() {
  let filterValues = [];
  
  let location = locationInput.value.trim();

  if (location) {
    const firstLetter = location.slice(0, 1);
    location = location.replace(firstLetter, firstLetter.toUpperCase());
    let componentString = `"${location}"`;
    filterValues.push(`glocations.contains:(${componentString})`);
  }

  const newsDeskFieldset = document.getElementById('newsdesk-fieldset');
  const newsDesks = valuesFromFieldset(newsDeskFieldset);

  if (newsDesks.length > 0) {
    let values = newsDesks.map(newsDesk => `"${newsDesk}"`);
    let componentString = values.join(' ');
    filterValues.push(`news_desk:(${componentString})`)
  }

  const materialsFieldset = document.getElementById('material-types-fieldset');
  const materialTypes = valuesFromFieldset(materialsFieldset);

  if (materialTypes.length > 0) {
    let values = materialTypes.map(type => `"${type}"`);
    let componentString = values.join(' ');
    filterValues.push(`type_of_material:(${componentString})`)
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

    if (filterMenu.style.display === 'grid') {
      toggleFilterMenuVisibility();
    }

    updateAppURL();
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

function setFormControls () {
  const url = new URL(window.location);
  
  queryInput.value = url.searchParams.get('q');
  beginDate.value = url.searchParams.get('begin_date');
  endDate.value = url.searchParams.get('end_date');
  sortSelect.value = url.searchParams.get('sort');
  
  const queryFilters = url.searchParams.get('fq');
  
  if (queryFilters) {
    queryFilters = queryFilters.split(' AND ');
    const glocations = queryFilters.find(component => component.includes('glocations'));
    const newsDesks = queryFilters.find(component => component.includes('news_desk'));
    const materialTypes = queryFilters.find(component => component.includes('type_of_material'));

    if (glocations) {
      const glocationValues = glocations.match(/([A-Z])\w+/g);
      locationInput.value = glocationValues[0];
    }

    if (newsDesks) {
      const newsDeskValues = newsDesks.match(/([A-Z])\w+/g);
      newsDeskValues.forEach(newsDesk => {
        let checkbox = document.querySelector(`input[value="${newsDesk}"]`);
        checkbox.checked = true;
      });
    }

    if (materialTypes) {
      const materialTypeValues = materialTypes.match(/([A-Z])\w+/g);
      materialTypeValues.forEach(type => {
        let checkbox = document.querySelector(`input[value="${type}"]`);
        checkbox.checked = true;
      });
    }
  }
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

function valuesFromFieldset(fieldset) {
  const elements = Array.from(fieldset.elements);
  const selectedElements = elements.filter(element => element.checked);
  const values = selectedElements.map(element => element.value);
  return values;
}
