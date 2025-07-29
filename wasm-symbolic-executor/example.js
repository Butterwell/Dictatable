// example.js
import {
    createSymbolicWasmState,
    addConstraint,
    disposeSymbolicWasmStateContext,
    pushStack,
    popStack,
    peekStack,
    getStackSize,
    getLocal,
    setLocal,
    memoryLoadState,
    memoryStoreState,
    cloneSymbolicWasmState // Need to import clone for the example
} from './symbolic-state.js';
import { createSymbolicWasmMemory } from './symbolic-memory.js';
import { createSymbolicValue, add, eq, symbolicValueToString } from './symbolic-value.js';

/**
 * Runs a symbolic execution example and logs the output to the console.
 * @param {object} z3Context - The initialized Z3 Context object (for expression building).
 * @param {object} z3Solver - The initialized Z3 Solver object (for push/pop/check/assert/getModel/eval).
 */
export async function runSymbolicExample(z3Context, z3Solver, Z3) {
    console.log("\n--- Starting Symbolic Execution Example ---");

    let currentState = null;

    try {
        console.log(z3Solver)
        console.log(Z3)
        await z3Solver.push(); // Use the Solver for push/pop operations

        // 1. Create initial symbolic memory (e.g., 64KB for a WASM module)
        // Pass z3Context for expression building within memory functions
        const initialMemoryState = createSymbolicWasmMemory(z3Solver.ctx, 65536);

        // 2. Get a dummy function AST for state initialization
        const dummyFuncAst = {
            name: "demo_function",
            idx: 0,
            type: {
                params: [window.binaryen.i32, window.binaryen.i32],
                results: [window.binaryen.i32]
            },
            vars: []
        };

        // 3. Create a new SymbolicWasmState
        // Pass z3Context for expression building within state creation
        currentState = createSymbolicWasmState(z3Context, dummyFuncAst, initialMemoryState);
        console.log("Initial SymbolicWasmState created.");

        // Use getLocal to retrieve symbolic parameters
        const param0 = getLocal(currentState, 0);
        const param1 = getLocal(currentState, 1);

        console.log(`  - Symbolic param0: ${symbolicValueToString(param0)}`);
        console.log(`  - Symbolic param1: ${symbolicValueToString(param1)}`);

        // Use z3Context for expression creation
        let constraint = z3Context.mkBvslt(param1.smt_expr, param0.smt_expr); // param1 < param0
        // Pass z3Solver for asserting constraints
        currentState = addConstraint(z3Solver, currentState, constraint);
        console.log(`  - Added constraint (param1 < param0): ${constraint.toString()}`);

        const sum = add(z3Context, param0, param1);
        const ten_const = createSymbolicValue(z3Context.mkBv(10, 32), 'i32');
        const finalEquality = eq(z3Context, sum, ten_const);

        constraint = finalEquality.smt_expr;
        // Pass z3Solver for asserting constraints
        currentState = addConstraint(z3Solver, currentState, constraint);
        console.log(`  - Added constraint (param0 + param1 == 10): ${symbolicValueToString(finalEquality)}`);

        // --- Demonstrate Stack Operations ---
        const val1 = createSymbolicValue(z3Context.mkBv(100, 32), 'i32');
        const val2 = createSymbolicValue(z3Context.mkBv(200, 32), 'i32');

        console.log(`\n--- Stack Operations ---`);
        console.log(`Initial stack size: ${getStackSize(currentState)}`);

        currentState = pushStack(currentState, val1);
        console.log(`Pushed ${symbolicValueToString(val1)}. New stack size: ${getStackSize(currentState)}`);

        currentState = pushStack(currentState, val2);
        console.log(`Pushed ${symbolicValueToString(val2)}. New stack size: ${getStackSize(currentState)}`);

        console.log(`Peek top: ${symbolicValueToString(peekStack(currentState))}`);

        let popResult = popStack(currentState);
        const poppedVal1 = popResult.value;
        currentState = popResult.newState;
        console.log(`Popped ${symbolicValueToString(poppedVal1)}. New stack size: ${getStackSize(currentState)}`);

        popResult = popStack(currentState);
        const poppedVal2 = popResult.value;
        currentState = popResult.newState;
        console.log(`Popped ${symbolicValueToString(poppedVal2)}. New stack size: ${getStackSize(currentState)}`);
        console.log(`--- End Stack Operations ---`);

        // --- Demonstrate Local Variables Operations ---
        console.log(`\n--- Local Variables Operations ---`);
        const localVal = createSymbolicValue(z3Context.mkBv(999, 32), 'i32');
        const localIndex = 2; // Assuming index 2 is available after params

        console.log(`Setting local ${localIndex} to ${symbolicValueToString(localVal)}`);
        currentState = setLocal(currentState, localIndex, localVal);

        const retrievedLocal = getLocal(currentState, localIndex);
        console.log(`Retrieved local ${localIndex}: ${symbolicValueToString(retrievedLocal)}`);
        console.log(`--- End Local Variables Operations ---`);


        // Demonstrate memory operations
        const addr = createSymbolicValue(z3Context.mkBv(0, 32), 'i32');
        const valToStore = createSymbolicValue(z3Context.mkBv(12345, 32), 'i32');

        console.log(`\n--- Memory Operations ---`);
        console.log(`  - Storing ${symbolicValueToString(valToStore)} to memory address ${symbolicValueToString(addr)}`);
        // Pass z3Context for expression building within memory functions
        currentState = await memoryStoreState(z3Context, currentState, addr, valToStore, 4);

        // Pass z3Context for expression building within memory functions
        const loadedVal = await memoryLoadState(z3Context, currentState, addr, 4, 'i32');
        console.log(`  - Loaded from memory: ${symbolicValueToString(loadedVal)}`);
        console.log(`--- End Memory Operations ---`);

        // --- Demonstrate cloning a state and its solver context ---
        console.log(`\n--- State Cloning Demonstration ---`);
        // The clone function takes the solver object for the push operation
        let clonedState = await cloneSymbolicWasmState(z3Solver, currentState);
        // Modify clonedState independently (e.g., add a conflicting constraint)
        const conflictConstraint = z3Context.mkEq(param0.smt_expr, z3Context.mkBv(0, 32)); // param0 == 0
        clonedState = addConstraint(z3Solver, clonedState, conflictConstraint); // Add to current solver scope
        console.log(`Cloned state created and conflicting constraint (param0 == 0) added.`);

        // Check satisfiability of the current (original) path condition using the solver
        const checkResultOriginal = await z3Solver.check();
        console.log(`\nZ3 Check Result (Original Path): ${checkResultOriginal}`);

        if (checkResultOriginal === 'sat') {
            const model = await z3Solver.getModel();
            const param0_val = await model.eval(param0.smt_expr, true);
            const param1_val = await model.eval(param1.smt_expr, true);
            const loaded_val_concrete = await model.eval(loadedVal.smt_expr, true);
            const retrieved_local_concrete = await model.eval(retrievedLocal.smt_expr, true);

            console.log(`Model found (Original Path): param0 = ${param0_val}, param1 = ${param1_val}`);
            console.log(`Memory at 0: ${loaded_val_concrete}`);
            console.log(`Local ${localIndex}: ${retrieved_local_concrete}`);
        }

        // Check satisfiability of the cloned path condition (should be unsat if original model param0 != 0)
        // Need to push again to check the cloned path's specific constraints if not already in its own scope.
        // The clone operation already performed a push, so `addConstraint` added to that new scope.
        // Now just check it.
        const checkResultCloned = await z3Solver.check(); // Still checking the current (cloned) scope
        console.log(`Z3 Check Result (Cloned Path with Conflict): ${checkResultCloned}`);
        if (checkResultCloned === 'sat') {
             const model = await z3Solver.getModel();
             const param0_val_cloned = await model.eval(param0.smt_expr, true);
             console.log(`Model found (Cloned Path): param0 = ${param0_val_cloned}`);
        }
        console.log(`--- End State Cloning Demonstration ---`);


    } catch (error) {
        console.error("Error during symbolic example:", error);
    } finally {
        if (z3Solver) {
            // Use the Solver for pop
            await disposeSymbolicWasmStateContext(z3Solver);
            console.log("Z3 Solver context scope popped for example.");
        }
        console.log("--- Symbolic Execution Example Finished ---");
    }
}