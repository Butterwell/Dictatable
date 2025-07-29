// 0.6.symbolicMemory.js
import { createSymbolicValue } from './symbolic-value.js';

/**
 * @typedef {object} SymbolicWasmMemoryState
 * @property {object} smt_array - The Z3 ArrayExpr representing the linear memory.
 * @property {number} byteSize - The total size of the linear memory in bytes.
 */

/**
 * Initializes a new symbolic WASM linear memory state.
 * @param {object} ctx - The Z3 Context.
 * @param {number} initialMemorySizeInBytes - The initial size of the linear memory in bytes.
 * @returns {SymbolicWasmMemoryState} A new symbolic memory state object.
 */
export function createSymbolicWasmMemory(ctx, initialMemorySizeInBytes) {
    // WASM memory is indexed by i32 (BitVecSort(32)), stores bytes (BitVecSort(8))
    const index_by = ctx.BitVec.sort(32)
    const stores_bytes = ctx.BitVec.sort(8)
    const smt_array = ctx.Array.sort(index_by, stores_bytes)
    console.log(smt_array)
    //.const('mem0');
    return { smt_array, byteSize: initialMemorySizeInBytes };
}

/**
 * Performs a symbolic load from memory.
 * This function returns a new SymbolicValue representing the loaded data.
 * The memory state itself (smt_array) is not modified by a load.
 *
 * @param {object} ctx - The Z3 Context.
 * @param {SymbolicWasmMemoryState} memoryState - The current symbolic memory state.
 * @param {import('./symbolicValue.js').SymbolicValue} address - The symbolic address to load from.
 * @param {number} byte_size - The number of bytes to load (1, 2, 4, 8).
 * @param {import('./symbolicValue.js').WasmDataType} type - The WASM data type of the value being loaded.
 * @returns {Promise<import('./symbolicValue.js').SymbolicValue>} A new SymbolicValue representing the loaded data.
 */
export async function load(ctx, memoryState, address, byte_size, type) {
    let result_bv_expr = null;
    const address_expr = address.smt_expr;
    const smt_array = memoryState.smt_array;

    // WASM memory is little-endian. We load byte by byte and concatenate.
    for (let i = 0; i < byte_size; i++) {
        const current_byte_addr = ctx.mkBvadd(address_expr, ctx.mkBv(i, 32));
        const byte_expr = ctx.mkSelect(smt_array, current_byte_addr);

        if (result_bv_expr === null) {
            result_bv_expr = byte_expr;
        } else {
            // Concatenate the new byte at the higher position
            result_bv_expr = ctx.mkConcat(byte_expr, result_bv_expr);
        }
    }
    if (!result_bv_expr) {
        throw new Error("Load operation failed to produce a result bit-vector.");
    }

    // Convert to floating point if necessary
    let final_expr = result_bv_expr;
    if (type === 'f32' && byte_size === 4) {
        final_expr = ctx.mkFpFromBv(final_expr, ctx.mkFPSort(8, 24)); // Single precision
    } else if (type === 'f64' && byte_size === 8) {
        final_expr = ctx.mkFpFromBv(final_expr, ctx.mkFPSort(11, 53)); // Double precision
    }

    return createSymbolicValue(final_expr, type);
}

/**
 * Performs a symbolic store to memory.
 * This function returns a new `SymbolicWasmMemoryState` object with the updated memory array.
 *
 * @param {object} ctx - The Z3 Context.
 * @param {SymbolicWasmMemoryState} memoryState - The current symbolic memory state.
 * @param {import('./symbolicValue.js').SymbolicValue} address - The symbolic address to store to.
 * @param {import('./symbolicValue.js').SymbolicValue} value - The symbolic value to store.
 * @param {number} byte_size - The number of bytes to store (1, 2, 4, 8).
 * @returns {Promise<SymbolicWasmMemoryState>} A new symbolic memory state object with the updated memory.
 */
export async function store(ctx, memoryState, address, value, byte_size) {
    const address_expr = address.smt_expr;
    let current_array = memoryState.smt_array;

    // Convert float to bit-vector if necessary for storage
    let value_bv_expr = value.smt_expr;
    if (value.type === 'f32' || value.type === 'f64') {
        value_bv_expr = ctx.mkFpToBv(value_bv_expr, true);
    }

    // Store byte by byte (little-endian)
    for (let i = 0; i < byte_size; i++) {
        const current_byte_addr = ctx.mkBvadd(address_expr, ctx.mkBv(i, 32));
        // Extract the relevant byte from the value_bv_expr
        const byte_to_store = ctx.mkExtract((i * 8) + 7, (i * 8), value_bv_expr);
        current_array = ctx.mkStore(current_array, current_byte_addr, byte_to_store);
    }

    // Return a new memory state object with the updated smt_array
    return { smt_array: current_array, byteSize: memoryState.byteSize };
}

/**
 * Creates a clone of the symbolic memory state.
 * Since Z3 expressions are immutable, a shallow copy of the state object is sufficient.
 *
 * @param {SymbolicWasmMemoryState} memoryState - The symbolic memory state to clone.
 * @returns {SymbolicWasmMemoryState} A new symbolic memory state object.
 */
export function cloneSymbolicWasmMemory(memoryState) {
    return { smt_array: memoryState.smt_array, byteSize: memoryState.byteSize };
}