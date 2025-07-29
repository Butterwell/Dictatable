// symbolic-state.js
import { i32, i64, f32, f64 } from './binaryen-const.js';
import { createSymbolicValue } from './symbolic-value.js';
import { createSymbolicWasmStack, push as stackPushFunc, pop as stackPopFunc, peek as stackPeekFunc, cloneSymbolicWasmStack, size as stackSizeFunc } from './symbolic-stack.js';
import { createSymbolicWasmLocals, getLocals as getLocalsFunc, setLocals as setLocalsFunc, cloneSymbolicWasmLocals } from './symbolic-locals.js'; // Import functional locals API
import { createSymbolicWasmMemory, cloneSymbolicWasmMemory, load as memoryLoadFunc, store as memoryStoreFunc } from './symbolic-memory.js';

/**
 * @typedef {object} SymbolicWasmState
 * @property {object} smt_context - The Z3 Context object (for expression building) associated with this state.
 * @property {number} current_instruction_ptr_index - Current program counter.
 * @property {import('./0.4.symbolicStack.js').SymbolicWasmStackItems} operand_stack - The WASM operand stack.
 * @property {import('./0.5.symbolicLocals.js').SymbolicWasmLocalsMap} local_variables - The WASM local variables.
 * @property {import('./0.6.symbolicMemory.js').SymbolicWasmMemoryState} linear_memory - The WASM linear memory state.
 * @property {object} path_condition - A Z3 boolean expression representing conditions leading to this state.
 * @property {Map<string, import('./0.3.symbolicValue.js').SymbolicValue>} input_param_map - Maps input parameter names to their symbolic values.
 * @property {Map<string, number>} unroll_counters - For loop/recursion unrolling limits.
 * @property {object} function_ast - A Binaryen Function object for reference.
 * @property {string} current_function_name - Name of the current function.
 */

/**
 * Helper to create Z3 variables based on Binaryen/WASM types.
 * @param {object} z3ctx - Z3 Context object (for mkBvConst, mkFPSort).
 * @param {string} name - Name for the Z3 variable.
 * @param {number} binaryenType - Binaryen type constant (e.g., `i32`, `f64`).
 * @returns {object} Z3.Expr
 */
function createZ3VarForWasmType(z3ctx, name, binaryenType) {
    switch (binaryenType) {
        case i32: return z3ctx.mkBvConst(name, 32);
        case i64: return z3ctx.mkBvConst(name, 64);
        case f32: return z3ctx.mkFpConst(name, z3ctx.mkFPSort(8, 24));
        case f64: return z3ctx.mkFpConst(name, z3ctx.mkFPSort(11, 53));
        default: throw new Error(`Unsupported Binaryen WASM type for Z3 variable: ${binaryenType}`);
    }
}

/**
 * Helper to map Binaryen type constants to string representations.
 * @param {number} binaryenType - Binaryen type constant.
 * @returns {import('./0.3.symbolicValue.js').WasmDataType}
 */
function mapBinaryenTypeToString(binaryenType) {
    switch (binaryenType) {
        case i32: return 'i32';
        case i64: return 'i64';
        case f32: return 'f32';
        case f64: return 'f64';
        default: throw new Error(`Unknown Binaryen type constant: ${binaryenType}`);
    }
}

/**
 * Creates a new symbolic WASM state.
 * @param {object} z3ctx - The Z3 Context object (for expression building).
 * @param {object} funcAst - A Binaryen Function object representing the function being analyzed.
 * @param {import('./0.6.symbolicMemory.js').SymbolicWasmMemoryState} initialMemoryState - The initial symbolic memory state object.
 * @param {number} [initialPc=0] - Initial program counter (index into a linearized instruction list).
 * @returns {SymbolicWasmState} A new symbolic WASM state object.
 */
