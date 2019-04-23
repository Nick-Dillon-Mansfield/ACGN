
// GLOBAL VARIABLES
const BASE_URL = "http://localhost:8000/api/";
const tabInfo = {};
let transcript;
let confidence;
let words;

// Obtains url and video ID
function getUrl() {
  chrome.tabs.query({ active: true }, function(tabs) {
    // Take tab ID and Url from tab object
    tabInfo.id = tabs[0].id;
    tabInfo.url = tabs[0].url;

    // Take query key value pairs from url
    const ytparams = tabInfo.url
      .split("?")[1]
      .split("&")
      .reduce((acc, val) => {
        let [k, v] = val.split("=");
        acc[k] = v;
        return acc;
      }, {});

    // Create new request
    const req = new XMLHttpRequest();
    req.open("GET", `${BASE_URL}yturl/${ytparams.v}`, false);
    req.send();

    // Access response data
    const res = JSON.parse(req.response)
    transcript = res.transcript;
    confidence = res.confidence;
    words = res.words;
  });
}

// Removes generate script button on click
document.getElementById("genScriptButton").addEventListener("click", function() {
  getUrl();
  const body = document.getElementById("body");
  const genScriptButtonDiv = document.getElementById("genScriptButtonDiv");
  body.removeChild(genScriptButtonDiv);
});

document
  .getElementById("submitKeywordButton")
  .addEventListener("click", function() {
    const listCount = document.getElementById("listCount");
    const list = document.getElementById("list");

    if (list.childNodes.length > 0) {
      list.removeChild(list.lastElementChild);
    }

    // Defining keyword and instances of keyword
    const keyword = document.getElementById("keyword").value;
    const keywordInstances = filterKeyword(keyword);
    filterSentences(keyword, keywordInstances);

    // Displays count of keyword
    if (keywordInstances.length === 0) {
      listCount.innerText = `I cannot find "${keyword}" in the video.`;
    } else {
      const listArea = document.getElementById("list");
      if (listArea.childNodes.length > 1) {
        listArea.removeChild(listArea.lastElementChild);
      }
      listCount.innerText = `I have found "${keyword}" ${
        keywordInstances.length
      } time(s)`;

      console.log(keywordInstances)
      // Creates list of clickable keyword instances
      let newList = document.createElement("ol");
      for (let i = 0; i < keywordInstances.length; i++) {
        let listItem = document.createElement("li");
        let youtubeLink = document.createElement("a");
        youtubeLink.addEventListener("click", function() {
          var myNewUrl = `${tabInfo.url}&t=${keywordInstances[i].time}`;
          chrome.tabs.update(tabInfo.id, { url: myNewUrl });
        });
        listItem.appendChild(youtubeLink);
        youtubeLink.appendChild(
          document.createTextNode(keywordInstances[i].displayData)
        );
        listItem.appendChild(
          document.createTextNode(` "${keywordInstances[i].sentence}"`)
        );
        newList.appendChild(listItem);
      }
      listArea.appendChild(newList);
    }
    document.getElementById("keyword").value = "";
  });

const filterKeyword = keyword => {
  // Find keyword instances
  const keywordInstances = words.filter(
    word => word.word.toLowerCase() === keyword.toLowerCase()
  );
  for (let i = 0; i < keywordInstances.length; i++) {
    // Find the hour, minute and second elements of the keyword instance time
    let hours = Math.floor(keywordInstances[i].time / 3600);
    let minutes = Math.floor((keywordInstances[i].time % 3600) / 60);
    minutes = `${minutes}`.length === 2 ? `${minutes}` : `0${minutes}`
    let seconds = keywordInstances[i].time % 60;
    seconds = `${seconds}`.length === 2 ? `${seconds}` : `0${seconds}`

    // Create the display for the keyword instance time
    keywordInstances[i].displayData = `${hours}:${minutes}:${seconds}`
  }
  return keywordInstances;
};

const filterSentences = (keyword, keywordInstances) => {
  // Split transcript into array
  const wordsArr = transcript.split(' ');
  if (wordsArr.length < 5) return transcript;
  let i = 0;
  // Create surrounding sentence for each keyword instance
  wordsArr.forEach((word, index) => {
    if (word === keyword) {
      let sentence = wordsArr.slice(Math.max(index - 2, 0), Math.min(index + 3, wordsArr.length));
      keywordInstances[i].sentence = `...${sentence.join(' ')}...`;
    }
  })
}

const scriptButton = document.getElementById("scriptButton");
const scriptArea = document.getElementById("scriptArea");
scriptButton.addEventListener("click", function() {
  // Toggle button text
  scriptButton.innerText === "Show Script"
    ? (scriptButton.innerText = "Hide Script")
    : scriptButton.innerText === "Hide Script"
    ? (scriptButton.innerText = "Show Script")
    : null;

    // Display script depending on toggle
  if (scriptButton.innerText === "Hide Script") {
    let fullScript = document.createElement("p");
    fullScript.appendChild(document.createTextNode(transcript));
    let copyButton = document.createElement("button");
    copyButton.innerText = "Copy Script";
    copyButton.addEventListener("click", function() {
      let tempScriptTag = document.createElement("input");
      document.body.appendChild(tempScriptTag);
      tempScriptTag.setAttribute("value", transcript);
      tempScriptTag.select();
      document.execCommand("copy");
      document.body.removeChild(tempScriptTag);
    });
    // Adding script and copy button
    scriptArea.appendChild(fullScript);
    scriptArea.appendChild(copyButton);
  } else {
    // Removing script and copy button
    while (scriptArea.childNodes.length > 0) {
      scriptArea.removeChild(scriptArea.lastElementChild);
    }
  }
});