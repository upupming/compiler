import { GrammarTreeNode } from "../grammar/types";
import * as emptySymTable from '../lexical/symTable.json';
import _ = require("lodash");
import { firstDFS } from ".";
import assert = require("assert");
import { Code } from "./types";

// export function generateIntermediateCode(root: GrammarTreeNode) {
//     // 初始化符号表
//     symTable = _.clone(emptySymTable)  
//     // 初始化属性表
//     properties = new Array(root.nodeNumber+1)
//     firstDFS(root)
//     printSymTable(symTable)
//   }


export class Property {
  symbol: string
  type: string
  width: number
  next: number|string
  address: number|string
  true: number|string
  false: number|string
  begin: number|string
  constructor(symbol: string, type: string, width: number, next: number|string, address) {
    this.symbol = symbol
    this.type = type
    this.width = width
    this.next = next
    this.address = address
  }
  toString() {
    return `\nSymbol ${this.symbol}: (type, width, next) = (${this.type}, ${this.width}, ${this.next})`
  }
}

export class CodeGenerator {
  private labelCount = 0
  private tempCount = 0
  root: GrammarTreeNode
  symTable
  t: string
  w: number
  properties: Property[]
  offset: number
  code: Code = new Code()
  labelToLineNumber = {}

  constructor(root: GrammarTreeNode) {
    this.root = root
    this.symTable = _.clone(emptySymTable)
    this.properties = new Array(root.nodeNumber + 1)
  }
  enter(name: string|number, type: string, offset: number, width: number) {
      // 产生式  E：E，MINUS，E
    console.log(`entering type 
    // 产生式 S：IF，B，THEN，S，ELSE，S${type} and name ${name} at address ${offset}`)
    // 产生式 
    if(this.symTable['IDN'].some(ele => ele.name === name)) {
      throw new Error('Redefine error for symbol: ' + name)
    }
    this.symTable['IDN'].push({
      name,
      type,
      offset,
      width: width
    })
  }
  generate() {
    this.firstDFS(this.root)
    console.log(this.code.toString())
    this.code.backpatch(this.labelToLineNumber)
    console.log(this.code.toString())
  }

