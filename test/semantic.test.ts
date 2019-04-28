import { doShiftReduce, calTable, calFIRST } from "../src/grammar";
import { resolve } from "path";
import { GrammarTreeNode } from "../src/grammar/types";
import { generateIntermediateCode } from "../src/semantic";
import * as all from '../src/semantic/while'
const printTree = require('print-tree');

const tablePath = [
  resolve(__dirname, 'semantic', 'declaration.table.json'),
  resolve(__dirname, 'semantic', 'while.table.json')
]
const FIRSTPath = [
  resolve(__dirname, 'semantic', 'declaration.FIRST.json'),
  resolve(__dirname, 'semantic', 'while.FIRST.json')
]
const codePath = [
  resolve(__dirname, 'semantic', 'declaration.tokens.txt'),
  resolve(__dirname, 'semantic', 'while.tokens.txt')
]
const grammarPath = [
  resolve(__dirname, 'semantic', 'declaration.txt'),
  resolve(__dirname, 'semantic', 'while.txt')
]

describe('semantic', function () {
  // it('should 生成语法树', function () {
  //   let grammarTree = doShiftReduce(tablePath[0], codePath[0], grammarPath[0])
  //   printTree(
  //     grammarTree,
  //     (node: GrammarTreeNode) => `${node.symbol}@${node.productionNumber}`,
  //     (node: GrammarTreeNode) => node.children
  //   )
  // })
  it('should 语义分析 声明语句', function () {
    // calFIRST(grammarPath[0], FIRSTPath[0])
    // calTable(grammarPath[0], FIRSTPath[0], tablePath[0])
    let grammarTree = doShiftReduce(tablePath[0], codePath[0], grammarPath[0]) as GrammarTreeNode
    printTree(
      grammarTree,
      (node: GrammarTreeNode) => node.toString(),
      (node: GrammarTreeNode) => node.children
    )
    generateIntermediateCode(grammarTree)
  })
  it('should 语义分析 所有类型的语句', function () {
    calFIRST(grammarPath[1], FIRSTPath[1])
    calTable(grammarPath[1], FIRSTPath[1], tablePath[1])
    let grammarTree = doShiftReduce(tablePath[1], codePath[1], grammarPath[1]) as GrammarTreeNode
    printTree(
      grammarTree,
      (node: GrammarTreeNode) => node.toString(),
      (node: GrammarTreeNode) => node.children
    )
    let generator = new all.CodeGenerator(grammarTree)
    generator.generate()
  })
})
  