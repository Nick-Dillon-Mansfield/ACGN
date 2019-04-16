import {postUrl, postKeyWords} from "./axios";

function getUrl() {
  chrome.tabs.query({ active: true }, function(tabs) {
    console.log(tabs);
    const url = tabs[0].url;
    console.log(url);
    postUrl(url).then(res => console.log(res));
  });
};

function submitKeyWords() {
  let keyword = document.getElementById("keyword").value;
  console.log(keyword);
  postKeyWords(keyword).then(console.log);
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

  