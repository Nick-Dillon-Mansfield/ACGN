const BASE_URL = "http://localhost:8000/api/";

const youtubeURL = [];
let transcript;
let confidence;
let words;
function getUrl() {
  // chrome.tabs.query({ active: true }, function(tabs) {
  //   const url = tabs[0].url;
  //   youtubeURL.push(tabs[0].id, url);

  //   const ytparams = url
  //     .split("?")[1]
  //     .split("&")
  //     .reduce((acc, val) => {
  //       let [k, v] = val.split("=");
  //       acc[k] = v;
  //       return acc;
  //     }, {});

  //   const req = new XMLHttpRequest();
  //   req.open("GET", `${BASE_URL}yturl/${ytparams.v}`, false);
  //   req.send();

  //   transcript = response.transcript;
  //   confidence = response.confidence;
  //   words = response.words;
  // });
  transcript = fakeScript.transcript;
  confidence = fakeScript.confidence;
  words = fakeScript.words;
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

    if (list.childNodes.length > 1) {
      list.removeChild(list.lastElementChild);
    }
    const keyword = document.getElementById("keyword").value;
    const matchingWords = filterKeyword(keyword);
    const surroundingWords = filterSurroundings(keyword);

    if (matchingWords.length === 0) {
      listCount.innerText = `I cannot find "${keyword}" in the video, sorry :O`;
    } else {
      listCount.innerText = `I have found "${keyword}" ${
        matchingWords.length
      } time(s)`;
      const listArea = document.getElementById("list");
      let newList = document.createElement("ol");
      for (let i = 0; i < matchingWords.length; i++) {
        let listItem = document.createElement("li");
        listItem.appendChild(document.createTextNode(matchingWords[i].time));
        // for (let j = 0; j < surroundingWords.length; j++) {
        listItem.appendChild(document.createTextNode(surroundingWords[i]));
        // }

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
    scriptArea.appendChild(fullScript);
  } else {
    scriptArea.removeChild(scriptArea.lastElementChild);
  }
});

const fakeScript = {
  transcript:
    "Hello this will be our test script It repeats some of our words like script and test and script and test",
  confidence: "0.99",
  words: [
    { time: "1", word: "Hello" },
    { time: "2", word: "this" },
    { time: "3", word: "will" },
    { time: "4", word: "be" },
    { time: "5", word: "our" },
    { time: "6", word: "test" },
    { time: "7", word: "script" },
    { time: "8", word: "It" },
    { time: "9", word: "repeats" },
    { time: "10", word: "some" },
    { time: "11", word: "of" },
    { time: "12", word: "our" },
    { time: "13", word: "words" },
    { time: "14", word: "like" },
    {
      time: "15",
      word: "script"
    },
    { time: "16", word: "and" },
    { time: "17", word: "test" },
    { time: "18", word: "and" },
    {
      end_time: "19",
      word: "script"
    },
    { time: "20", word: "and" },
    { time: "21", word: "Test" }
  ]
};