  getProperty(node: GrammarTreeNode) {
    return this.properties[node.nodeNumber]
  }
  setProperty(node: GrammarTreeNode, property: Property) {
    return this.properties[node.nodeNumber] = property
  }
  newLabel() {
    return `L${this.labelCount++}`
  }
  newTemp() {
    return `t${this.tempCount++}`
  }
  firstDFS(node: GrammarTreeNode) {
    // 终结符，不做任何操作
    if (node.productionNumber == -1) {
      return
    }
    console.log()
    console.log(`Current properties: ${this.properties.toString()}`)
    console.log(`Now dealing with node ${node.toString()}`)

    // 搜索到自己
    switch(node.productionNumber) {
      // 产生式 S'：S
      case 0:
        assert(node.children.length == 1)
        this.setProperty(node.children[0], new Property("S", '', 0, this.newLabel(), 0))
        // S
        this.firstDFS(node.children[0])
        this.properties[node.children[0].nodeNumber].next = this.labelToLineNumber[this.properties[node.children[0].nodeNumber].next] = this.code.nextLineNumber
        return
      // 产生式 E：IDN
      case 1:
        // 赋予 address 值
        // 暂时直接用变量名表示地址
        this.properties[node.nodeNumber] = new Property('E', 'null', 0, 0, node.children[0].value)
        return
      // 产生式 E：E，ADD，E
      case 2:
        assert(node.children.length == 3)
        this.firstDFS(node.children[0])
        this.firstDFS(node.children[2])
        this.setProperty(node, new Property('E', null, 0, 0, this.newTemp()))
        this.code.gencode('ADD', this.getProperty(node.children[0]).address, this.getProperty(node.children[2]).address, this.getProperty(node).address)
        return
      // 产生式  E：E，MINUS，E
      case 3:
        assert(node.children.length == 3)
        this.firstDFS(node.children[0])
        this.firstDFS(node.children[2])
        this.setProperty(node, new Property('E', null, 0, 0, this.newTemp()))
        this.code.gencode('MINUS', this.getProperty(node.children[0]).address, this.getProperty(node.children[2]).address, this.getProperty(node).address)
        return
      // 产生式 S：IF，B，THEN，S1，ELSE，S2
      case 4:
        assert(node.children.length == 6)
        this.properties[node.children[1].nodeNumber] = new Property('B', 'null', 0, 0, 0)
        this.properties[node.children[1].nodeNumber].true = this.newLabel()
        this.properties[node.children[1].nodeNumber].false = this.newLabel()
        // B
        this.firstDFS(node.children[1])
        this.properties[node.children[1].nodeNumber].true = this.labelToLineNumber[this.properties[node.children[1].nodeNumber].true] = this.code.nextLineNumber
        this.properties[node.children[3].nodeNumber] = new Property('S', 'null', 0, 0, 0)
        this.properties[node.children[3].nodeNumber].next = this.properties[node.nodeNumber].next
        // S1
        this.firstDFS(node.children[3])
        this.code.gencode('j', '-', '-', this.properties[node.nodeNumber].next)

        this.properties[node.children[1].nodeNumber].false = this.labelToLineNumber[this.properties[node.children[1].nodeNumber].false] = this.code.nextLineNumber
        this.properties[node.children[5].nodeNumber] = new Property('S', 'null', 0, 0, 0)
        this.properties[node.children[5].nodeNumber].next = this.properties[node.nodeNumber].next
        // S2
        this.firstDFS(node.children[5])
        return
      // 产生式 S：WHILE，B，DO，S1
      case 5:
        assert(node.children.length == 4)
        this.properties[node.nodeNumber].begin = this.newLabel()
        this.properties[node.nodeNumber].begin = this.labelToLineNumber[this.properties[node.nodeNumber].begin] = this.code.nextLineNumber
        
        // B.true = newlabel( );
        // B.false = S.next;
        console.log(`B.nodeNumber: ${node.children[1].nodeNumber}`)
        this.properties[node.children[1].nodeNumber] = new Property('B', 'null', 0, 0, 0)
        this.properties[node.children[1].nodeNumber].true = this.newLabel()
        this.properties[node.children[1].nodeNumber].false = this.labelToLineNumber[this.properties[node.children[1].nodeNumber].false] = this.properties[node.nodeNumber].next

        // B
        this.firstDFS(node.children[1])

        // 生成玩 B DO，之后就知道 B.true 往哪走了
        // label(B.true);
        this.properties[node.children[1].nodeNumber].true = this.labelToLineNumber[this.properties[node.children[1].nodeNumber].true] = this.code.nextLineNumber
        // S1.next = S.begin;
        this.properties[node.children[3].nodeNumber] = new Property('S', 'null', 0, 0, 0)
        this.properties[node.children[3].nodeNumber].next = this.newLabel()
        this.properties[node.children[3].nodeNumber].next = this.labelToLineNumber[this.properties[node.children[3].nodeNumber].next] = this.properties[node.nodeNumber].begin
        // S1
        this.firstDFS(node.children[3])
        this.code.gencode('j', '-', '-', this.properties[node.nodeNumber].begin)
        return
      // 产生式 S：IDN，ASS，E，SIMI
      case 6:
        assert(node.children.length == 4)
        this.firstDFS(node.children[2])
        // 省去 lookup 过程，默认符号表中已经有相应的元素
        // 之后再处理较为复杂的情况
        this.code.gencode('=', this.properties[node.children[2].nodeNumber].address, node.children[0].value, '-')
        return
      // 产生式 B：LNOT，B
      case 7:
        assert(node.children.length == 2)
        this.properties[node.children[1].nodeNumber] = new Property('B', '', 1, 0, 0)
        this.properties[node.children[1].nodeNumber].true = this.properties[node.nodeNumber].false
        this.properties[node.children[1].nodeNumber].false = this.properties[node.nodeNumber].true
        this.firstDFS(node.children[1])
        return
      // 产生式 B：LPAR，B1，RPAR
      case 8:
        assert(node.children.length == 3)
        // 定义好 B1 取真和假的出口
        this.properties[node.children[1].nodeNumber] = new Property('B', '', 1, 0, 0)
        this.properties[node.children[1].nodeNumber].true = this.properties[node.nodeNumber].true
        this.properties[node.children[1].nodeNumber].false = this.properties[node.nodeNumber].false
        // 先计算 B1 的布尔值
        this.firstDFS(node.children[1])
        return
      // 产生式 B：E1，RELOP，E2
      case 9:
        assert(node.children.length == 3)
        // E1，计算得到 address 值
        this.firstDFS(node.children[0])
        // RELOP
        this.firstDFS(node.children[1])
        // E2，计算得到 address 值
        this.firstDFS(node.children[2])
        this.properties[node.nodeNumber].true
        // 满足条件的跳转
        this.code.gencode(this.properties[node.children[1].nodeNumber].type, this.properties[node.children[0].nodeNumber].address, this.properties[node.children[2].nodeNumber].address, this.properties[node.nodeNumber].true)
        // 否则，无条件跳转
        this.code.gencode('j', '-', '-', this.properties[node.nodeNumber].false)
        return
      // 产生式 RELOP：LT
      case 10:
        assert(node.children.length == 1)
        this.properties[node.nodeNumber] = new Property('LT', '>', 0, 0, 0)
        return
    }
  }
}