const BASE_URL = "http://localhost:8000/api/";

const youtubeURL = [];

function getUrl() {
  chrome.tabs.query({ active: true }, function(tabs) {
    console.log(tabs[0]);
    const url = tabs[0].url;
    youtubeURL.push(tabs[0].id, url);
    console.log(youtubeURL);
    const ytparams = url
      .split("?")[1]
      .split("&")
      .reduce((acc, val) => {
        let [k, v] = val.split("=");
        acc[k] = v;
        return acc;
      }, {});
    console.log(ytparams);
    const req = new XMLHttpRequest();
    req.open("GET", `${BASE_URL}yturl/${ytparams.v}`, false);
    req.send();
  });
}

function submitKeyWords() {
  let keyword = document.getElementById("keyword").value;
  console.log(keyword);
  const req = new XMLHttpRequest();
  req.open("GET", `${BASE_URL}keyword/${keyword}`, false);
  req.send();
}

document.getElementById("buttonUrl").addEventListener("click", function() {
  getUrl();
});

document
  .getElementById("submitButtonKeyWord")
  .addEventListener("click", function() {
    document.getElementById("test").innerHTML = "Loading...";
    submitKeyWords();
  });

const filterKeyword = (script, keyword) => {
  const filtered = script.words.filter(
    word => word.word.toLowerCase() === keyword.toLowerCase()
  );

  return filtered;
};

document
  .getElementById("testLink")
  .addEventListener("click", function() {
    chrome.tabs.update(youtubeURL[0], {url: youtubeURL[1]+"&t=60"})
  })

script = {
  transcript: str,
  confidence: int,
  words: [
    { start_time: {}, end_time: {}, word: str },
    { start_time: {}, end_time: {}, word: str }
  ]
};

module.exports = { timeConvert };
