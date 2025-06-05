// operation to


/**
 * @file String Searcher Function (First-Word Lookup)
 * @description Provides a factory function to create specialized string searchers,
 * using a lookup table indexed by the first word of a phrase.
 * Assumes all input patterns are plain strings and searches are case-insensitive.
 * This version finds all occurrences of any pattern in the target string.
 */

/**
 * Creates a function that searches for phrases within a given target string,
 * leveraging a lookup table indexed by the first word of each phrase.
 * All searches are case-insensitive.
 *
 * This is an immutable unit as it does not modify the input array and the returned
 * function is a pure function (given the same input, it will always return the same output).
 *
 * @param {string[]} originalArray - The array of phrases (e.g., 'apple', 'hello world', 'done').
 * These are assumed to be plain strings, not regex patterns.
 * @returns {function(string): Array<{index: number, location: number, length: number}>}
 * A function that takes a target string and returns an array of objects.
 * Each object contains:
 * - `index`: The index of the matched phrase in the original array.
 * - `location`: The starting character index of the match within the target string.
 * - `length`: The character length of the matched substring.
 * Returns an empty array if no phrases are found.
 */
function createStringSearcher(originalArray) {
    // Build the lookup table (phraseMap).
    // Keys: lowercase first word of a phrase.
    // Values: Array of objects, each containing the full lowercase phrase,
    //         its original index, and its original character length.
    const phraseMap = new Map(); // Map<string, Array<{ lowerPhrase: string, originalIndex: number, originalLength: number }>>

    originalArray.forEach((phrase, index) => {
        const lowerPhrase = phrase.toLowerCase();
        const words = lowerPhrase.split(' '); // Split by space to get the first word
        if (words.length > 0 && words[0] !== '') { // Ensure there's at least one non-empty word
            const firstWord = words[0];
            if (!phraseMap.has(firstWord)) {
                phraseMap.set(firstWord, []);
            }
            phraseMap.get(firstWord).push({
                lowerPhrase: lowerPhrase,
                originalIndex: index,
                originalLength: phrase.length // Store the original length for the result
            });
        }
    });

    /**
     * Searches for all occurrences of any phrase from the `originalArray` within the `targetString`.
     *
     * @param {string} targetString - The string to search within.
     * @returns {Array<{index: number, location: number, length: number}>}
     * An array of match objects, or an empty array if no phrases are found.
     */
    return function(targetString) {
        const allMatches = [];
        const lowerTargetString = targetString.toLowerCase();

        // Regular expression to find words and their indices in the target string.
        // \b matches a word boundary. \w+ matches one or more word characters.
        const wordRegex = /\b(\w+)\b/g;
        let wordMatch;

        // Iterate through the target string, identifying each word.
        while ((wordMatch = wordRegex.exec(lowerTargetString)) !== null) {
            const currentWord = wordMatch[1]; // The matched word itself
            const wordStartIndex = wordMatch.index; // The character index of the word's start

            // Check if this word is a key in our phraseMap (first-word lookup)
            if (phraseMap.has(currentWord)) {
                const candidatePhrases = phraseMap.get(currentWord);

                // For each phrase that starts with the current word:
                for (const candidate of candidatePhrases) {
                    // Check if the substring of lowerTargetString, starting from wordStartIndex,
                    // actually begins with the full candidate phrase.
                    if (lowerTargetString.startsWith(candidate.lowerPhrase, wordStartIndex)) {
                        allMatches.push({
                            index: candidate.originalIndex,
                            location: wordStartIndex,
                            length: candidate.originalLength
                        });
                    }
                }
            }
        }
        return allMatches;
    };
}
