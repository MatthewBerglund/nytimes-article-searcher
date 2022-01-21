let articles;
let resultsPage;

const sortControls = document.getElementById('sort-by-container');
const sortSelect = document.getElementById('sort-by-select');
const filterMenu = document.getElementById('filters-container');
const filtersButton = document.getElementById('filters-button');
const queryInput = document.getElementById('query-input');
const articlesContainer = document.getElementById('articles-container');
const pageBottom = document.getElementById('page-bottom');

bindEvents();

function bindEvents() {
  const submitButton = document.getElementById('submit');

  submitButton.addEventListener('click', event => {
    event.preventDefault();
    sortSelect.value = 'relevance';
    submitNewSearch();
  });
  
  sortSelect.addEventListener('change', () => {
    toggleLoading();
    fetchArticles().then(() => {
      submitNewSearch();
      toggleLoading();
    });
  });

  filtersButton.addEventListener('click', event => {
    event.preventDefault();
    toggleFilterMenuVisibility();
  });

  const viewPortObserver = new IntersectionObserver(handleIntersections, { threshold: 0.5 });
  viewPortObserver.observe(pageBottom); 
}

function displaySearchResults() {
  const totalHits = articles.response.meta.hits; 
  displayTotalHits(totalHits);

  if (totalHits > 0) {
    // API limits pagination to 1000 articles (100 pages)
    const totalScrollableHits = totalHits > 1000 ? 1000 : totalHits;
    const totalScrollablePages = Math.floor(totalScrollableHits / 10);
    const currentPageArticles = articles.response.docs;
    
    currentPageArticles.forEach(article => {
      const articleHTML = getArticleHTML(article);
      articlesContainer.appendChild(articleHTML);
    });

    if (resultsPage === totalScrollablePages) {
      pageBottom.style.display = 'none';
    } else {
      pageBottom.style.display = 'flex';
    }
    
    sortControls.style.display = 'flex';
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
    sortSelect.value = 'relevance';
    submitNewSearch();
    scroll(0, 0);
  });

  return keywordLink;
}

function handleIntersections(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      pageBottom.style.visibility = 'visible';
      resultsPage++;
      
      fetchArticles().then(() => {
        displaySearchResults();
        pageBottom.style.visibility = 'hidden';
      });
    }
  });
}

function submitNewSearch() {
  toggleLoading();
  resultsPage = 0;
  
  fetchArticles().then(() => {
    sortControls.style.display = 'none';
    pageBottom.style.display = 'none';

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

  if (selectedElements.length > 0) {
    let values = selectedElements.map(element => `"${element.value}"`).join(' ');
    return encodeURIComponent(values);
  }
}
