// TODO Return as a single list of offset to code, operation, and result (stack, errors)
// TODO Put error on stack ???
export function run(parsed) {
  const stack = [];
  const errors = [];

  const one_tensor = tf.scalar(1.0, 'int32');

  // TODO Inline document
  // TODO Extract pop as helper function
  // TODO Change to pop-on-success
  // TODO Create error function
  // TODO Rename all going_aways to name of parameter
  // TODO Delay tensorfication until tensor needed for inline arrays
  // TODO Check that tensors on stack

  // For now, all int32 data.  
  const commands = {
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
    'render to console': (stack, i, item) => {
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
    'render to new browser tab': (stack, i, item) => {
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

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
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
const example1 = [[1, 2, 3], 'sum', 'render to console'];
const result1 = run(example1);
console.log('Example 1:', result1.errors);

const example2 = [[1, 2, 3], [4, 5, 6], 'sum', 'render to console'];
const result2 = run(example2);
console.log('Example 2:', result2.errors);

const example3 = [[1, 2, 3], 'invalid command'];
const result3 = run(example3);
console.log('Example 3:', result3.errors);

const example4 = [[1, 2, 3], 'sum', 'sum', 'render to console'];
const result4 = run(example4);
console.log('Example 4:', result4.errors);

const example5 = ['sum'];
const result5 = run(example5);
console.log('Example 5:', result5.errors);

const example6 = [[1,2,3], [4,5,6], 'render to console', 'render to new browser tab', 'sum', 'render to console'];
const result6 = run(example6);
//console.log('Example 6:', result6);

const example7 = [[1,2,3], 55, 'sum'];
const result7 = run(example7);
console.log('Example 7:', result7);

const example8 = [[1.1, 2.2, 3.3], 'sum', 'render to console'];
const result8 = run(example8);
console.log('Example 8:', result8.stack[0]);

const example9 = [[1,2,'a'], 'sum'];
const result9 = run(example9);
console.log('Example 9:', result9);
}

export function parse(a_scentence) {
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
    let phrases = find_phrases(words)
    let result = convert_numbers_to_arrays(phrases)
    return result
}

function find_phrases(wordArray) {
    const phrasesToFind = [
      ["render", "to", "console"],
      ["render", "to", "new", "browser", "tab"],
    ];
  
    const result = [];
    let i = 0;
  
    while (i < wordArray.length) {
      let matchFound = false;
  
      for (const phrase of phrasesToFind) {
        const phraseLen = phrase.length;
        if (i + phraseLen <= wordArray.length && wordArray.slice(i, i + phraseLen).every((val, index) => val === phrase[index])) {
          result.push(phrase.join(" "));
          i += phraseLen;
          matchFound = true;
          break;
        }
      }
  
      if (!matchFound) {
        result.push(wordArray[i]);
        i++;
      }
    }
  
    return result;
  }

function test_find_renders() {  
  // Example Usage:
  const wordArray1 = ["some", "random", "words", "render", "to", "console", "more", "words"];
  const result1 = find_renders(wordArray1);
  console.log(result1);
  
  const wordArray2 = ["start", "render", "to", "new", "browser", "tab", "end"];
  const result2 = find_renders(wordArray2);
  console.log(result2);
  
  const wordArray3 = ["start", "render", "to", "console", "middle", "render", "to", "new", "browser", "tab", "end"];
  const result3 = find_renders(wordArray3);
  console.log(result3);
  
  const wordArray4 = ["nothing","to","find"];
  const result4 = find_renders(wordArray4);
  console.log(result4);
  
  const wordArray5 = ["render","to","console","not","render","to","new","browser","tab"];
  const result5 = find_renders(wordArray5);
  console.log(result5);
  
  const wordArray6 = ["render","to","console","render","to","new","browser","tab","and","more"];
  const result6 = find_renders(wordArray6);
  console.log(result6);
}

function convert_numbers_to_arrays(words) {
    const numberWords = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
      'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
      'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40,
      'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
      'hundred': 100, 'thousand': 1000, 'million': 1000000, 'billion': 1000000000
    };
  
    const result = [];
    let tempNumber = [];
  
    for (const word of words) {
      const num = parseInt(word);
      const writtenNum = numberWords[word.toLowerCase()];
  
      if (!isNaN(num)) {
        tempNumber.push(num);
      } else if (writtenNum !== undefined) {
        tempNumber.push(writtenNum);
      } else {
        if (tempNumber.length) {
          result.push(tempNumber);
          tempNumber = [];
        }
        result.push(word);
      }
    }
  
    if (tempNumber.length) {
      result.push(tempNumber);
    }
  
    return result;
  }

function test_convert_numbers_to_arrays() {
  // Example usage:
  const words1 = ['one', 'two', 'three', 'apple', 'four', '5', 'six', '7', 'eight', 'nine', 'ten', 'hello', '11', '12', 'world','13'];
  const words2 = ['apple', '1', 'two', '3', 'four', 'banana'];
  const words3 = ['one', 'apple', 'two', 'banana', 'three'];
  const words4 = ['1', '2', '3', 'apple', '4', '5', 'banana', '6'];
  const words5 = ['one', '1', 'two', '2', 'three', '3', 'apple'];
  const words6 = ['apple','one', '1'];
  const words7 = ['1','one','apple'];
  const words8 = ['1','2','one','two', '3','4','apple'];
  const words9 = ['one','two','three','four','five','six','seven','eight','nine','ten'];
  const words10 = ['1','2','3','4','5','6','7','8','9','10'];
  const words11 = ['one'];
  const words12 = ['1'];
  const words13 = ['apple','1','apple'];
  
  console.log(convert_numbers_to_arrays(words1));
  console.log(convert_numbers_to_arrays(words2));
  console.log(convert_numbers_to_arrays(words3));
  console.log(convert_numbers_to_arrays(words4));
  console.log(convert_numbers_to_arrays(words5));
  console.log(convert_numbers_to_arrays(words6));
  console.log(convert_numbers_to_arrays(words7));
  console.log(convert_numbers_to_arrays(words8));
  console.log(convert_numbers_to_arrays(words9));
  console.log(convert_numbers_to_arrays(words10));
  console.log(convert_numbers_to_arrays(words11));
  console.log(convert_numbers_to_arrays(words12));
  console.log(convert_numbers_to_arrays(words13));
}
