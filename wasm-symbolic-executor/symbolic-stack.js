// symbolic-stack.js

/**
 * @typedef {import('./symbolic-value.js').SymbolicValue} SymbolicValue
 */

/**
 * @typedef {SymbolicValue[]} SymbolicWasmStackItems - Represents the items on the WASM operand stack.
 */

/**
 * Creates a new empty symbolic WASM stack.
 * @returns {SymbolicWasmStackItems} An empty array representing the stack.
 */
export function createSymbolicWasmStack() {
    return [];
}

/**
 * Pushes a symbolic value onto the stack.
 * Returns a new array representing the updated stack.
 *
 * @param {SymbolicWasmStackItems} symbolicStack - The current stack items array.
 * @param {SymbolicValue} value - The symbolic value to push.
 * @returns {SymbolicWasmStackItems} A new array with the value pushed.
 */
export function push(symbolicStack, value) {
    return [...symbolicStack, value]; // Returns a new array
}

/**
 * Pops a symbolic value from the stack.
 * Returns an object containing the popped value and a new array representing the updated stack.
 *
 * @param {SymbolicWasmStackItems} symbolicStack - The current stack items array.
 * @returns {{value: SymbolicValue, newStack: SymbolicWasmStackItems}} An object with the popped value and the new stack.
 * @throws {Error} If the stack is empty.
 */
export function pop(symbolicStack) {
    if (symbolicStack.length === 0) {
        throw new Error("Attempted to pop from an empty symbolic stack.");
    }
    const value = symbolicStack[symbolicStack.length - 1];
    const newStack = symbolicStack.slice(0, -1); // Returns a new array without the last element
    return { value, newStack };
}

/**
 * Peeks at a value on the stack without removing it.
 *
 * @param {SymbolicWasmStackItems} symbolicStack - The current stack items array.
 * @param {number} [offset=0] - The offset from the top of the stack (0 for top).
 * @returns {SymbolicValue} The symbolic value at the specified offset.
 * @throws {Error} If the offset is out of bounds.
 */
export function peek(symbolicStack, offset = 0) {
    if (symbolicStack.length <= offset) {
        throw new Error(`Stack peek out of bounds: length ${symbolicStack.length}, offset ${offset}`);
    }
    return symbolicStack[symbolicStack.length - 1 - offset];
}

/**
 * Creates a clone of the symbolic stack items.
 * Since SymbolicValue objects are immutable, a shallow copy of the array is sufficient.
 *
 * @param {SymbolicWasmStackItems} symbolicStack - The stack items array to clone.
 * @returns {SymbolicWasmStackItems} A new array representing the cloned stack.
 */
export function cloneSymbolicWasmStack(symbolicStack) {
    return [...symbolicStack]; // Returns a new array
}

/**
 * Returns the current size of the stack.
 * @param {SymbolicWasmStackItems} symbolicStack - The stack items array.
 * @returns {number} The number of items on the stack.
 */
export function size(symbolicStack) {
    return symbolicStack.length;
}