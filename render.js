// Generate visualization from results
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
    reshapedTensor.dispose()
  
    // Reshape back to the desired 2D shape
    const expandedTensor = upsampledTensor.reshape([rows, cols]);
    upsampledTensor.dispose()
    return expandedTensor;
}
  
export async function render_tensor_to_canvas(tensor, scale, canvas) {
    let floated = tensor.toFloat()
    let display_tensor = await expandTensorJS(floated, scale)
    floated.dispose()
    tf.browser.toPixels(display_tensor, canvas)
    display_tensor.dispose()
    //console.log(tf.memory().numTensors, tf.memory().numBytesInGPU)
}

// Unused, untested
export const canvas_pool = createCanvasPool()

// Assumes 2D use
function createCanvasPool(capacity = 10) {
    let pool = Array.from({ length: capacity }, () => {
      const canvas = document.createElement('canvas');
      canvas.width = 0;
      canvas.height = 0;
      canvas.style.display = 'none';
      return canvas;
    });
  
    function acquire() {
      if (pool.length > 0) {
        const canvas = pool.pop();
        canvas.style.display = '';
        return canvas;
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = 0;
        canvas.height = 0;
        return canvas;
      }
    }
  
    function release(canvas) {
      if (canvas) {
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
        pool.push(canvas);
      }
    }
  
    function resize(canvas, width, height) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }
  
    function clearPool() {
      pool = [];
    }
  
    function getPoolSize() {
      return pool.length;
    }
  
    return {
      acquire,
      release,
      resize,
      clearPool,
      getPoolSize,
    };
  }
  