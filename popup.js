const BASE_URL = "http://localhost:8000/api/";

const youtubeURL = [];
let transcript;
let confidence;
let words;
let id;
function getUrl() {
  chrome.tabs.query({ active: true }, function(tabs) {
    id = tabs.id;
    const url = tabs[0].url;
    youtubeURL.push(tabs[0].id, url);
    console.log(tabs[0]);

    const ytparams = url
      .split("?")[1]
      .split("&")
      .reduce((acc, val) => {
        let [k, v] = val.split("=");
        acc[k] = v;
        return acc;
      }, {});

    const req = new XMLHttpRequest();
    req.open("GET", `${BASE_URL}yturl/${ytparams.v}`, false);
    req.send();
    const response = JSON.parse(req.response);
    transcript = response.transcript;
    confidence = response.confidence;
    words = response.words;
  });
}

document.getElementById("buttonUrl").addEventListener("click", function() {
  getUrl();
  const body = document.getElementById("body");
  const genScriptButtonDiv = document.getElementById("genScriptButtonDiv");
  body.removeChild(genScriptButtonDiv);
});

document
  .getElementById("submitButtonKeyWord")
  .addEventListener("click", function() {
    const listCount = document.getElementById("listCount");
    const list = document.getElementById("list");

    if (list.childNodes.length > 0) {
      list.removeChild(list.lastElementChild);
    }
    const keyword = document.getElementById("keyword").value;
    const matchingWords = filterKeyword(keyword);
    const surroundingWords = filterSurroundings(keyword);

    if (matchingWords.length === 0) {
      listCount.innerText = `I cannot find "${keyword}" in the video, sorry :O`;
    } else {
      const listArea = document.getElementById("list");
      if (listArea.childNodes.length > 1) {
        listArea.removeChild(listArea.lastElementChild);
      }
      listCount.innerText = `I have found "${keyword}" ${
        matchingWords.length
      } time(s)`;
      let newList = document.createElement("ol");
      for (let i = 0; i < matchingWords.length; i++) {
        let listItem = document.createElement("li");

        let youtubeLink = document.createElement("a");

        youtubeLink.addEventListener("click", function() {
          var myNewUrl = `${youtubeURL[1]}&t=${matchingWords[i].time}`;
          chrome.tabs.update(id, { url: myNewUrl });
        });
        listItem.appendChild(youtubeLink);

        youtubeLink.appendChild(
          document.createTextNode(matchingWords[i].displayData)
        );
        listItem.appendChild(
          document.createTextNode(` "${surroundingWords[i]}"`)
        );
        newList.appendChild(listItem);
      }
      listArea.appendChild(newList);
    }
    document.getElementById("keyword").value = "";
  });

const filterKeyword = keyword => {
  const filtered = words.filter(
    word => word.word.toLowerCase() === keyword.toLowerCase()
  );
  for (let i = 0; i < filtered.length; i++) {
    let minuets = Math.floor(filtered[i].time / 60);
    let seconds = filtered[i].time - minuets * 60;

    if (minuets.toString().length === 1 && seconds.toString().length === 1) {
      filtered[i].displayData = `0${minuets}:0${seconds}`;
    } else if (minuets.toString().length === 1) {
      filtered[i].displayData = `0${minuets}:${seconds}`;
    } else {
      filtered[i].displayData = `${minuets}:${seconds}`;
    }
  }
  return filtered;
};

const filterSurroundings = keyword => {
  const words = [];
  const splitTranscript = transcript.split(" ");
  let sentence;
  for (let i = 0; i < splitTranscript.length; i++) {
    if (splitTranscript[i].toLowerCase() === keyword.toLowerCase()) {
      if ([i] == 0) {
        sentence = `${splitTranscript[i]} ${splitTranscript[i + 1]} ${
          splitTranscript[i + 2]
        } ${splitTranscript[i + 3]} ${splitTranscript[i + 4]}`;
        words.push(sentence);
      } else if ([i] == 1) {
        sentence = `${splitTranscript[i - 1]} ${splitTranscript[i]} ${
          splitTranscript[i + 1]
        } ${splitTranscript[i + 2]} ${splitTranscript[i + 3]}`;
        words.push(sentence);
      } else if ([i] == splitTranscript.length - 1) {
        sentence = `${splitTranscript[splitTranscript.length - 1]} ${
          splitTranscript[splitTranscript.length - 2]
        } ${splitTranscript[splitTranscript.length - 3]} ${
          splitTranscript[splitTranscript.length - 4]
        } ${splitTranscript[splitTranscript.length - 5]}`;
        words.push(sentence);
      } else {
        sentence = `${splitTranscript[i - 2]} ${splitTranscript[i - 1]} ${
          splitTranscript[i]
        } ${splitTranscript[i + 1]} ${splitTranscript[i + 2]}`;
        words.push(sentence);
      }
    }
  }

  return words;
};

const scriptButton = document.getElementById("scriptButton");
const scriptArea = document.getElementById("scriptArea");
scriptButton.addEventListener("click", function() {
  scriptButton.innerText === "Show Script"
    ? (scriptButton.innerText = "Hide Script")
    : scriptButton.innerText === "Hide Script"
    ? (scriptButton.innerText = "Show Script")
    : null;
  if (scriptButton.innerText === "Hide Script") {
    let fullScript = document.createElement("p");
    fullScript.appendChild(document.createTextNode(transcript));
    let copyButton = document.createElement("button");
    copyButton.innerText = "Copy Script";
    copyButton.setAttribute("id", "copyButton");
    copyButton.addEventListener("click", function() {
      let tempScriptTag = document.createElement("input");
      document.body.appendChild(tempScriptTag);
      tempScriptTag.setAttribute("value", transcript);
      tempScriptTag.select();
      document.execCommand("copy");
      prompt("Script copied to clipboard!");
      document.body.removeChild(tempScriptTag);
    });

    scriptArea.appendChild(fullScript);
    scriptArea.appendChild(copyButton);
  } else {
    while (scriptArea.childNodes.length > 0) {
      scriptArea.removeChild(scriptArea.lastElementChild);
    }
  }
});
