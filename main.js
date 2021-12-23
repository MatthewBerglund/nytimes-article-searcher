const submitButton = document.getElementById('submit');
submitButton.addEventListener('click', handleSubmitSearchClick);

let resultsPage;

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
      console.log(articlesJson);
      displayArticles(articlesJson);
    });
}

function handleSubmitSearchClick(event) {
  event.preventDefault();
  resultsPage = 0;
  fetchArticles();
}