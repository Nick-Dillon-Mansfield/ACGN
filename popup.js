const clg = chrome.extension.getBackgroundPage();

function submitKeyWords() {
  let keyword = document.getElementById("keyword").value;
  clg.console.log(keyword);
}

document
  .getElementById("submitButtonSearch")
  .addEventListener("click", function() {
    document.getElementById("test").innerHTML = "Loading...";
    submitKeyWords();
  });
