chrome.runtime.onInstalled.addListener(({reason}) => {
  chrome.tabs.create({
    url: "index.html",
    pinned: true
  });
});