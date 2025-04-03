import { convert_numbers_to_arrays } from "./convert_numbers_to_arrays.js";

const one_tensor = tf.scalar(1.0, 'int32');

function peek(stack, i, item, errors) {
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

function and(stack, i, item, errors) {
  if (stack.length > 1 && stack[stack.length - 1].dtype === 'bool' && stack[stack.length - 2].dtype === 'bool') {
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

function or(stack, i, item, errors) {
  if (stack.length > 1 && stack[stack.length - 1].dtype === 'bool' && stack[stack.length - 2].dtype === 'bool') {
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

import { render_item } from "./render.js";
// TODO Error if not same type rather than ignore?
function equal(stack, i, item, errors) {
  if (stack.length > 1) {
    const b = stack[stack.length - 1]
    const a = stack[stack.length - 2]
    if (a.dtype === b.dtype) {
      const tensor = tf.equal(a, b);
      stack.pop()
      stack.pop()
      a.dispose();
      b.dispose();
      stack.push(tensor);
    }
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'equal needs two tensors on stack',
    });
  }
}

function convolution(stack, i, item, errors) {
  if (stack.length > 1 && stack[stack.length - 1].dtype !== 'string' && stack[stack.length - 2].dtype !== 'string') {
    const filter = stack[stack.length - 1].toFloat();
    const x = stack[stack.length - 2].toFloat();
    if ((filter.rank === 4) && (x.rank === 3)) {
      const y = tf.conv2d(x, filter, 1, 'same');
      const d1 = stack.pop();
      const d2 = stack.pop();
      d1.dispose();
      d2.dispose();
      x.dispose();
      filter.dispose();
      stack.push(y);
    } else {
      console.log(filter.rank, x.rank);
    }
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'convolution needs two tensors on stack',
    });
  }
}

function duplicate(stack, i, item, errors) {
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

function flip(stack, i, item, errors) {
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

function subtract(stack, i, item, errors) {
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

function add(stack, i, item, errors) {
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

function concat(stack, i, item, errors) {
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

function pop(stack, i, item, errors) {
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

function not(stack, i, item, errors) {
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

function sign(stack, i, item, errors) {
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

function expand(stack, i, item, errors) {
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

function ones(stack, i, item, errors) {
  if (stack.length > 0) {
    const spec = stack.pop();
    const shape = (spec.rank === 0 ? [spec.arraySync()] : spec.arraySync());
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

function zeros(stack, i, item, errors) {
  if (stack.length > 0) {
    const spec = stack.pop();
    const shape = (spec.rank === 0 ? [spec.arraySync()] : spec.arraySync());
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

function random(stack, i, item, errors) {
  if (stack.length > 0) {
    const spec = stack.pop();
    const shape = (spec.rank === 0 ? [spec.arraySync()] : spec.arraySync());
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

function round(stack, i, item, errors) {
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

function range(stack, i, item, errors) {
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

function flatten(stack, i, item, errors) {
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

function rotate(stack, i, item, errors) {
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

function sum(stack, i, item, errors) {
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

function consoleRender(stack, i, item, errors) {
  if (stack.length > 0) {
    const tensor = stack[stack.length - 1];
    tensor.print();
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to render',
    });
  }
}

function browserTabRender(stack, i, item, errors) {
  if (stack.length > 0) {
    const tensor = stack[stack.length - 1];
    tensor.print();
  } else {
    errors.push({
      index: i,
      text: item,
      message: 'nothing on stack to render',
    });
  }
}

const built_in_commands = {
  'peek': peek,
  'and': and,
  'or': or,
  'equal': equal,
  'convolution': convolution,
  'duplicate': duplicate,
  'flip': flip,
  'subtract': subtract,
  'add': add,
  'concat': concat,
  'pop': pop,
  'not': not,
  'sign': sign,
  'expand': expand,
  'ones': ones,
  'zeros': zeros,
  'random': random,
  'round': round,
  'range': range,
  'flatten': flatten,
  'rotate': rotate,
  'sum': sum,
  'console render': consoleRender,
  'browser tab render': browserTabRender,
};

const definitions = {}
const repeats = []

// 100 every Update repeat
// Place every specifications into repeats array
function every_repeat_phrase(words, i, stack) {
  if (words[i] !== "every") {
    console.log("every fail")
    return i;
  }

  if (stack.length === 0) {
    console.log("every fail: nothing on stack")
    return i;
  }

  let time = stack.pop()
  let code = []

  i++ // drop "every"

  let repeat = { time, code }

  while ((i < words.length) && (words[i] !== "repeat")) {
    repeat.code.push(words[i])
    i++
  }
  repeats.push(repeat)
  return i
}

export function run(parsed) {
  const stack = [];
  const errors = [];

  // TODO Make stack-height errors part of text_processor (as a pass)
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (item === "every") {
      i = every_repeat_phrase(parsed, i, stack)
    } else if (Array.isArray(item)) {
      try {
        // Default single number to rank 0
        if (item.length === 1) {
          const tensor = tf.tensor(item[0])
          stack.push(tensor);  
        } else {
          // Multiple numbers are rank 1
          const tensor = tf.tensor(item);
          stack.push(tensor);  
        }
     } catch (error) {
        errors.push({
          index: i,
          text: item,
          message: `Error creating tensor: ${error.message}`,
        });
      }
    } else if (typeof item === 'string') {
      const command = built_in_commands[item.toLowerCase()];
      if (command) {
        command(stack, i, item, errors);
      } else {
        if (stack.length === 0) {
          stack.push([item])
        } else if (stack[stack.length - 1] instanceof tf.Tensor) {
          stack.push([item])
        } else if (Array.isArray(stack[stack.length - 1])) {
          if (stack[stack.length - 1].length > 0 && typeof stack[stack.length - 1][0] === 'string') {
            stack[stack.length - 1].push(item)
          } else {
            stack.push([item])
          }
        }
      }
    } else {
      errors.push({
        index: i,
        text: item,
        message: `Invalid input: ${item}`,
      });
    }
  }

  return { stack, errors };
}

export function test_run() {
// Examples
const example1 = [[1, 2, 3], 'sum', 'console render'];
const result1 = run(example1);
console.log('Example 1:', result1.errors);

const example2 = [[1, 2, 3], [4, 5, 6], 'sum', 'console render'];
const result2 = run(example2);
console.log('Example 2:', result2.errors);

const example3 = [[1, 2, 3], 'invalid command'];
const result3 = run(example3);
console.log('Example 3:', result3.errors);

const example4 = [[1, 2, 3], 'sum', 'sum', 'console render'];
const result4 = run(example4);
console.log('Example 4:', result4.errors);

const example5 = ['sum'];
const result5 = run(example5);
console.log('Example 5:', result5.errors);

const example6 = [[1,2,3], [4,5,6], 'console render', 'browser tab render', 'sum', 'console render'];
const result6 = run(example6);
//console.log('Example 6:', result6);

const example7 = [[1,2,3], 55, 'sum'];
const result7 = run(example7);
console.log('Example 7:', result7);

const example8 = [[1.1, 2.2, 3.3], 'sum', 'console render'];
const result8 = run(example8);
console.log('Example 8:', result8.stack[0]);

const example9 = [[1,2,'a'], 'sum'];
const result9 = run(example9);
console.log('Example 9:', result9);
}

export function text_processor(text) {
    if (!text || text.trim() === "") {
      return [];
    }

    // If want to make new lines semantic, this is where to do it.
    let newline_stripped = text.replace(/(\r\n|\n|\r)/gm, ' ')
  
    // Could be combined, but just do independent gathers
    let words = newline_stripped.split(" ").filter(element => element !== "");
    // Gather is definitions
    let a = is_definition(words)
    // Gather known phrases
    let b = combine_phrases(a)
    // Expand / replace from "is" definitions
    let c = expand_definitions(b)
    // Gather numbers
    let d = convert_numbers_to_arrays(c)
 
    return d
}

const phrases = {
  // console render
  'console': {
    'render': 'console render' 
    },
    // browser tab render
  'browser' : {
      'tab': {
        'render': 'browser tab render'
      }
  }
}

function combine_phrases(words) {  
    const result = [];
    let i = 0;
  
    while (i < words.length) {
      let tre = phrases
      let j = i
      while ((tre[words[j]] !== undefined) && (typeof tre[words[j]] !== 'string')) {
        tre = tre[words[j]]
        j++
      }
      if (typeof tre[words[j]] === 'string') {
        result.push(tre[words[j]])
        i = j
      } else {
        result.push(words[i])
      }
      i++;
    }
    return result;
}

// TODO Multiple word definitions (new line structure?)
// TODO Check for name conflict with is
// TODO Pass in bracketing words (is ordering a problem?) (multilanguage support)

function is_definition(words) {
  let in_is = false

  const result = [];
  let i = 0;

  while (i < words.length) {
    if (in_is) {
      if (words[i] === "period") {
        in_is = false
        result.pop()
      } else if (words[i][words[i].length -1] === ".") {
        // strip period
        let w = words[i].slice(0, -1);
        if (w.length > 0) {
          definitions[result[result.length -1]].push(w)
        }
        in_is = false
        result.pop()
      } else {
        definitions[result[result.length -1]].push(words[i])
      }
    } else if (words[i] === "is") {
      if (result.length > 0) {
        if (typeof result[result.length - 1] === 'string') {
          in_is = true
          definitions[result[result.length - 1]] = []
        }
      }
    } else {
      result.push(words[i])
    }
    i++
  }
  return result
}

function expand_definitions_once(words) {
  const result = [];

  for (const word of words) {
    if (definitions.hasOwnProperty(word)) {
      // If the word exists as a key in the substitutionMap,
      // spread the corresponding array into the result.
      result.push(...definitions[word]);
    } else {
      // Otherwise, just push the original word.
      result.push(word);
    }
  }
  return result;
}

// Expand 3 times, maximum. Heristic.
function expand_definitions(words) {
  const a = expand_definitions_once(words)
  const b = expand_definitions_once(a)
  const c = expand_definitions_once(b)
  return c
}

function test_combine_phrases() {  
  // Example Usage:
  const wordArray1 = ["some", "random", "words", "console", "render", "more", "words"];
  const result1 = combine_phrases(wordArray1);
  console.log(result1);
  
  const wordArray2 = ["start", "browser", "tab", "render", "end"];
  const result2 = combine_phrases(wordArray2);
  console.log(result2);
  
  const wordArray3 = ["start", "render", "to", "console", "middle", "render", "to", "new", "browser", "tab", "end"];
  const result3 = combine_phrases(wordArray3);
  console.log(result3);
  
  const wordArray4 = ["nothing","to","find"];
  const result4 = combine_phrases(wordArray4);
  console.log(result4);
  
  const wordArray5 = ["render","to","console","not","render","to","new","browser","tab"];
  const result5 = combine_phrases(wordArray5);
  console.log(result5);
  
  const wordArray6 = ["render","to","console","render","to","new","browser","tab","and","more"];
  const result6 = combine_phrases(wordArray6);
  console.log(result6);
}
