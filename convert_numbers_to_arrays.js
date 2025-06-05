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

// These functions convert text to numbers 
function textToNumber(text) {
  const numberWords = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4,
    "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
    "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
    "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17,
    "eighteen": 18, "nineteen": 19, "twenty": 20, "thirty": 30,
    "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70,
    "eighty": 80, "ninety": 90, "hundred": 100, "thousand": 1000,
    "million": 1000000, "billion": 1000000000, "trillion": 1000000000000
  };

  const parts = text.toLowerCase().split(/[\s-]+/);
  let number = 0;
  let currentSubNumber = 0;

  for (const part of parts) {
    if (numberWords.hasOwnProperty(part)) {
      const value = numberWords[part];

      if (value === 100) {
        currentSubNumber *= value;
      } else if (value >= 1000) {
        number += currentSubNumber * value;
        currentSubNumber = 0;
      } else {
        currentSubNumber += value;
      }
    } else if (!isNaN(parseInt(part))) {
      currentSubNumber += parseInt(part);
    }
  }

  return number + currentSubNumber;
}

export function convert_text_numbers_to_digits(inputText) {
  const mixedNumberRegex = /(\b\d+\s+(billion|million|thousand|hundred)\b)|(\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)([\s-]*?(hundred|thousand|million|billion|trillion|and|\b))*?\b)/gi;
  let result = inputText;
  let match;

  while ((match = mixedNumberRegex.exec(inputText)) !== null) {
    const fullMatch = match[0];
    const convertedNumber = textToNumber(fullMatch);
    result = result.replace(fullMatch, convertedNumber);
    // Reset the lastIndex to avoid infinite loops
    mixedNumberRegex.lastIndex = inputText.indexOf(fullMatch, mixedNumberRegex.lastIndex - fullMatch.length) + fullMatch.length;
  }

  return result;
}

function test_mixed() {
  // Examples
  const mixedText1 = "The debt is 22 billion dollars.";
  const convertedMixedText1 = convertMixedTextWithNumbers(mixedText1);
  console.log(convertedMixedText1); // Output: The debt is 22000000000 dollars.

  const mixedText2 = "We have five point two million users and thirty new ones.";
  const convertedMixedText2 = convertMixedTextWithNumbers(mixedText2);
  console.log(convertedMixedText2); // Output: We have 5200000 users and 30 new ones.

  const mixedText3 = "It costs twelve thousand three hundred and forty-five dollars.";
  const convertedMixedText3 = convertMixedTextWithNumbers(mixedText3);
  console.log(convertedMixedText3); // Output: It costs 12345 dollars.

  const mixedText4 = "The number is one two three."; // Example of individual digits - not typically treated as a single number
  const convertedMixedText4 = convertMixedTextWithNumbers(mixedText4);
  console.log(convertedMixedText4); // Output: The number is 1 2 3.

  const mixedText5 = "They have 100 million subscribers.";
  const convertedMixedText5 = convertMixedTextWithNumbers(mixedText5);
  console.log(convertedMixedText5); // Output: They have 100000000 subscribers.
}
