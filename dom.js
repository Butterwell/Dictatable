import { load, store } from "./persist.js"

export function create_save_function(storage_name) {
    return async (text) => {
        await store(storage_name, text)
    }
}

export function create_load_function(storage_name, callback) {
    return async (event) => {
        let text = await load(storage_name)
        callback(text)
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
