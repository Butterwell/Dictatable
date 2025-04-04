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

async function expandTensorJS(tensor, scale) {
    // TODO Check that scale is an integer
    const [originalRows, originalCols] = tensor.shape;
  
    const rows = originalRows * scale;
    const cols = originalCols * scale;
    const upsamplingFactor = [scale, scale]
  
    // Reshape to add batch and channel dimensions (required for upSampling2d)
    const reshapedTensor = tensor.reshape([1, originalRows, originalCols, 1]);
  
    // Use tf.layers.upSampling2d
    const upsampledLayer = tf.layers.upSampling2d({
      size: upsamplingFactor,
      interpolation: 'nearest'
    });
    const upsampledTensor = upsampledLayer.apply(reshapedTensor);
  
    // Reshape back to the desired 2D shape
    const expandedTensor = upsampledTensor.reshape([rows, cols]);
  
    return expandedTensor;
}
  
export async function render_tensor_to_canvas(tensor, scale, canvas) {
    let floated = tensor.toFloat()
    let display_tensor = await expandTensorJS(floated, scale)
    tf.browser.toPixels(display_tensor.toFloat(), canvas)
} 