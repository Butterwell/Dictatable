import { text_processor, run } from "./dictatable.js"

import { create_load_function, create_save_function, create_keydown_function, create_paste_function, start_ticker, now } from './dom.js'

// Event Message => Update => Model => View
// The inital model is text.


const code_chunks = []

function instantiate_code_chunk(source) {
    const container = document.createElement("p")
    const quill = new Quill(container)
    return { source, container, quill }
}

function wire_quill(code_chunk) {
    quill.on('text-change', (delta, oldDelta, source) => {
        code_chunk.source = quill.getText()
    })
} 


let model = create_model()

function create_model() {
    return {
        content: "Dictate here.",
        view,
        repeats: [],
        stack: []
    }
}

function main(init, view) {
    let model = init(view)
    return model
}

// Counting on the browser scheduler to handle most things.

function dispose_stack(stack) {
    stack.forEach((item) => {
        if (item instanceof tf.Tensor) {
            item.dispose()
        }
    })
}

import { init_canvas_embed } from './editor.js'

function init(view) {
// --- Initialize ---
    // Register input events
    let storage_name = "main"
    let main = document.getElementById("main")
    model.main = main

    init_canvas_embed(Quill)
    const quill = new Quill(main, {});

    quill.on('text-change', (delta, oldDelta, source) => {
        if (source == 'api') {
            //console.log('An API call triggered this change.');
        } else if (source == 'user') {
            let text = quill.getText()
            save(text)
            model.repeats = []
            dispose_stack(model.stack)
            model.stack = []
            model.content = text
            model.view()
        }
    });

    let onLoad = create_load_function(storage_name, (text) => {
        model.content = text
        model.view()
        quill.setContents([{ insert: text }])
        console.log("source loaded from save")
    })
    let save = create_save_function(storage_name)

    window.addEventListener("load", onLoad)

    let onTick = (timestamp) => {
        model.repeats.forEach((repeat) => {
            if (timestamp > repeat.next) {
                // **Don't** play catch-up
                repeat.next = now() + repeat.every
                let b = run([], model.stack, repeat.code)
                run_render(b, model.stack)
            }
        })
    }

    let first_tick = start_ticker(onTick)

//   TODO Grab cached inputs
//   TODO Grab cached outputs (results)
//   TODO Grab cached veiw definitions
  return model // Global already... just because it's easy.
}

// function update(model, message) {
// // --- Update --
// let updated_model =
//     message == "whatever" ? model :
//     (message == "next" ? model :
//     model) // default
// }

let results = document.getElementById("results")
let canvas = document.getElementById("canvas")

import { render, render_item, render_tensor_to_canvas } from './render.js'
function run_render(run_result, stack) {
    results.innerText = render(run_result)
    if (stack.length > 0) {
        let top = stack[stack.length - 1]
        if (top instanceof tf.Tensor
            && top.dtype !== 'string'
            && top.rank === 3
        ) {
                    render_tensor_to_canvas(top, 4, canvas)
        }
    }
}

function view() {
    let a = text_processor(model.content)
    results.innerText = a.map(render_item)
    let b = run(model.repeats, model.stack, a)
    run_render(b, model.stack)
}

window.model = main(init, view)

// import { create_arrow_processor } from "./arrow.js"

// const arrow_processor = create_arrow_processor(() => { console.log("callback") })

// arrow_processor({ command: "something", data: "some data" })

// TODO Finish implementation
// import { create_solver } from "./wasm-symbolic-executor/phase-0.js"
// const { context, solver, Z3 } = create_solver('main')

// import { runSymbolicExample } from "./wasm-symbolic-executor/example.js"

// runSymbolicExample(context, solver, Z3)