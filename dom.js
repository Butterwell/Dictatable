export function create_save_function(storage_name) {
    return (text) => {
        if (storageAvailable("localStorage")) {
            window.localStorage.setItem(storage_name, text)
        } else {
            console.log("localStorage unspported")
        }
    }
}

// Knows the structure of model
export function create_load_function(storage_name, callback) {
    return (event) => {
        if (storageAvailable("localStorage")) {
            let text = window.localStorage.getItem(storage_name)
            if (text === null) {
                // Don't update result
            } else {
                callback(text)
            }
        } else {
            console.log("localStorage Unsupported")
        }
    }
}

// Protect against <BR/> in contentEditable by adding newline instead
export function create_keydown_function(callback) {
    return (event) => {
        if (event.key === 'Enter' && isCursorInTextNode()) {
            event.preventDefault();
            let element = getTextNodeAtCursor()
            // contentEditable can add <BR/> do this instead
            editTextNodeAtCursor(element, "\n")
            callback()
        } 
    }
}

// callback only if something changed
export function create_paste_function(callback) {
    return (event) => {
        event.preventDefault(); // Prevent the default paste behavior.
    
        const clipboardData = event.clipboardData;
        if (!clipboardData) return; // Handle lack of clipboard data.
    
        const pastedText = clipboardData.getData('text/plain');
    
        // Modern browsers
        const selection = window.getSelection();
        if (!selection) return; // Handle no selection

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents(); // Delete any selected content.
            range.insertNode(document.createTextNode(pastedText));
            selection.collapseToEnd(); // Move cursor to end of pasted text.
        } else {
            //If no selection, just append.
            element.appendChild(document.createTextNode(pastedText));
        }
        callback()
    }
}
  
export function storageAvailable(type) {
    var storage;
    try {
        storage = window[type];
        var x = "__storage_test__";
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch (e) {
        return e instanceof DOMException && (e.code === 22 || e.code === 1014 || e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") && (storage && storage.length !== 0);
    }
}

export function now() {
    return performance.now()
}

let on_tick_update_function = (timestamp) => {}

export function start_ticker(on_tick) {
    on_tick_update_function = on_tick
    let first_tick = performance.now()
    window.requestAnimationFrame(tick)
    return first_tick
}

function tick(nowish) {
  window.requestAnimationFrame(tick)
  on_tick_update_function(nowish)
}

function isCursorInTextNode() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      return false; // No selection, cursor might not be in a text node
    }
    const range = selection.getRangeAt(0);
    return range.startContainer.nodeType === Node.TEXT_NODE;
}

// TODO Read ProseMirror code about this.
function editTextNodeAtCursor(node, newText) {
    // Check if the node is actually a text node
    if (node.nodeType === Node.TEXT_NODE) {
      const range = window.getSelection().getRangeAt(0);
  
      // Check if the cursor is within the text node
      if (range.startContainer === node) {
        const cursorPosition = range.startOffset;
  
        // Modify the text node value
        const originalText = node.nodeValue;
        const newTextValue = 
          originalText.slice(0, cursorPosition) + 
          newText + 
          originalText.slice(cursorPosition);
        node.nodeValue = newTextValue;
  
        // Update the cursor position
        range.setStart(node, cursorPosition + newText.length);
        //range.collapse(true);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    }
}

function getTextNodeAtCursor() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      return null; // No selection, cursor might not be in a text node
    }
  
    const range = selection.getRangeAt(0);
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      return range.startContainer;
    } else {
      // If the cursor is not directly within a text node, 
      // find the closest ancestor text node
      let currentNode = range.startContainer;
      while (currentNode && currentNode.nodeType !== Node.TEXT_NODE) {
        currentNode = currentNode.parentNode;
      }
      return currentNode;
    }
}
