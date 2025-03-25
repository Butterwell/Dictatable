// Generate visualization from results
// TODO Graphical
export function render(results) {
    let lines = results.stack.map(render_tensor)
    console.log(lines)
    return lines
}

export function render_tensor(tensor) {
    const array = tensor.arraySync();
    const string = JSON.stringify(array);
    return string
}