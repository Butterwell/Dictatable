# Dictatable

Dictatable is an array and stack oriented language that is designed to be dictatable.

As you might guess, the primary goal is to make a useful language that is dictatable on a smart phone.

To that end, there will be a series of informal experiments (perhaps formal experiments later) with the intent to make the the language easier to learn and use. To create a language with "low floors and high ceilings".

At that end, make Dictatable a delightful tasty efficient language with especially good mouth feel.

## Installation

Clone this repo and load the top level directory as an unpacked browser extension (Chromium based browsers).

OR

Go to [Dictatable Online](https://butterwell.github.io/Dictatable)

In both cases, (as of now) there is one "notebook", one source, which is persisted to localStorage. If you want two sessions, do both. They are saved separately. Three? Run a webserver as well. ;)

## Means

The following are some ways, some means, some likely specifications, a wishlist, for the language.

### Usability Wishes
- Don't waste my time: sub-framerate (at 60 frames per second) compilation and updates, reactive
- At hand: runs in a browser page
- Obvious: shows what it's done
- Readable: notation is words, linear, without brackets or other punctuation
- Editable: meta words that modify code
- Minimize cognitive load: use words (assumed) and other methods, to be discovered

### Other Wishes
- Immediate, reactive, result visibility (like spreadsheets)
- Tables (and arrays) as basic unit
- Multi-lingual: translatable into other languages
- Multi-domain: support jargon
- Supports synonyms, but
- Minimize ambiguity (use less-ambiguous terms, unlike natural language, single meaning)
- Automatic instrumentation and easy observation
- Line oriented, mostly tacit
- Data stack
- Explicit support and validation for pure and total functions. And the core is only pure and total functions.
- Data stack and array/table oriented (with dataflow diagrams and analysis as a bonus)
- Input and output language constructs physically and logically separated
- Dispatch only occurs at the top level
- Arrow embracing
- Explanations of the what, how, and why of computations built in
- Explicit domain and range of the language in the language
- Supports incremental refinement (top-down)
- Supports function assembly (bottom-up)
- Supports database record composition (middle-out)
- Separate the method of calculation from the intent of the calculation (naming)
- Strive for minimal headspace
- Expand supported operations (keywords and phrases) into various domains
- Library support
- Multipule documents

## Implementation Notes

The computational engine is TensorFlow.js. The computational engine will likely become a hybrid later (lmuch later).