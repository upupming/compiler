const multi = [
  'IDN', 'VAR_INT', 'VAR_FLOAT', 'VAR_BOOL', 'VAR_CHAR', 'VAR_STR'
]

const single = [
  'INT', 'FLOAT', 'BOOL', 'STRUCT',
  'CHAR', 'VOID', 'IF', 'ELSE', 'SWITCH', 'CASE', 'DO', 'WHILE',
  'GOTO', 'ADD', 'MINUS', 'MUL', 'DIV', 'MOD', 'INC', 'DEC', 'EQL',
  'NEQ', 'GT', 'LT', 'GE', 'LE', 'LAND', 'LOR', 'LNOT', 'BAND', 'BOR', 'BXOR', 'BNOT', 'BRSFT', 'BLSFT', 'CMT',
  'ASS', 'SIMI', 'LBAC', 'RBAC', 'LPAR', 'RPAR', 'LBRA', 'RBRA'
]

let emptySymTable = {};


multi.forEach(key => {
  emptySymTable[key] = []
})
single.forEach(key => {
  emptySymTable[key] = null
})

// // Just for generating a reference json file
// import { writeFileSync } from "fs";
// import { resolve } from "path";
// (function generateEmptySymTable() {
//   writeFileSync(resolve(__dirname, 'symTable.json'), JSON.stringify(emptySymTable, null, 2))
// })()

export {
  emptySymTable
}
