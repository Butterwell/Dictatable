// TODO Return as a single list of offset to code, operation, and result (stack, errors)

import { convert_numbers_to_arrays } from "./convert_numbers_to_arrays.js";

// TODO Put error on stack ???
export function run(parsed) {
  const stack = [];
  const errors = [];

  const one_tensor = tf.scalar(1.0, 'int32');

  // TODO Extract pop as helper function
  // TODO Change to pop-on-success
  // TODO Create error function
  // TODO Rename all going_aways to name of parameter
  // TODO Delay tensorfication until tensor needed for inline arrays

  // For now, all int32 data.

  const commands = {
    'peek': (stack, i, item) => {
      const spec = stack.pop()
      const count = (spec.rank === 0 ? [spec.arraySync()] : spec.arraySync())
      if (stack.length >= count) {
        const tensor = stack[stack.length - count].clone()
        stack.push(tensor)
        spec.dispose()
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'peek needs some tensors on stack',
        });
      }
    },
    'and': (stack, i, item) => {
      if (stack.length > 1) {
        const b = stack.pop()
        const a = stack.pop()
        const tensor = tf.logicalAnd(a, b)
        a.dispose()
        b.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'and needs two tensors on stack',
        });
      }
    },
    'or': (stack, i, item) => {
      if (stack.length > 1) {
        const b = stack.pop()
        const a = stack.pop()
        const tensor = tf.logicalOr(a, b)
        a.dispose()
        b.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'or needs two tensors on stack',
        });
      }
    },
    'equal': (stack, i, item) => {
      if (stack.length > 1) {
        const b = stack.pop()
        const a = stack.pop()
        const tensor = tf.equal(a, b)
        a.dispose()
        b.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'equal needs two tensors on stack',
        });
      }
    },
    // https://js.tensorflow.org/api/latest/#conv2d
    // "Narrowed" to 2d for Game of Life use case
    'convolution': (stack, i, item) => {
      if (stack.length > 1) {
        // Force to float because int32 not supported
        const filter = stack[stack.length - 1].toFloat()
        const x = stack[stack.length - 2].toFloat()
        if ((filter.rank === 4) && (x.rank === 3)) {
          // Only float32 is supported for x
          const y = tf.conv2d(x, filter, 1, 'same')
          const d1 = stack.pop()
          const d2 = stack.pop()
          d1.dispose()
          d2.dispose()
          x.dispose()
          filter.dispose()
          stack.push(y)
        } else {
          console.log(filter.rank, x.rank)
        }
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'convolution needs two tensors on stack',
        });
      }
    },
    'duplicate': (stack, i, item) => {
      if (stack.length > 0) {
        stack.push(tf.clone(stack[stack.length - 1]))
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'nothing on stack to duplicate',
        });
      }
    },
    'flip': (stack, i, item) => {
      if (stack.length > 1) {
        let temp = stack[stack.length - 1]
        stack[stack.length - 1] = stack[stack.length - 2]
        stack[stack.length - 2] = temp
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'can not flip, less than two tensors on stack',
        });
      }
    },
    'subtract': (stack, i, item) => {
      if (stack.length > 1) {
        const b = stack.pop()
        const a = stack.pop()
        const tensor = tf.sub(a, b)
        stack.push(tensor)
        a.dispose()
        b.dispose()
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'can not subtract, less than two tensors on stack',
        });
      }
    },
    'add': (stack, i, item) => {
      if (stack.length > 1) {
        const b = stack.pop()
        const a = stack.pop()
        const tensor = tf.add(a, b)
        stack.push(tensor)
        a.dispose()
        b.dispose()
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'can not add, less than two tensors on stack',
        });
      }
    },
    'concat': (stack, i, item) => {
      if (stack.length > 1) {
        const going_away_b = stack.pop()
        const going_away_a = stack.pop()
        const tensor = tf.concat([going_away_a, going_away_b], 0)
        going_away_a.dispose()
        going_away_b.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'can not concat, less than two tensors on stack',
        });
      }
    },
    'pop': (stack, i, item) => {
      if (stack.length > 0) {
        const going_away = stack.pop()
        going_away.dispose()
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'nothing on stack to pop',
        });
      }
    },
    'not': (stack, i, item) => {
      if (stack.length > 0) {
        const going_away = stack.pop()
        const tensor = tf.sub(one_tensor, going_away)
        going_away.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'nothing on stack to not',
        });
      }
    },
    'sign': (stack, i, item) => {
      if (stack.length > 0) {
        const going_away = stack.pop()
        const tensor = tf.math.sign(going_away)
        going_away.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'nothing on stack to get sign of',
        });
      }
    },
    'expand': (stack, i, item) => {
      if (stack.length > 0) {
        const going_away = stack.pop()
        const tensor = going_away.expandDims(0)
        going_away.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'nothing on stack to expand of',
        });
      }
    },
    'ones': (stack, i, item) => {
      if (stack.length > 0) {
        const spec = stack.pop()
        const shape = (spec.rank === 0 ? [spec.arraySync()] : spec.arraySync())
        const tensor = tf.ones(shape, 'int32')
        spec.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'nothing on stack to generate ones from',
        });
      }
    },
    'zeros': (stack, i, item) => {
      if (stack.length > 0) {
        const spec = stack.pop()
        const shape = (spec.rank === 0 ? [spec.arraySync()] : spec.arraySync())
        const tensor = tf.zeros(shape, 'int32')
        spec.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'nothing on stack to generate zeros from',
        });
      }
    },
    // Array of random units
    'random': (stack, i, item) => {
      if (stack.length > 0) {
        const spec = stack.pop()
        const shape = (spec.rank === 0 ? [spec.arraySync()] : spec.arraySync())
        const tensor = tf.randomUniform(shape, 0, 1)
        spec.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'nothing on stack to generate zeros from',
        });
      }
    },
    'round': (stack, i, item) => {
      if (stack.length > 0) {
        const old = stack.pop()
        const tensor = old.round()
        old.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'nothing on stack to generate randoms from',
        });
      }
    },
    'range': (stack, i, item) => {
      if (stack.length > 0) {
        const going_away = stack.pop()
        if (going_away.rank === 0) {
          console.log("rank 0")
          const tensor = tf.range(0, going_away.arraySync(), 1, 'int32')
          going_away.dispose()
          stack.push(tensor)  
        } else if (going_away.rank === 1) {
          console.log("rank 1")
          // Won't happen on input
          if (going_away.size === 1) {
            console.log("size 1")
            const to = going_away.arraySync()[0];
            const tensor = tf.range(0, to)
            going_away.dispose()
            stack.push(tensor)
          } else if (going_away.size === 2) {
            const rows = going_away.arraySync()[0]
            const cols = going_away.arraySync()[1]
            const rowsTensor = tf.range(0,rows).expandDims(1).tile([1,cols]);
            const colsTensor = tf.range(0,cols).expandDims(0).tile([rows,1]);
            const tensor = tf.stack([rowsTensor, colsTensor], -1); // 2 x 3 or 3 x 2: -1 or 0
            going_away.dispose()
            stack.push(tensor)
          } else {
            errors.push({
              index: i,
              text: item,
              message: 'range operates on tensor of rank 1 with sizes 1 and 2 only',  
            })  
          }
         } else {
          errors.push({
            index: i,
            text: item,
            message: 'range operates on tensor of rank 0 or 1',  
          })
         }
        tf.range(0, )
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'nothing on stack to generate range from',
        });
      }
    },
    // to 1d
    'flatten': (stack, i, item) => {
      if (stack.length > 0) {
        const going_away = stack.pop()
        const tensor = going_away.reshape([-1])
        going_away.dispose()
        stack.push(tensor)
      } else {
        errors.push({
          index: i,
          text: item,
          message: 'nothing on stack to expand of',
        });
      }
    },
    'rotate': (stack, i, item) => {
      if (stack.length > 1) {
        const going_away_count = stack.pop()
        if (going_away_count.rank === 0) {
          const going_away_array = stack.pop()
          const length = going_away_array.shape[0]
          // Negatives work too
          let k = tf.scalar(tf.mod(going_away_count, length).arraySync(),'int32');        
          if (k === 0) {
            stack.push(going_away_array)
          } else {
            const indices = tf.range(0, length, 1, 'int32');
            const length_too = tf.scalar(length, 'int32');
            const rotatedIndices = tf.mod(tf.add(indices, k), length_too); 
            const tensor = tf.gather(going_away_array, rotatedIndices);
            going_away_count.dispose()
            going_away_array.dispose()
            indices.dispose()
            length_too.dispose()
            rotatedIndices.dispose()
            stack.push(tensor)  
          }
          k.dispose()
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
    },
    'sum': (stack, i, item) => {
      if (stack.length > 0) {
        const tensor = stack.pop();
        try {
          if (tensor.dtype === 'int32' || tensor.dtype === 'float32') {
            const sumTensor = tensor.sum().expandDims(0)
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
    },
    'console render': (stack, i, item) => {
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
    },
    'browser tab render': (stack, i, item) => {
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
    },
  };

  let in_is = false
  let in_repeat_block = false

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    // Deal with is ... period
    if (item === "is") {
      if (stack.length > 0) {
        if (Array.isArray(stack[stack.length - 1])) {
          if (typeof stack[stack.length - 1][0] === 'string') {
            in_is = true
          }
        }
      }
    }
    if (in_is) {
      stack[stack.length - 1].push(item)
      if (item === "period" || item[item.length -1] === ".") {
        in_is = false
        const definition = stack.pop()
        // TODO Add definition to definitions
      }
      continue
    }
    // repeat ... every n seconds
    // A repeat block is a lambda (like an "is")
    if (item === "repeat") {
      in_repeat_block = true
    }
    if (item === "end") {
      in_repeat_block = false
    }
    // TODO If there is a string array on the stack lookup in definitions
    if (Array.isArray(item)) {
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
      const command = commands[item.toLowerCase()];
      if (command) {
        command(stack, i, item);
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

export function gather(a_scentence) {
    /**
     * Parses a sentence into an array of words, using spaces as delimiters.
     *
     * @param {string} a_scentence - The sentence to parse.
     * @returns {string[]} An array of words. If the sentence is empty or contains only spaces,
     * an empty array is returned.
     */
    if (!a_scentence || a_scentence.trim() === "") {
      return [];
    }

    let newline_stripped = a_scentence.replace(/(\r\n|\n|\r)/gm, ' ')
  
    let words = newline_stripped.split(" ").filter(element => element !== "");
    let phrases = combine_phrases(words)
    let result = convert_numbers_to_arrays(phrases)
    return result
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
