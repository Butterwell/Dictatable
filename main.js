// async function chainGraphs() {
//     const tensor1 = tf.tensor([1, 2, 3]);
//     const tensor2 = tf.tensor([4, 5, 6]);
  
//     // Graph 1: Add tensors
//     const graph1Output = tensor1.add(tensor2);
  
//     // Graph 2: Multiply by 2
//     const graph2Output = graph1Output.mul(tf.scalar(2));
  
//     graph2Output.print(); // Print the final result
// }
  
// chainGraphs();

import { text_processor, run } from "./dictatable.js"

import { create_load_function, create_save_function, create_keydown_function, create_paste_function, start_ticker, now } from './dom.js'

// Event Message => Update => Model => View
// The inital model is text.

let model = {
    content: "Dictate here.",
    view,
    repeats: [],
    stack: []
}

function main(init, view) {
    let model = init(view)
    return model
}

// Counting on the browser scheduler to handle most things.
// TODO Send longer

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
        model.stack = []
        model.content = text
        model.view()
    })

    let onInput = (event) => {
        let text = model.main.innerText
        save(text)
        model.repeats = []
        model.stack = []
        model.content = text
        model.view()
    }

    // create_paste_function makes paste plain text
    let onPaste = create_paste_function(() => {
        let text = model.main.innerText
        save(text)
        model.repeats = []
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
        if (top instanceof tf.Tensor) {
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
