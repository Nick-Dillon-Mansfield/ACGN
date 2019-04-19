const BASE_URL = 'http://localhost:8000/api/';

function getUrl() {
  chrome.tabs.query({ active: true }, function(tabs) {
    console.log(tabs);
    const url = tabs[0].url;
    console.log(url)
    const ytparams = url
      .split('?')[1]
      .split('&')
      .reduce((acc, val) => {
        let [k, v] = val.split('=');
        acc[k] = v;
        return acc;
      }, {});
    console.log(ytparams);
    const req = new XMLHttpRequest();
    req.open("GET", `${BASE_URL}yturl/${ytparams.v}`, false);
    req.send();
  });
};

function submitKeyWords() {
  let keyword = document.getElementById("keyword").value;
  console.log(keyword)
  const req = new XMLHttpRequest();
  req.open("GET", `${BASE_URL}keyword/${keyword}`, false)
  req.send();
};

document
  .getElementById("buttonUrl")
  .addEventListener("click", function() {
    getUrl();
  });

document
  .getElementById("submitButtonKeyWord")
  .addEventListener("click", function() {
    document.getElementById("test").innerHTML = "Loading...";
    submitKeyWords();
  });

  