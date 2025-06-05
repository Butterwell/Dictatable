/*
* **Literal Characters:** Just say the character. For example, to match "cat", you would say "c a t".
* **Quantifiers:** Use descriptive words instead of symbols.
    * `*` (zero or more): "zero or more of"
    * `+` (one or more): "one or more of"
    * `?` (zero or one): "optional" or "zero or one of"
    * `{n}` (exactly n): "exactly \[number] of"
    * `{n,}` (n or more): "\[number] or more of"
    * `{n,m}` (between n and m): "between \[number] and \[number] of"
* **Character Classes:** Use words to represent common sets.
    * `.` (any character): "any character" or "anything"
    * `\d` (digit): "digit" or "number"
    * `\w` (word character): "word character" (could be refined to "letter or number or underscore")
    * `\s` (whitespace): "whitespace" or "space"
    * `[abc]` (any of these): "either a or b or c"
    * `[^abc]` (none of these): "not a or b or c"
    * `[a-z]` (range): "letter from a to z"
    * `[0-9]` (range): "number from zero to nine"
* **Anchors:** Use clear positional words.
    * `^` (start of string): "start of string" or "beginning"
    * `$` (end of string): "end of string" or "finish"
    * `\b` (word boundary): "word boundary"
* **Grouping and Alternation:** Use explicit keywords.
    * `(...)` (grouping): "group" followed by the content of the group, then "end group"
    * `|` (alternation): "or"

**Example Translations:**

Let's see how some common regex patterns might translate:

* `/ca*t/`: "c a zero or more of a t"
* `/colou?r/`: "c o l o u optional r"
* `/\d{3}-\d{2}-\d{4}/`: "digit exactly three of hyphen digit exactly two of hyphen digit exactly four of"
* `/a|b/`: "a or b"
* `/(hello world)/`: "group hello space world end group"
* `/^[A-Z]+$/`: "start of string one or more of letter from A to Z end of string"
* `/\s+/`: "one or more of whitespace"
* `/[aeiou]/`: "either a or e or i or o or u"
* `/[^0-9]/`: "not digit" or "not number"


keywords are this or that or the or other or thing period

tokens are keywords or numbers

"Assemble" regular expressions much like Dictatable

"are" is a string operator / specifier

Numbers (integers) are of unspecified width until data reaches them.

grid is a ten by ten zeros array.

Naming data: "is a"
Naming functions: "is"

Assume grouping. ---

*/

/**
 * Builds a regular expression from a list of keywords, matching only whole words or phrases,
 * including the pattern "number by number".
 *
 * This function takes an array of keywords and constructs a RegExp that
 * matches any of those keywords or phrases as whole entities.  It also
 * specifically handles phrases like "number by number" (e.g., "10 by 10", "5 by 5").
 *
 * @param {string[]} keywords An array of keywords.
 * @returns {RegExp} A regular expression that matches the keywords as whole words or phrases,
 * including "number by number".
 * Returns null if the input array is empty or invalid.
 *
 * @example:
 * // Basic usage
 * const keywords = ['apple', 'banana', 'cherry'];
 * const regex = buildKeywordRegex(keywords); //  /\bapple\b|\bbanana\b|\bcherry\b/
 *
 * // With space-separated phrases
 * const keywordsWithSpaces = ['red apple', 'yellow banana', 'green cherry'];
 * const regexWithSpaces = buildKeywordRegex(keywordsWithSpaces); // /\bred apple\b|\byellow banana\b|\bgreen cherry\b/
 *
 * // With "number by number" phrases
 * const keywordsWithNumbers = ['10 by 10', '5 by 5', 'number by number'];
 * const regexWithNumbers = buildKeywordRegex(keywordsWithNumbers); // /\b10 by 10\b|\b5 by 5\b|\bnumber by number\b/
 *
 * // Combined
 * const allKeywords = ['apple', '10 by 10', 'red apple', 'number by number'];
 * const allRegex = buildKeywordRegex(allKeywords);
 */

function buildKeywordRegex(keywords) {
    // Check if the input is valid
    if (!Array.isArray(keywords) || keywords.length === 0) {
        return null; // Return null for empty or invalid input
    }

    // 1. Construct the regex string with word boundaries, handling spaces and "number by number"
    const regexString = keywords.map(phrase => {
        //  Handle "number by number" generically
        if (phrase === 'number by number') {
            return '\\b\\d+ by \\d+\\b'; // Match one or more digits
        }
        return `\\b${phrase}\\b`;
    }).join('|');

    // 2. Create the RegExp object
    try {
        const regex = new RegExp(regexString, 'g'); // 'g' for global matching
        return regex;
    } catch (e) {
        // Handle potential errors in regex construction (e.g., invalid syntax)
        console.error("Error creating regex:", e);
        return null; // Return null to indicate failure
    }
}

export function test_regex() {
    
}
