import { create_load_function, create_save_function, start_ticker, now } from './dom.js'

// Event Message => Update => Model => View

let workspace = {}


function main(init, view) {
    workspace.view = view
    init()
    return workspace
}

function init() {
// --- Initialize ---
    // Register input events
    let storage_name = "main"
    let main = document.getElementById("main")
    workspace.main = main

    const quill = new Quill(main, {});

    quill.on('text-change', (delta, oldDelta, source) => {
        if (source == 'api') {
            //console.log('An API call triggered this change.');
        } else if (source == 'user') {
            let text = quill.getText()
            save(text)
            workspace.repeats = []
            workspace.view()
        }
    });

    let onLoad = create_load_function(storage_name, (text) => {
        workspace.content = text
        workspace.view()
        quill.setContents([{ insert: text }])
        console.log("source loaded from save")
    })
    let save = create_save_function(storage_name)

    window.addEventListener("load", onLoad)

    let onTick = (timestamp) => {
        workspace.repeats.forEach((repeat) => {
            if (timestamp > repeat.next) {
                // **Don't** play catch-up
                repeat.next = now() + repeat.every
                // TODO Run repeat code
                // TODO Render
            }
        })
    }

    let first_tick = start_ticker(onTick)

  return workspace // Global already... just because it's easy.
}

let results = document.getElementById("results")
let canvas = document.getElementById("canvas")

function view() {
}

window.model = main(init, view)
