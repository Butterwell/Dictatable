export function convert_numbers_to_arrays(words) {
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
  const words1 = ['one', 'two', 'three', 'apple', 'four', '5', 'six', '7', 'eight', 'nine', 'ten', 'hello', '11', '12', 'world', '13'];
  const words2 = ['apple', '1', 'two', '3', 'four', 'banana'];
  const words3 = ['one', 'apple', 'two', 'banana', 'three'];
  const words4 = ['1', '2', '3', 'apple', '4', '5', 'banana', '6'];
  const words5 = ['one', '1', 'two', '2', 'three', '3', 'apple'];
  const words6 = ['apple', 'one', '1'];
  const words7 = ['1', 'one', 'apple'];
  const words8 = ['1', '2', 'one', 'two', '3', '4', 'apple'];
  const words9 = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const words10 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const words11 = ['one'];
  const words12 = ['1'];
  const words13 = ['apple', '1', 'apple'];

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
