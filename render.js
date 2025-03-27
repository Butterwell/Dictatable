// Generate visualization from results
// TODO Graphical
export function render(results) {
    let lines = results.stack.map(render_item)
    return lines
}

export function render_item(item) {
    if (item instanceof tf.Tensor) {
        const array = item.arraySync();
        const string = JSON.stringify(array);
        return string    
    } else {
        const string = JSON.stringify(item)
        return string
    }
}