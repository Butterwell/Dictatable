chrome.runtime.onInstalled.addListener(async ({reason}) => {
  let tab = await chrome.tabs.create({
    url: "index.html",
    pinned: true
  });
});