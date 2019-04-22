// import { LRProduction } from "./grammar/types";
// import _ = require("lodash");

// // import { emptySymTable } from "./lexical/symTable";

// // // // const multi = [
// // // //   'IDN', 'VAR_INT', 'VAR_FLOAT', 'VAR_BOOL', 'VAR_CHAR', 'VAR_STR'
// // // // ]

// // // let a = {}

// // // multi.forEach(key => {
// // //   a[key] = []
// // // })

// // // console.log(a)

// // // console.log(JSON.stringify(emptySymTable, null, 2))

// // // console.log(('\\' + 'n').replace('\\n', '\n'))
// // let byte = Buffer.from([-1])
// // console.log(byte[0])

// let a = new LRProduction('s', [], 0, 's', 0)
// let b = new LRProduction('s', [], 0, 's', 1)

// console.log(_.isEqual(a, b))

let a = {
    1: 's',
    '1': 'dd'
}

