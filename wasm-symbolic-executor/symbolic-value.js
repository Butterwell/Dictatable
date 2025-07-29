// symbolic-value.js

/**
 * @typedef {'i32' | 'i64' | 'f32' | 'f64' | 'boolean_z3'} WasmDataType
 */

/**
 * @typedef {object} SymbolicValue
 * @property {object} smt_expr - A Z3.Expr object (e.g., a bit-vector or float expression).
 * @property {WasmDataType} type - The WASM data type this value represents.
 */

/**
 * Creates a new SymbolicValue object.
 * @param {object} smt_expr - A Z3.Expr object.
 * @param {WasmDataType} type - The WASM data type.
 * @returns {SymbolicValue} A new SymbolicValue object.
 */
export function createSymbolicValue(smt_expr, type) {
    return { smt_expr, type };
}

/**
 * Performs a symbolic addition.
 * @param {object} ctx - The Z3 Context.
 * @param {SymbolicValue} operand1 - The first symbolic value.
 * @param {SymbolicValue} operand2 - The second symbolic value.
 * @returns {SymbolicValue} A new SymbolicValue representing the sum.
 * @throws {Error} If unsupported types are provided for addition.
 */
export function add(ctx, operand1, operand2) {
    let resultExpr;
    if (operand1.smt_expr.isBV()) {
        resultExpr = ctx.mkBvadd(operand1.smt_expr, operand2.smt_expr);
    } else if (operand1.smt_expr.isFp()) {
        resultExpr = ctx.mkFpadd(ctx.mkFPRoundNearestTiesToEven(), operand1.smt_expr, operand2.smt_expr);
    } else {
        throw new Error('Unsupported types for add operation');
    }
    return createSymbolicValue(resultExpr, operand1.type); // Result has the same type
}

/**
 * Performs a symbolic equality check.
 * @param {object} ctx - The Z3 Context.
 * @param {SymbolicValue} operand1 - The first symbolic value.
 * @param {SymbolicValue} operand2 - The second symbolic value.
 * @returns {SymbolicValue} A new SymbolicValue representing the boolean result.
 */
export function eq(ctx, operand1, operand2) {
    const resultExpr = ctx.mkEq(operand1.smt_expr, operand2.smt_expr);
    return createSymbolicValue(resultExpr, 'boolean_z3');
}

/**
 * Performs a symbolic signed less-than check.
 * @param {object} ctx - The Z3 Context.
 * @param {SymbolicValue} operand1 - The first symbolic value.
 * @param {SymbolicValue} operand2 - The second symbolic value.
 * @returns {SymbolicValue} A new SymbolicValue representing the boolean result.
 */
export function lt_s(ctx, operand1, operand2) {
    let resultExpr;
    if (operand1.type === 'f32' || operand1.type === 'f64') {
        resultExpr = ctx.mkFplt(operand1.smt_expr, operand2.smt_expr);
    } else {
        resultExpr = ctx.mkBvslt(operand1.smt_expr, operand2.smt_expr);
    }
    return createSymbolicValue(resultExpr, 'boolean_z3');
}

/**
 * Returns the SMT-LIB string representation of the symbolic value's underlying Z3 expression.
 * This is a helper function that operates on a SymbolicValue object.
 * @param {SymbolicValue} symbolicValue - The symbolic value to convert to string.
 * @returns {string} SMT-LIB string.
 */
export function symbolicValueToString(symbolicValue) {
    return symbolicValue.smt_expr.toString();
}

// You would add more functional operations here (sub, mul, div_s, and, or, xor, etc.)
// Each would take ctx and operands, and return a new SymbolicValue.