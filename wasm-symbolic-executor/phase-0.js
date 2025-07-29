import binaryen from "../3rd-party/binaryen-esm.js"

const wastString = `
(module
  (func (export "add_one") (param i32) (result i32)
    local.get 0
    i32.const 1
    i32.add
  )
  (func (export "check_equal") (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.eq
  )
)`
const moduleAst = binaryen.parseText(wastString);
// Important: For symbolic execution, you might want to optimize and validate
// the module, or at least validate it.
// moduleAst.validate();
// moduleAst.optimize(); // Optional, but can simplify the AST

const wastEmittedString = moduleAst.emitText();
const { binary, sourceMap } = moduleAst.emitBinary()
const wasmUint8Array = binary
const wasmBlob = new Blob([wasmUint8Array], { type: 'application/wasm' });
const wasmUrl = URL.createObjectURL(wasmBlob);
// const { instance } = await WebAssembly.instantiateStreaming(fetch(wasmUrl), {
//     // imports go here
// })
// const instance_exports = instance.exports
// const loadedModuleAst = binaryen.readBinary(wasmUint8Array)

import z3Solver from '../3rd-party/z3-solver-esm.js'
let z3SolverAll = await z3Solver.init()
let Z3 = z3SolverAll.Z3
let Context = z3SolverAll.Context
//const { Solver, Int, And } = new Context('main');

export function create_solver(context_name) {
    let context = new Context(context_name)
    let solver = new context.Solver()
    return { context, solver, Z3 }
}
