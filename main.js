import { text_processor, run } from "./dictatable.js"

import { create_load_function, create_save_function, create_keydown_function, create_paste_function, start_ticker, now } from './dom.js'

// Event Message => Update => Model => View
// The inital model is text.

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

function init(view) {
// --- Initialize ---
    // Register input events
    let storage_name = "main"
    let main = document.getElementById("main")
    model.main = main

    let onLoad = create_load_function(storage_name, (text) => {
        model.content = text
        model.view()
        model.main.innerHTML = model.content
        console.log(text)
    })
    let save = create_save_function(storage_name)

    // Protect against <BR/> in text
    let onKeydown = create_keydown_function(() => {
        let text = model.main.innerText
        save(text)
        model.repeats = []
        dispose_stack(model.stack)
        model.stack = []
        model.content = text
        model.view()
    })

    let onInput = (event) => {
        let text = model.main.innerText
        save(text)
        model.repeats = []
        dispose_stack(model.stack)
        model.stack = []
        model.content = text
        model.view()
    }

    // create_paste_function makes paste plain text
    let onPaste = create_paste_function(() => {
        let text = model.main.innerText
        save(text)
        model.repeats = []
        dispose_stack(model.stack)
        model.stack = []
        model.content = text
        model.view()
    })

    main.addEventListener('keydown', onKeydown)
    main.addEventListener('input', onInput)
    main.addEventListener('paste', onPaste)

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
