// chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
//   var url = tabs[0].url;
//   console.log(url);
// });

// chrome.tabs.query(
//   { active: true, windowId: chrome.windows.WINDOW_ID_CURRENT },
//   function(tabs) {
//     const url = tabs[0].url;
//     console.log(url);
//   }
// );

chrome.tabs.getSelected(null, function(tab) {
  const tabUrl = tab.url;

  console.log(tabUrl);
});

chrome.tabs.query(
  { currentWindow: true, active: true, lastFocusedWindow: true },
  function(tabs) {
    var activeTab = tabs[0].url;
    var title = activeTab.title;
    console.log(activeTab);
  }
);
