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

// console.log(parse("1 2 3 sum"))

// console.log(run(parse("1 2 3 sum")))

// console.log(run(parse("4 5 6 sum render to console")))

// console.log(run(parse("4 5 6 sum render to new browser tab")))

// test_run()


import { create_load_function, create_save_function, create_keydown_function, start_ticker } from './dom.js'

// Event Message => Update => Model => View
// The inital model is text.

let model = {
    content: "Dictate here.",
    view
}

function main(init, update, view) {
    let model = init(update, view)
    return model
}

// Counting on the browser scheduler to handle most things.
// TODO Send longer

function init(update, view) {
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
    let onKeydown = create_keydown_function(model, (text) => {
        save(text)
        model.content = text
        model.view()
    })

    let onInput = (event) => {
        let text = model.main.innerText
        save(text)
        model.content = text
        model.view()
    }

    main.addEventListener('keydown', onKeydown)
    main.addEventListener('input', onInput);

    window.addEventListener("load", onLoad)

    let total_time = 0
    let once = false
    // start_ticker((delta) => {
    //     total_time += delta
    //     if ((Math.round(total_time) % 90) == 0) {
    //         if (once) {
    //             console.log(Math.round(total_time))
    //             once = false    
    //         }
    //     } else {
    //         once = true
    //     }
    // })

// TODO Register tick event
//   TODO Grab cached inputs
//   TODO Grab cached outputs (results)
//   TODO Grab cached veiw definitions
  return model // Global already... just because it's easy.
}

function update(model, message) {
// --- Update --
// TODO Compute results of changes (into Model cache) (on events)
let updated_model =
    message == "whatever" ? model :
    (message == "next" ? model :
    model) // default
// TODO Persist Model
// TODO Render view
}

let results = document.getElementById("results")

import { render, render_item } from './render.js'
function view() {
    let a = text_processor(model.content)
    results.innerText = a.map(render_item)
    let b = run(a)
    results.innerText = render(b)
    //results.innerHTML  = render(run(text_processor(model.content)))
}

main(init, update, view)
