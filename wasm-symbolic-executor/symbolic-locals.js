// 0.5.symbolicLocals.js

/**
 * @typedef {import('./0.3.symbolicValue.js').SymbolicValue} SymbolicValue
 */

/**
 * @typedef {Map<number, SymbolicValue>} SymbolicWasmLocalsMap - Represents the WASM local variables (index -> SymbolicValue).
 */

/**
 * Creates a new empty symbolic WASM locals map.
 * @returns {SymbolicWasmLocalsMap} An empty Map representing the local variables.
 */
export function createSymbolicWasmLocals() {
    return new Map();
}

/**
 * Retrieves a symbolic value from the local variables map.
 *
 * @param {SymbolicWasmLocalsMap} localsMap - The current local variables map.
 * @param {number} index - The index of the local variable.
 * @returns {SymbolicValue} The symbolic value.
 * @throws {Error} If the local variable at the given index is not initialized.
 */
export function getLocals(localsMap, index) {
    const value = localsMap.get(index);
    if (!value) {
        throw new Error(`Local variable at index ${index} not initialized`);
    }
    return value;
}

/**
 * Sets a symbolic value for a local variable.
 * Returns a new Map representing the updated local variables.
 *
 * @param {SymbolicWasmLocalsMap} localsMap - The current local variables map.
 * @param {number} index - The index of the local variable.
 * @param {SymbolicValue} value - The symbolic value to set.
 * @returns {SymbolicWasmLocalsMap} A new Map with the updated local variable.
 */
export function setLocals(localsMap, index, value) {
    const newLocalsMap = new Map(localsMap); // Create a new map
    newLocalsMap.set(index, value);
    return newLocalsMap;
}

/**
 * Creates a clone of the symbolic local variables map.
 *
 * @param {SymbolicWasmLocalsMap} localsMap - The local variables map to clone.
 * @returns {SymbolicWasmLocalsMap} A new Map representing the cloned local variables.
 */
export function cloneSymbolicWasmLocals(localsMap) {
    return new Map(localsMap); // Returns a new Map
}