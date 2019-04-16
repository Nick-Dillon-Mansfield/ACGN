import { postUrl } from "./axios";

function submitKeyWords() {
  let keyword = document.getElementById("keyword").value;
  console.log(keyword);
}

document
  .getElementById("submitButtonSearch")
  .addEventListener("click", function() {
    document.getElementById("test").innerHTML = "Loading...";
    submitKeyWords();
    getUrl();
  });

function getUrl() {
  chrome.tabs.query({ active: true }, function(tabs) {
    console.log(tabs);
    const url = tabs[0].url;
    console.log(url);
    postUrl(url).then(res => console.log(res));
  });
}
