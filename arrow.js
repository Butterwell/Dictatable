// Perhaps in the future separate this into two files for the

// Code for main
// Interface to Arrow functions that need to be sandboxed because they use Function

const sandboxFrame = document.getElementById('sandbox');

let sandbox_ready = false

function arrow_processor(command) {
    if (sandbox_ready) {
        // Send a message to the sandboxed iframe
        sandboxFrame.contentWindow.postMessage({ command: 'processData', data: 'some input' }, '*');
        // Note: '*' is used for simplicity, but in a real app, you should specify the exact origin
        // if you know it, e.g., chrome.runtime.getURL('sandbox.html').origin
    } else {
        // TODO Wait


    }
}

export function create_arrow_processor(callback) {
    sandboxFrame.onload = () => {
        console.log("iframe element has loaded.");
        // At this point, the sandbox.html DOM is ready, and sandbox-script.js has started executing.
        // The 'sandboxReady' message will confirm its application-level readiness.
    };    
    console.log("main listener setup")
    window.addEventListener('message', (event) => {
        // Always verify the origin of messages!
        // In this case, check if event.source === sandboxFrame.contentWindow
        // and event.origin matches the unique origin of your sandboxed iframe.
        // You can get the sandboxed iframe's origin after it loads if needed.
        if (event.source === sandboxFrame.contentWindow && event.data.response === 'dataProcessed') {
          console.log('Received data from sandbox:', event.data.result);
          callback(event.data.result)
        }
    });
    return arrow_processor
}

// Code for sandbox

//import * as arrow from './3rd-party/apache-arrow-esm.js';

import  { tableFromArrays } from './3rd-party/apache-arrow-esm.js';

export function sandbox_setup_processor() {
    console.log("sandbox listener setup")
    window.addEventListener('message', (event) => {
        // Always verify the origin of messages! (e.g., event.origin === chrome.runtime.getURL('').origin)
        // For messages from your main extension, event.origin will be your extension's unique internal origin.
        if (event.data.command === 'processData') {
          try {
            // Use your 3rd-party library with event.data.data
            //const processedResult = myThirdPartyLibrary.process(event.data.data); // This is where eval() happens in the library
            const processedResult = test_arrow()
      
            // Send the result back to the main extension context
            event.source.postMessage({ response: 'dataProcessed', result: processedResult }, event.origin);
          } catch (e) {
            event.source.postMessage({ response: 'error', error: e.message }, event.origin);
          }
        }
      });    
}

export function test_arrow() {
    const myData = {
        values: [10, 20]
    }
    const myTable = tableFromArrays(myData);
    console.log("My table:", myTable.toString());
    return myTable
}

