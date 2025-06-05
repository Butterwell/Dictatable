import { convert_numbers_to_arrays, convert_text_numbers_to_digits } from "./convert_numbers_to_arrays.js";

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

import { now } from './dom.js'
import { peek, and, or, equal, convolution, duplicate, flip, subtract, add, concat, pop, not, sign, expand, ones, zeros, random, round, range, flatten, rotate, sum } from "./functions.js";

// 100 every Update repeat
// Place every specifications into repeats array
function every_repeat_phrase(words, i, stack, repeats) {
  if (words[i] !== "every") {
    console.log("every fail")
    return i;
  }

  if (stack.length === 0) {
    console.log("every fail: nothing on stack")
    return i;
  }

  // 
  let every_tensor = stack.pop()
  let every = every_tensor.arraySync()
  every_tensor.dispose()

  let code = []

  i++ // drop "every"

  let repeat = { code, every }

  while ((i < words.length) && (words[i] !== "repeat")) {
    repeat.code.push(words[i])
    i++
  }
  
  repeat.next = now() + every

  repeats.push(repeat)

  return i
}

export function run(repeats, stack, parsed) {
  const errors = [];

  // TODO Make stack-height errors part of text_processor (as a pass)
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (item === "every") {
      i = every_repeat_phrase(parsed, i, stack, repeats)
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

export function text_processor(text) {
    if (!text || text.trim() === "") {
      return [];
    }

    let digitfied = convert_text_numbers_to_digits(text)

    // If want to make new lines semantic, this is where to do it.
    let newline_stripped = digitfied.replace(/(\r\n|\n|\r)/gm, ' ')
  
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

// every 200 milliseconds
// every point two seconds
// every tick == every one sixtith of a second
// update every 200 milliseconds
// Imparative phrases
// Linear / stack based
// add top two
// subtract top from second from top
// subtract second from top from top-

// update on input
// update on fetch

// Every line 

// With grid ...
// Update grid by
// every 200 milliseconds grid update

// inline render grid
// use grid as input to render

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
          definitions[result[result.length -1].toLowerCase()].push(w)
        }
        in_is = false
        result.pop()
      } else {
        definitions[result[result.length -1].toLowerCase()].push(words[i])
      }
    } else if (words[i] === "is") {
      if (result.length > 0) {
        if (typeof result[result.length - 1] === 'string') {
          in_is = true
          definitions[result[result.length - 1].toLowerCase()] = []
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
    if (definitions.hasOwnProperty(word.toLowerCase())) {
      // If the word exists as a key in the substitutionMap,
      // spread the corresponding array into the result.
      result.push(...definitions[word.toLowerCase()]);
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