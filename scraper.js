// These functions only work in a browser extension

function onCreated(tab) {
    console.log(`Created new tab: ${tab.id}`);
    browser.tabs.remove(tab)
}
  
function onError(error) {
    console.log(`Error: ${error}`);
}

export function scrape_tensorflow_doc() {
    let creating = browser.tabs.create({
        url: "https://js.tensorflow.org/api/latest/"
    })
    creating.then(onCreated, onError)
}
