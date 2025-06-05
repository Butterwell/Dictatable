

function onCreated(tab) {
  console.log(`Created new tab: ${tab.id}`);
  // Inject the content script
  chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['injected_content_scraper.js']
  })
  .then(() => {
      // Once injected, send a message to the content script to perform the scrape
      return chrome.tabs.sendMessage(tab.id, { action: "performScrape" });
  })
  .then(scrapedData => {
    console.log(scrapedData)
      // // Receive data from the content script and send it back to the popup
      // if (scrapedData && scrapedData.success) {
      //     sendResponse({ success: true, data: scrapedData.data });
      // } else {
      //     sendResponse({ success: false, error: scrapedData.error || 'Content script failed to scrape.' });
      // }
    //chrome.tabs.remove(tab.id)
  })
  .catch(error => {
    console.error("Error in background script during scraping:", error);
      // sendResponse({ success: false, error: error.message });
  });

  // Indicate that sendResponse will be called asynchronously
  return true;
}

function onError(error) {
  console.log(`Error: ${error}`);
}

function scrape_tensorflow_doc() {
  let creating = chrome.tabs.create({
      url: "https://js.tensorflow.org/api/latest/"
  })
  creating.then(onCreated, onError)
}

chrome.runtime.onInstalled.addListener(({reason}) => {
  chrome.tabs.create({
    url: "index.html",
    pinned: true
  });
  scrape_tensorflow_doc()
});