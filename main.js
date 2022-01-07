let articles;
let resultsPage;

const sortSelect = document.getElementById('sort-by-select');
const submitButton = document.getElementById('submit');
const filtersButton = document.getElementById('filters-button');
const previousPageButton = document.getElementById('previous-page-button');
const nextPageButton = document.getElementById('next-page-button');

bindEvents();

function bindEvents() {
	sortSelect.addEventListener('change', () => {
		resultsPage = 0;
		fetchArticles().then(() => {
			displaySearchResults();
		});
	});

	submitButton.addEventListener('click', event => {
		event.preventDefault();
		resultsPage = 0;
		sortSelect.value = 'relevance';
		fetchArticles().then(() => {
			displaySearchResults();
		});
	});
	
	filtersButton.addEventListener('click', event => {
		event.preventDefault();
		toggleFilterMenuVisibility();
	});

	previousPageButton.addEventListener('click', () => {
		resultsPage--;
		fetchArticles().then(() => {
			displaySearchResults();
		});
		scroll(0, 0);
	});

	nextPageButton.addEventListener('click', () => {
		resultsPage++;
		fetchArticles().then(() => {
			displaySearchResults();
		});
		scroll(0, 0);
	});
}

function displaySearchResults() {
	const searchResultsDiv = document.getElementById('search-results-container');
  const articlesDiv = document.getElementById('articles-container');
	
	searchResultsDiv.style.display = '';
  
  while (articlesDiv.firstChild) {
    articlesDiv.removeChild(articlesDiv.firstChild);
  }
	
  const totalHits = articles.response.meta.hits;
  const totalHitsPara = document.getElementById('total-hits-msg');
  totalHitsPara.textContent = `Your query returned ${totalHits} hits.`;
  totalHitsPara.style.display = 'block';

  if (totalHits > 0) {
    const currentPageArticles = articles.response.docs;

    currentPageArticles.forEach(article => {
      const articleDiv = document.createElement('div');
      articleDiv.setAttribute('class', 'article-container');

      const anchor = document.createElement('a');
      anchor.href = article.web_url;
      anchor.target = '_blank';
      anchor.setAttribute('class', 'headline-link');
      articleDiv.appendChild(anchor);

      const headline = document.createElement('h2');
      headline.textContent = article.headline.main;
      anchor.appendChild(headline);

      const abstractPara = document.createElement('p');
      abstractPara.textContent = article.abstract;
      abstractPara.setAttribute('class', 'article-abstract');
      articleDiv.appendChild(abstractPara);

      const articleImage = article.multimedia.find(image => image.subtype === 'blog225');
      if (articleImage) {
        const imgEl = document.createElement('img');
        imgEl.src = `http://www.nytimes.com/${articleImage.url}`;
        imgEl.setAttribute('class', 'article-img');
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

      articlesDiv.appendChild(articleDiv);
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
  }
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

  const location = document.getElementById('location-search').value;
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
