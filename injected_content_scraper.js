// Function to wait for an element to appear
function waitForElement(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`waitForElement: Element '${selector}' found immediately.`);
            return resolve(element); // Resolve immediately if element is already present
        }

        console.log(`waitForElement: Element '${selector}' not found, setting up observer.`);
        const observer = new MutationObserver((mutations, obs) => {
            const el = document.querySelector(selector);
            if (el) {
                console.log(`waitForElement: Element '${selector}' found via observer.`);
                obs.disconnect();
                resolve(el);
            }
        });

        // Start observing for changes in the entire document body
        observer.observe(document.body, { childList: true, subtree: true });

        // Set a timeout to reject if the element doesn't appear
        setTimeout(() => {
            observer.disconnect(); // Stop observing if timeout occurs
            console.warn(`waitForElement: Timeout waiting for element: ${selector}`);
            reject(new Error(`Timeout waiting for element: ${selector}`));
        }, timeout);
    });
}

// Function to perform the actual scraping
async function scrapeApiData() {
    const apiData = [];

    try {
        // Wait for the main content to load. Adjust this selector based on actual inspection.
        // Look for a distinct element that indicates the API list is ready.
        await waitForElement('.reference', 15000); // Wait up to 15 seconds for one api-section to show up

        const apiSections = document.querySelectorAll('.api-section'); // Tensors, Models, Layers, Operations, Training, ...

        for (const section of apiSections) {
            const sectionChildren = section.children;

            let sectionTitle = ''
            let subsectionTitle = '' // changes per subsection

            for (const child of sectionChildren) {
                if (child.classList.contains('heading')) {
                    // should only be one per section
                    sectionTitle = child.querySelector('.title').textContent.trim();
                    console.log(`  Heading found: ${sectionTitle}`);
                    // You might store this if it's relevant, or just use it for logging structure.
                } else if (child.classList.contains('subheading')) {
                    subsectionTitle = child.querySelector('.title').textContent.trim();
                    console.log(`  Subheading found: ${subsectionTitle}`);
                } else if (child.classList.contains('symbol') && child.classList.contains('function')) {
                    // API function
                    // symbol-header
                    const functionName = child.querySelector('.symbol-header .symbol-link').textContent.trim()
                    const signature = child.querySelector('.symbol-header .signature').textContent.trim()
                    // documentation

                    // param
                    // eter-list
                    // returns        

        
                    apiData.push({
                        Section: sectionTitle,
                        Subsection: subsectionTitle,
                        Name: functionName,
                        Signature: signature
                    });
                }
            }
        }
        return { success: true, data: apiData };
    } catch (error) {
        console.error("Error in content script during scraping:", error);
        return { success: false, error: error.message };
    }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "performScrape") {
        scrapeApiData().then(sendResponse);
        return true; // Indicate that sendResponse will be called asynchronously
    }
});