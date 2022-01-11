let articles;
let resultsPage;

const sortSelect = document.getElementById('sort-by-select');
const submitButton = document.getElementById('submit');
const filtersButton = document.getElementById('filters-button');
const previousPageButton = document.getElementById('previous-page-button');
const nextPageButton = document.getElementById('next-page-button');
const articlesContainer = document.getElementById('articles-container');

bindEvents();

function bindEvents() {
	sortSelect.addEventListener('change', () => {
    toggleLoading();
		resultsPage = 0;
		fetchArticles().then(() => {
      toggleLoading();
			displaySearchResults();
		});
	});

	submitButton.addEventListener('click', event => {
		event.preventDefault();
    toggleLoading();
		resultsPage = 0;
		sortSelect.value = 'relevance';
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

function displaySearchResults() {
	const searchResultsDiv = document.getElementById('search-results-container');
  const sortControls = document.getElementById('sort-by-container');
	
	searchResultsDiv.style.display = 'none';
  sortControls.style.display = 'none';
  
  while (articlesContainer.firstChild) {
    articlesContainer.removeChild(articlesContainer.firstChild);
  }
	
  const totalHits = articles.response.meta.hits;
  const totalHitsPara = document.getElementById('total-hits-msg');
  totalHitsPara.textContent = `Your query returned ${totalHits} hits.`;
  totalHitsPara.style.display = 'block';

  if (totalHits > 0) {
    const currentPageArticles = articles.response.docs;

    currentPageArticles.forEach(article => {
      const articleContainer = document.createElement('article');

      const anchor = document.createElement('a');
      anchor.href = article.web_url;
      anchor.target = '_blank';
      anchor.setAttribute('class', 'headline-link');
      articleContainer.appendChild(anchor);

      const headline = document.createElement('h2');
      headline.textContent = article.headline.main;
      anchor.appendChild(headline);

      const abstractPara = document.createElement('p');
      abstractPara.textContent = article.abstract;
      abstractPara.setAttribute('class', 'article-abstract');
      articleContainer.appendChild(abstractPara);

      const articleImage = article.multimedia.find(image => image.subtype === 'blog225');
      if (articleImage) {
        const imgEl = document.createElement('img');
        imgEl.src = `http://www.nytimes.com/${articleImage.url}`;
        imgEl.setAttribute('class', 'article-img');
        articleContainer.appendChild(imgEl);
      }

      const keywordsPara = document.createElement('p');
      keywordsPara.setAttribute('class', 'keywords');
      keywordsPara.textContent = 'Keywords: ';
      articleContainer.appendChild(keywordsPara);

      article.keywords.forEach(keyword => {
        const keywordSpan = document.createElement('span');
        keywordSpan.setAttribute('class', 'keyword');
        keywordSpan.textContent = keyword.value;
        keywordsPara.appendChild(keywordSpan);
      });

      articlesContainer.appendChild(articleContainer);
    });
		
    if (resultsPage === 0) {
      previousPageButton.disabled = true;
      previousPageButton.classList.add('disabled');
    } else {
      previousPageButton.disabled = false;
      previousPageButton.classList.remove('disabled');
    }
      
    if (currentPageArticles.length < 10) {
      nextPageButton.disabled = true;
      nextPageButton.classList.add('disabled');
    } else {
      nextPageButton.disabled = false;
      nextPageButton.classList.remove('disabled');
    }

		searchResultsDiv.style.display = 'block';
    sortControls.style.display = 'flex';
  }
}

async function fetchArticles() {
  const baseURL = 'https://api.nytimes.com/svc/search/v2/articlesearch.json';
  const key = 'brtQ9fXA0I1ATPctklZe6RcanXZRklYl';
  let fullURL = `${baseURL}?api-key=${key}&page=${resultsPage}`;
  
  const query = document.getElementById('query-input').value.trim();
  
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
	
  const queryFilters = getFilterValuesForURL();
  
  if (queryFilters.length > 0) {
    fullURL += '&fq=';
    
    for (let i = 0; i < queryFilters.length; i++) {
      const currentFilter = queryFilters[i];
      
      if (i === 0) {
        fullURL += currentFilter;
      } else {
        fullURL += ` AND ${currentFilter}`;
      }
    }
  }

  const response = await fetch(fullURL);
  articles = await response.json();
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

function toggleFilterMenuVisibility() {
  const filtersDiv = document.getElementById('filters-container');
  
  if (filtersDiv.style.display === '') {
    filtersDiv.style.display = 'grid';
    filtersButton.textContent = 'Hide filters';
  } else {
    filtersDiv.style.display = '';
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
    let values = '';
    
    for (let i = 0; i < selectedElements.length; i++) {
      let currentValue = selectedElements[i].value;
      
      if (i === 0) {
        values += `"${currentValue}"`;
      } else {
        values += ` "${currentValue}"`;
      }
    }

    return encodeURIComponent(values);
  }
}