export function createSymbolicWasmState(z3ctx, funcAst, initialMemoryState, initialPc = 0) {
    const state = {
        smt_context: z3ctx, // Store the Context object
        current_instruction_ptr_index: initialPc,
        operand_stack: createSymbolicWasmStack(),
        local_variables: createSymbolicWasmLocals(),
        linear_memory: initialMemoryState,
        path_condition: z3ctx.mkTrue(), // Context creates boolean expressions
        input_param_map: new Map(),
        unroll_counters: new Map(),
        function_ast: funcAst,
        current_function_name: funcAst.name || `func_at_index_${funcAst.idx || 'unknown'}`,
    };

    let localIdx = 0;
    if (funcAst.type && funcAst.type.params) {
        for (const paramType of funcAst.type.params) {
            const paramName = `${state.current_function_name}_param_${localIdx}`;
            const symbolicParam = createSymbolicValue(
                createZ3VarForWasmType(state.smt_context, paramName, paramType),
                mapBinaryenTypeToString(paramType)
            );
            state.local_variables = setLocalsFunc(state.local_variables, localIdx, symbolicParam);
            state.input_param_map.set(paramName, symbolicParam);
            localIdx++;
        }
    }

    if (funcAst.vars) {
        for (const localType of funcAst.vars) {
            const localName = `${state.current_function_name}_local_${localIdx}`;
            const symbolicLocal = createSymbolicValue(
                createZ3VarForWasmType(state.smt_context, localName, localType),
                mapBinaryenTypeToString(localType)
            );
            state.local_variables = setLocalsFunc(state.local_variables, localIdx, symbolicLocal);
            localIdx++;
        }
    }

    return state;
}

/**
 * Adds a constraint to the path condition of the given state by asserting it to the solver.
 * Returns a new state object with the updated path condition.
 *
 * @param {object} z3solver - The Z3 Solver object (for asserting constraints).
 * @param {SymbolicWasmState} state - The current symbolic WASM state.
 * @param {object} constraint_expr - A Z3.Expr representing the boolean constraint.
 * @returns {SymbolicWasmState} A new state object with the updated path condition.
 */
export function addConstraint(z3solver, state, constraint_expr) {
    z3solver.assert(constraint_expr); // Solver asserts constraints
    // Return a new state object with the path_condition updated (using the context from state)
    return {
        ...state,
        path_condition: state.smt_context.mkAnd(state.path_condition, constraint_expr),
    };
}

/**
 * Creates a clone of the current symbolic state. This involves pushing a new Z3 solver context
 * and cloning mutable data structures.
 *
 * @param {object} z3solver - The Z3 Solver object (for pushing context).
 * @param {SymbolicWasmState} state - The symbolic WASM state to clone.
 * @returns {Promise<SymbolicWasmState>} A new SymbolicWasmState instance.
 */
export async function cloneSymbolicWasmState(z3solver, state) {
    await z3solver.push(); // Solver pushes context

    const clonedState = {
        ...state,
        operand_stack: cloneSymbolicWasmStack(state.operand_stack),
        local_variables: cloneSymbolicWasmLocals(state.local_variables),
        unroll_counters: new Map(state.unroll_counters),
        input_param_map: new Map(state.input_param_map),
        linear_memory: cloneSymbolicWasmMemory(state.linear_memory),
    };

    return clonedState;
}

/**
 * Disposes of the Z3 solver context scope associated with a state.
 * Call this when a path finishes or becomes unsatisfiable.
 *
 * @param {object} z3solver - The Z3 Solver object (for popping context).
 * @returns {Promise<void>}
 */
export async function disposeSymbolicWasmStateContext(z3solver) {
    await z3solver.pop(); // Solver pops context
}

// --- Stack Interaction Functions ---
// (No change, as they interact with the state object directly)

/**
 * Pushes a symbolic value onto the state's operand stack.
 * Returns a new state object with the updated stack.
 * @param {SymbolicWasmState} state - The current symbolic WASM state.
 * @param {import('./0.3.symbolicValue.js').SymbolicValue} value - The symbolic value to push.
 * @returns {SymbolicWasmState} A new state object with the updated stack.
 */
export function pushStack(state, value) {
    return {
        ...state,
        operand_stack: stackPushFunc(state.operand_stack, value),
    };
}

