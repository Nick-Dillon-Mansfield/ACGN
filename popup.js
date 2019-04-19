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

document.getElementById("buttonUrl").addEventListener("click", function() {
  getUrl();
});

document
  .getElementById("submitButtonKeyWord")
  .addEventListener("click", function() {
    const listCount = document.getElementById("listCount")
    const list = document.getElementById("list")
    console.log(list.childNodes.length);
    if (list.childNodes.length > 1) {
      console.log("SIMON DETECTS LIST!")
      console.log(list);
      list.removeChild(list.lastElementChild)
      console.log(list);
    }
    const keyword = document.getElementById("keyword").value
    const matchingWords = filterKeyword(fakeScript, keyword)
    if (matchingWords.length === 0) {
      listCount.innerText = `I cannot find "${keyword}" in the video, sorry :O`
    } else {
      listCount.innerText = `I have found "${keyword}" ${matchingWords.length} time(s)`;
      const listArea = document.getElementById("list")
      let newList = document.createElement('ol');
      for (let i = 0; i < matchingWords.length; i++) {
        let listItem = document.createElement('li')
        listItem.appendChild(document.createTextNode(matchingWords[i].end_time));
        newList.appendChild(listItem);
      }
      listArea.appendChild(newList);
    }
    document.getElementById("keyword").value = "";
  });

const filterKeyword = (script, keyword) => {
  console.log("the keyword is" + keyword);

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

/*
1. keyword must be known
2. we must have the script
3. search through the script with the keyword to find all instances of it, with their times
4. forEach instance, generate new list item, with the item being an <a> tag (to link to the timestamp)
*/

const fakeScript = {
  "transcript": "Hello this will be our test script It repeats some of our words like script and test and script and test",
  "confidence": "0.99",
  "words": [
    { "start_time": "0", "end_time": "1", "word": "Hello" },
    { "start_time": "1", "end_time": "2", "word": "this" },
    { "start_time": "2", "end_time": "3", "word": "will" },
    { "start_time": "3", "end_time": "4", "word": "be" },
    { "start_time": "4", "end_time": "5", "word": "our" },
    { "start_time": "5", "end_time": "6", "word": "test" },
    { "start_time": "6", "end_time": "7", "word": "script" },
    { "start_time": "7", "end_time": "8", "word": "It" },
    { "start_time": "8", "end_time": "9", "word": "repeats" },
    { "start_time": "9", "end_time": "10", "word": "some" },
    { "start_time": "10", "end_time": "11", "word": "of" },
    { "start_time": "11", "end_time": "12", "word": "our" },
    { "start_time": "12", "end_time": "13", "word": "words" },
    { "start_time": "13", "end_time": "14", "word": "like" },
    {
      "start_time": "14",
      "end_time": "15",
      "word": "script"
    },
    { "start_time": "15", "end_time": "16", "word": "and" },
    { "start_time": "16", "end_time": "17", "word": "test" },
    { "start_time": "17", "end_time": "18", "word": "and" },
    {
      "start_time": "18",
      "end_time": "19",
      "word": "script"
    },
    { "start_time": "19", "end_time": "20", "word": "and" },
    { "start_time": "20", "end_time": "21", "word": "Test" }
  ]
 }