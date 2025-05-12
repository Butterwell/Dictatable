const one_tensor = tf.scalar(1.0, 'int32');

export function peek(stack, i, item, errors) {
  const spec = stack.pop();
  const count = (spec.rank === 0 ? [spec.arraySync()] : spec.arraySync());
  if (stack.length >= count) {
    const tensor = stack[stack.length - count].clone();
    stack.push(tensor);
    spec.dispose();
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'peek needs some tensors on stack',
    });
  }
}
export function and(stack, i, item, errors) {
  if (stack.length > 1
    && stack[stack.length - 1] instanceof tf.Tensor
    && stack[stack.length - 2] instanceof tf.Tensor
    && stack[stack.length - 1].dtype === 'bool'
    && stack[stack.length - 2].dtype === 'bool') {
    const b = stack.pop();
    const a = stack.pop();
    const tensor = tf.logicalAnd(a, b);
    a.dispose();
    b.dispose();
    stack.push(tensor);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'and needs two tensors on stack',
    });
  }
}
export function or(stack, i, item, errors) {
  if (stack.length > 1
    && stack[stack.length - 1] instanceof tf.Tensor
    && stack[stack.length - 2] instanceof tf.Tensor
    && stack[stack.length - 1].dtype === 'bool'
    && stack[stack.length - 2].dtype === 'bool') {
    const b = stack.pop();
    const a = stack.pop();
    const tensor = tf.logicalOr(a, b);
    a.dispose();
    b.dispose();
    stack.push(tensor);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'or needs two tensors on stack',
    });
  }
}
// TODO Error if not same type rather than ignore?
export function equal(stack, i, item, errors) {
  if ((stack.length > 1)
    && (stack[stack.length - 1] instanceof tf.Tensor)
    && (stack[stack.length - 2] instanceof tf.Tensor)
    && stack[stack.length - 1].dtype !== 'string'
    && stack[stack.length - 2].dtype !== 'string') {
    const b = stack[stack.length - 1].toFloat();
    const a = stack[stack.length - 2].toFloat();
    if (a.dtype === b.dtype) {
      const tensor = tf.equal(a, b);
      let d1 = stack.pop();
      let d2 = stack.pop();
      a.dispose();
      b.dispose();
      d1.dispose();
      d2.dispose();
      stack.push(tensor);
    } else {
      console.log(a, b);
    }
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'equal needs two tensors on stack',
    });
  }
}
export function convolution(stack, i, item, errors) {
  if (stack.length > 1
    && stack[stack.length - 1] instanceof tf.Tensor
    && stack[stack.length - 2] instanceof tf.Tensor
    && stack[stack.length - 1].rank === 4
    && stack[stack.length - 2].rank === 3
    && stack[stack.length - 1].dtype !== 'string'
    && stack[stack.length - 2].dtype !== 'string') {
    const filter = stack[stack.length - 1].toFloat();
    const x = stack[stack.length - 2].toFloat();
    const y = tf.conv2d(x, filter, 1, 'same');
    const d1 = stack.pop();
    const d2 = stack.pop();
    d1.dispose();
    d2.dispose();
    x.dispose();
    filter.dispose();
    stack.push(y);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'convolution needs two tensors on stack',
    });
  }
}
export function duplicate(stack, i, item, errors) {
  if (stack.length > 0) {
    stack.push(tf.clone(stack[stack.length - 1]));
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to duplicate',
    });
  }
}
export function flip(stack, i, item, errors) {
  if (stack.length > 1) {
    let temp = stack[stack.length - 1];
    stack[stack.length - 1] = stack[stack.length - 2];
    stack[stack.length - 2] = temp;
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'can not flip, less than two tensors on stack',
    });
  }
}
export function subtract(stack, i, item, errors) {
  if (stack.length > 1 && stack[stack.length - 1].dtype !== 'string' && stack[stack.length - 2].dtype !== 'string') {
    const b = stack.pop();
    const a = stack.pop();
    const tensor = tf.sub(a, b);
    stack.push(tensor);
    a.dispose();
    b.dispose();
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'can not subtract, less than two tensors on stack',
    });
  }
}
export function add(stack, i, item, errors) {
  if (stack.length > 1 && stack[stack.length - 1].dtype !== 'string' && stack[stack.length - 2].dtype !== 'string') {
    const b = stack.pop();
    const a = stack.pop();
    const tensor = tf.add(a, b);
    stack.push(tensor);
    a.dispose();
    b.dispose();
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'can not add, less than two tensors on stack',
    });
  }
}
export function concat(stack, i, item, errors) {
  if (stack.length > 1) {
    const going_away_b = stack.pop();
    const going_away_a = stack.pop();
    const tensor = tf.concat([going_away_a, going_away_b], 0);
    going_away_a.dispose();
    going_away_b.dispose();
    stack.push(tensor);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'can not concat, less than two tensors on stack',
    });
  }
}
export function pop(stack, i, item, errors) {
  if (stack.length > 0) {
    const going_away = stack.pop();
    going_away.dispose();
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to pop',
    });
  }
}
export function not(stack, i, item, errors) {
  if (stack.length > 0) {
    const going_away = stack.pop();
    const tensor = tf.sub(one_tensor, going_away);
    going_away.dispose();
    stack.push(tensor);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to not',
    });
  }
}
export function sign(stack, i, item, errors) {
  if (stack.length > 0) {
    const going_away = stack.pop();
    const tensor = tf.math.sign(going_away);
    going_away.dispose();
    stack.push(tensor);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to get sign of',
    });
  }
}
export function expand(stack, i, item, errors) {
  if (stack.length > 0) {
    const going_away = stack.pop();
    const tensor = going_away.expandDims(0);
    going_away.dispose();
    stack.push(tensor);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to expand of',
    });
  }
}
export function ones(stack, i, item, errors) {
  if (stack.length > 0) {
    const spec = stack.pop();
    const shape = (spec.rank === 0 ? [spec.arraySync()] : spec.arraySync());
    if (shape.length < 4) { shape.push(1); }
    if (shape.length < 4) { shape.push(1); }
    const tensor = tf.ones(shape, 'int32');
    spec.dispose();
    stack.push(tensor);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to generate ones from',
    });
  }
}
export function zeros(stack, i, item, errors) {
  if (stack.length > 0) {
    const spec = stack.pop();
    const shape = (spec.rank === 0 ? [spec.arraySync()] : spec.arraySync());
    if (shape.length < 4) { shape.push(1); }
    if (shape.length < 4) { shape.push(1); }
    const tensor = tf.zeros(shape, 'int32');
    spec.dispose();
    stack.push(tensor);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to generate zeros from',
    });
  }
}
export function random(stack, i, item, errors) {
  if (stack.length > 0) {
    const spec = stack.pop();
    const shape = (spec.rank === 0 ? [spec.arraySync()] : spec.arraySync());
    if (shape.length < 3) { shape.push(1); }
    const tensor = tf.randomUniform(shape, 0, 1);
    spec.dispose();
    stack.push(tensor);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to generate zeros from',
    });
  }
}
export function round(stack, i, item, errors) {
  if (stack.length > 0) {
    const old = stack.pop();
    const tensor = old.round();
    old.dispose();
    stack.push(tensor);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to generate randoms from',
    });
  }
}
export function range(stack, i, item, errors) {
  if (stack.length > 0) {
    const going_away = stack.pop();
    if (going_away.rank === 0) {
      const tensor = tf.range(0, going_away.arraySync(), 1, 'int32');
      going_away.dispose();
      stack.push(tensor);
    } else if (going_away.rank === 1) {
      if (going_away.size === 1) {
        const to = going_away.arraySync()[0];
        const tensor = tf.range(0, to);
        going_away.dispose();
        stack.push(tensor);
      } else if (going_away.size === 2) {
        const rows = going_away.arraySync()[0];
        const cols = going_away.arraySync()[1];
        const rowsTensor = tf.range(0, rows).expandDims(1).tile([1, cols]);
        const colsTensor = tf.range(0, cols).expandDims(0).tile([rows, 1]);
        const tensor = tf.stack([rowsTensor, colsTensor], -1);
        going_away.dispose();
        stack.push(tensor);
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'range operates on tensor of rank 1 with sizes 1 and 2 only',
        });
      }
    } else {
      errors.push({
        index: i,
        text: item,
        message: 'range operates on tensor of rank 0 or 1',
      });
    }
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to generate range from',
    });
  }
}
export function flatten(stack, i, item, errors) {
  if (stack.length > 0) {
    const going_away = stack.pop();
    const tensor = going_away.reshape([-1]);
    going_away.dispose();
    stack.push(tensor);
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to expand of',
    });
  }
}
export function rotate(stack, i, item, errors) {
  if (stack.length > 1) {
    const going_away_count = stack.pop();
    if (going_away_count.rank === 0) {
      const going_away_array = stack.pop();
      const length = going_away_array.shape[0];
      let k = tf.scalar(tf.mod(going_away_count, length).arraySync(), 'int32');
      if (k.arraySync() === 0) {
        stack.push(going_away_array);
      } else {
        const indices = tf.range(0, length, 1, 'int32');
        const length_too = tf.scalar(length, 'int32');
        const rotatedIndices = tf.mod(tf.add(indices, k), length_too);
        const tensor = tf.gather(going_away_array, rotatedIndices);
        going_away_count.dispose();
        going_away_array.dispose();
        indices.dispose();
        length_too.dispose();
        rotatedIndices.dispose();
        stack.push(tensor);
      }
      k.dispose();
    } else {
      errors.push({
        index: i,
        text: item,
        message: 'rotate count needs to be rank 0',
      });
    }
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'can not rotate, less than two tensors on stack',
    });
  }
}
export function sum(stack, i, item, errors) {
  if (stack.length > 0) {
    const tensor = stack.pop();
    try {
      if (tensor.dtype === 'int32' || tensor.dtype === 'float32') {
        const sumTensor = tensor.sum().expandDims(0);
        stack.push(sumTensor);
      } else {
        errors.push({
          index: i,
          text: item,
          message: "sum requires tensor with numeric dtype",
        });
      }
    } catch (error) {
      errors.push({
        index: i,
        text: item,
        message: `Error summing tensor: ${error.message}`,
      });
    } finally {
      tensor.dispose();
    }
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'sum requires tensor on stack',
    });
  }
}