/**
 * Pops a symbolic value from the state's operand stack.
 * Returns an object containing the popped value and a new state object with the updated stack.
 * @param {SymbolicWasmState} state - The current symbolic WASM state.
 * @returns {{value: import('./0.3.symbolicValue.js').SymbolicValue, newState: SymbolicWasmState}}
 * @throws {Error} If the stack is empty.
 */
export function popStack(state) {
    const { value, newStack } = stackPopFunc(state.operand_stack);
    const newState = {
        ...state,
        operand_stack: newStack,
    };
    return { value, newState };
}

/**
 * Peeks at a value on the state's operand stack without removing it.
 * @param {SymbolicWasmState} state - The current symbolic WASM state.
 * @param {number} [offset=0] - The offset from the top of the stack.
 * @returns {import('./0.3.symbolicValue.js').SymbolicValue} The symbolic value.
 * @throws {Error} If the offset is out of bounds.
 */
export function peekStack(state, offset = 0) {
    return stackPeekFunc(state.operand_stack, offset);
}

/**
 * Returns the current size of the state's operand stack.
 * @param {SymbolicWasmState} state - The current symbolic WASM state.
 * @returns {number} The stack size.
 */
export function getStackSize(state) {
    return stackSizeFunc(state.operand_stack);
}

// --- Local Variables Interaction Functions ---
// (No change, as they interact with the state object directly)

/**
 * Retrieves a symbolic value from the state's local variables.
 * @param {SymbolicWasmState} state - The current symbolic WASM state.
 * @param {number} index - The index of the local variable.
 * @returns {import('./0.3.symbolicValue.js').SymbolicValue} The symbolic value.
 * @throws {Error} If the local variable at the given index is not initialized.
 */
export function getLocal(state, index) {
    return getLocalsFunc(state.local_variables, index);
}

/**
 * Sets a symbolic value for a local variable in the state.
 * Returns a new state object with the updated local variables.
 * @param {SymbolicWasmState} state - The current symbolic WASM state.
 * @param {number} index - The index of the local variable.
 * @param {import('./0.3.symbolicValue.js').SymbolicValue} value - The symbolic value to set.
 * @returns {SymbolicWasmState} A new state object with the updated local variables.
 */
export function setLocal(state, index, value) {
    return {
        ...state,
        local_variables: setLocalsFunc(state.local_variables, index, value),
    };
}


// --- Memory Interaction Functions (re-export with state parameter) ---

/**
 * Loads a value from symbolic memory within a given state.
 * @param {object} z3ctx - The Z3 Context object (for mk... operations within memory functions).
 * @param {SymbolicWasmState} state - The current symbolic WASM state.
 * @param {import('./0.3.symbolicValue.js').SymbolicValue} address - The symbolic address.
 * @param {number} byte_size - Number of bytes to load.
 * @param {import('./0.3.symbolicValue.js').WasmDataType} type - Type of value to load.
 * @returns {Promise<import('./0.3.symbolicValue.js').SymbolicValue>} The loaded symbolic value.
 */
export async function memoryLoadState(z3ctx, state, address, byte_size, type) {
    // memoryLoadFunc and memoryStoreFunc expect the Context object for expression building
    return await memoryLoadFunc(z3ctx, state.linear_memory, address, byte_size, type);
}

/**
 * Stores a value to symbolic memory within a given state, returning a new state with updated memory.
 * @param {object} z3ctx - The Z3 Context object (for mk... operations within memory functions).
 * @param {SymbolicWasmState} state - The current symbolic WASM state.
 * @param {import('./0.3.symbolicValue.js').SymbolicValue} address - The symbolic address.
 * @param {import('./0.3.symbolicValue.js').SymbolicValue} value - The symbolic value to store.
 * @param {number} byte_size - Number of bytes to store.
 * @returns {Promise<SymbolicWasmState>} A new state object with the updated linear memory.
 */
export async function memoryStoreState(z3ctx, state, address, value, byte_size) {
    const newMemoryState = await memoryStoreFunc(z3ctx, state.linear_memory, address, value, byte_size);
    return {
        ...state,
        linear_memory: newMemoryState,
    };
}