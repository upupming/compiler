import _ = require("lodash");
import { GrammarTreeNode } from "../grammar/types";
import assert = require("assert");

import * as emptySymTable from '../lexical/symTable.json';
let offset: number, symTable=emptySymTable, t: string, w: number

let properties: Property[] = []

function enter(name: string|number, type: string, offset: number, width: number) {
  console.log(`entering type ${type} and name ${name} at address ${offset}`)
  if(symTable['IDN'].some(ele => ele.name === name)) {
    throw new Error('Redefine error for symbol: ' + name)
  }
  symTable['IDN'].push({
    name,
    type,
    offset,
    width: width
  })
}

export class Property {
  symbol: string
  type: string
  width: number
  constructor(symbol: string, type: string, width: number) {
    this.symbol = symbol
    this.type = type
    this.width = width
  }
  toString() {
    return `\nSymbol ${this.symbol}: (type, width) = (${this.type}, ${this.width})`
  }
}

function getProperty(node: GrammarTreeNode) {
  return properties[node.nodeNumber]
}
function setProperty(node: GrammarTreeNode, property: Property) {
  return properties[node.nodeNumber] = property
}

function printSymTable(symTable) {
  for (let ele of symTable['IDN']) {
    console.log(`(name, type, offset, width) = (${ele.name}, ${ele.type}, ${ele.offset}, ${ele.width})`)
  }
}

/**
 * 返回当前结点计算之后的属性
 * @param grammarTree 
 */
export function firstDFS(grammarTree: GrammarTreeNode) {
  // 终结符，不做任何操作
  if (grammarTree.productionNumber == -1) {
    return
  }
  console.log()
  console.log(`Current properties: ${properties.toString()}`)
  console.log(`Now dealing with node ${grammarTree.toString()}`)
  // 搜索到自己
  switch(grammarTree.productionNumber) {
    // 产生式 S'：S
    case 0:
      assert(grammarTree.children.length == 1)
      offset = 0
      firstDFS(grammarTree.children[0])
      return
    // 产生式 S：T，IDN，SIMI，D
    case 1: 
      assert(grammarTree.children.length == 4)
      // T
      let T = grammarTree.children[0]
      firstDFS(T)
      // id
      let id = grammarTree.children[1]
      firstDFS(id)
      // ;
      firstDFS(grammarTree.children[2])
      // 填符号表
      let TProps = getProperty(T)
      enter(id.value, id.token, offset, TProps.width)
      // 更新 offset
      offset += TProps.width
      // D
      firstDFS(grammarTree.children[3])
      return
    // 产生式 D：
    case 2:
      assert(grammarTree.children.length == 0)
      return
    // 产生式 T：B，C
    case 3:
      assert(grammarTree.children.length == 2)
      // B
      let B = grammarTree.children[0]
      firstDFS(B)
      let BProps = getProperty(B)
      t = BProps.type
      w = BProps.width
      // C
      let C = grammarTree.children[1]
      firstDFS(C)
      let CProps = getProperty(C)
      setProperty(grammarTree, new Property('C', CProps.type, CProps.width))
      return
    // 产生式 B：INT
    case 4:
      assert(grammarTree.children.length == 1)
      let int = grammarTree.children[0]
      firstDFS(int)
      setProperty(grammarTree, new Property('B', 'INT', 4))
      return
    // 产生式 B：FLOAT
    case 5:
      assert(grammarTree.children.length == 1)
      let float = grammarTree.children[0]
      firstDFS(float)
      setProperty(grammarTree, new Property('B', 'FLOAT', 4))
      return
    // 产生式 C：
    case 6:
      assert(grammarTree.children.length == 0)
      setProperty(grammarTree, new Property('C', t, w))
      return
    // 产生式 C：LBRA，VAR_INT，RBRA，C
    case 7:
      assert(grammarTree.children.length == 4)
      firstDFS(grammarTree.children[3])
      let C1 = grammarTree
      .children[3]
      let C1Props = getProperty(C1)
      let num = grammarTree.children[1].value
      setProperty(grammarTree, new Property('C', `array(${num}, ${C1.token})`, parseInt(''+num)*C1Props.width))
      return
  }
}

export function generateIntermediateCode(root: GrammarTreeNode) {
  // 初始化符号表
  symTable = _.clone(emptySymTable)  
  // 初始化属性表
  properties = new Array(root.nodeNumber+1)
  firstDFS(root)
  printSymTable(symTable)
}