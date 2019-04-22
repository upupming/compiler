import _ = require("lodash");
import assert = require("assert");
import { writeFileSync } from "fs";

export class Item {
  public static currentState = 0
  // 一组产生式
  productions: LRProduction[]
  // 所属类别，状态
  state: number
  constructor(productions: LRProduction[]) {
    this.productions = productions
    // 每次创建新的项目集的时候，项目集编号会自增
    this.state = Item.currentState++
  }
  addProductionIfNotExist(production: LRProduction) {
    // 当前不存在
    if (!this.productions.some(p => p.equals(production))) {
      // 假日
      this.productions.push(production)
      return true
    }
    return false
  }
  containsProduction(production: LRProduction) {
    return this.productions.some(hereProduction => production.equals(hereProduction))
  }
  isEmpty(): boolean {
    return this.productions.length === 0
  }
  /**
   * Item 相等：所有产生式相等
   */
  equals(aItem: Item) {
    return _.isEqual(this.productions, aItem.productions)
  }
  toString() {
    let res = `State = ${this.state} \n`
    for (let production of this.productions) {
      res += production.toString() + '\n'
    }
    return res
  }
}


export class Production {
  private static currentProductionNumber = 0
  left: string;
  rights: string[];
  productionNumber: number
  constructor(left: string, rights: string[]) {
    this.left = left
    this.rights = rights
    this.productionNumber = Production.currentProductionNumber++
  }
  toString() {
    return `No ${this.productionNumber}: ${this.left} → [${this.rights}]`
  }
  static finish() {
    Production.currentProductionNumber = 0
    Item.currentState = 0
  }
}

export class LRProduction {
  // 左部符号
  left: string;
  // 右部符号集合，有序
  rights: string[];
  // 圆点所在的下标，范围在 [0, n] 之间
  index: number;
  // 展望符，不同展望符看作是不同的 production
  lookahead: string
  // 唯一 id
  productionNumber: number;
  constructor(left: string, rights: string[], index: number, lookahead: string, productionNumber: number) {
    this.left = left
    this.rights = rights
    this.index = index
    this.lookahead = lookahead
    this.productionNumber = productionNumber
  }
  toString() {
    return `No ${this.productionNumber}: ${this.left} →[${this.rights.slice(0, this.index)}.${this.rights.slice(this.index)}], ${this.lookahead}`
  }
  /**
   * 两个产生式必须所有的值完全相同
   * @param aLRProduction 另一个产生式
   */
  equals(aLRProduction: LRProduction) {
    return _.isEqual(this, aLRProduction)
  }
  belongsToSameProductionWith(aLRProduction: LRProduction) {
    return this.productionNumber == aLRProduction.productionNumber
  }
  /**
   * AB.: index = 1, length = 2
   * .: 空产生式，index = 0, length = 0
   */
  isReductionProduction() {
    return this.index == this.rights.length
  }
  isWaitingFor(X: string) {
    if (X == 'epsilon') {
      return this.isEpsilon()
    }
    return !this.isReductionProduction() && this.rights[this.index] === X
  }
  // 右部为空
  isEpsilon() {
    if (this.rights.length === 0) {
      assert(this.index == 0)
      return true
    }
    return false
  }
  /**
   * 只有在不是规约式，或者是右部为空才能调用
   */
  getNextLRProduction() {

    let newProduction = _.clone(this)
    if (this.isEpsilon()) {
      return newProduction
    }
    else if (!this.isReductionProduction()) {
      newProduction.index++
      return newProduction
    } else {
      throw new Error('Should not call getNextLRProduction')
    }
  }
}


export interface TableRaw {
  terminals: string[]
  nonTerminals: string[]
  GOTO: ISomeObjectObject
  ACTION: ISomeObjectObject
}

export class LRTable {
  numOfSymbols: number
  numOfStates: number
  terminals: string[]
  nonTerminals: string[]
  GOTO: ISomeObjectObject
  ACTION: ISomeObjectObject
  constructor(terminals: string[], nonTerminals: string[]) {
    this.terminals = terminals
    this.nonTerminals = nonTerminals
    this.numOfSymbols = terminals.length + nonTerminals.length
    this.GOTO = {}
    this.ACTION = {}
    this.numOfStates = 0
  }
  static fromRaw(tableRaw: TableRaw) {
    let table = new LRTable(tableRaw.terminals, tableRaw.nonTerminals)
    table.GOTO = _.clone(tableRaw.GOTO)
    table.ACTION = _.clone(tableRaw.ACTION)
    return table
  }
  goFromTo(from: Item, to: Item, receiving: string) {
    this.GOTO[from.state] = this.GOTO[from.state] || {}
    this.ACTION[from.state] = this.ACTION[from.state] || {}
    if (this.nonTerminals.includes(receiving)) {
      this.GOTO[from.state][receiving] = '' + to.state
    } else {
      this.ACTION[from.state][receiving] = 's' + to.state
    }
  }
  toString(): string {
    function getReducer(row: ISomeObject) {
      return (accumulator: string, currentValue: string) => accumulator + (row && (row[currentValue] || '') || '').padEnd(8);
    }

    function headerReducer(accumulator: string, currentValue: string) {
      return accumulator + currentValue.padEnd(8)
    }

    let terminalsWithDollar = _.clone(this.terminals)
    terminalsWithDollar.push('$')

    let res = `${'State'.padEnd(8)} ${terminalsWithDollar.reduce(headerReducer, '')} ${this.nonTerminals.reduce(headerReducer, '')}\n`

    for (let i = 0; i < this.numOfStates; i++) {
      res += (`${('' + i).padEnd(8)} ${terminalsWithDollar.reduce(getReducer(this['ACTION']['' + i]), '')} ${this.nonTerminals.reduce(getReducer(this['GOTO']['' + i]), '')}\n`)
    }
    return res
  }

  saveToJson(filePath: string) {
    writeFileSync(filePath, JSON.stringify({
      numOfStates: this.numOfStates,
      numOfSymbols: this.numOfSymbols,
      nonTerminals: this.nonTerminals,
      terminals: this.terminals,
      ACTION: this.ACTION,
      GOTO: this.GOTO
    }, null, 2))
  }

  /**
   * 根据项目集族中的规约项目，更新当前的 ACTION 表，也更新 GOTO 表中缺少的信息
   */
  updateTable(items: Item[]) {
    this.numOfStates = items.length
    for (let item of items) {
      for (let production of item.productions) {
        console.log(`正在计算产生式 ${production.toString()} 的可用 ACTION`)
        // ACTION 表
        if (production.isReductionProduction()) {
          this.ACTION[item.state] = this.ACTION[item.state] || {}
          // 主产生式
          if (production.left == "S'") {
            this.ACTION[item.state][production.lookahead] = 'acc'
          }
          else {
            this.ACTION[item.state][production.lookahead] = 'r' + production.productionNumber
            console.log(`this.ACTION[${item.state}][${production.lookahead}] = 'r' + ${production.productionNumber}`)
          }
        }

        // GOTO 表
        // 补充一些隐藏的 GOTO 表项
        for (let terminal of this.terminals) {
          this.ACTION[item.state] = this.ACTION[item.state] || {}
          if (!this.ACTION[item.state][terminal] && production.isWaitingFor(terminal)) {
            let nextProduction = production.getNextLRProduction()
            for (let aItem of items) {
              if (aItem.containsProduction(nextProduction)) {
                this.ACTION[item.state][terminal] = 's' + aItem.state
              }
            }
          }
        }
        for (let nonTerminal of this.nonTerminals) {
          this.GOTO[item.state] = this.GOTO[item.state] || {}
          if (!this.GOTO[item.state][nonTerminal] && production.isWaitingFor(nonTerminal)) {
            let nextProduction = production.getNextLRProduction()
            for (let aItem of items) {
              if (aItem.containsProduction(nextProduction)) {
                this.GOTO[item.state][nonTerminal] = '' + aItem.state
              }
            }
          }
        }
      }
    }
  }

  print() {
    console.log(`Printing Analysis Table...`)
    console.log(JSON.stringify(this, null, 2))
    console.log(this.toString())
  }
}

export interface ISomeObjectObject {
  [key: string]: ISomeObject
}
export interface ISomeObject {
  // 计算的时候使用 Set
  [key: string]: string;
}
export interface FIRSTSetObject {
  // 计算的时候使用 Set
  [key: string]: Set<string>;
}
export interface FIRSTArrayObject {
  // 最终输出文件的时候回转换为 string[]
  // 以便 JSON.stringify 来处理
  [key: string]: string[];
}


export class GrammarAll {
  grammar: Production[];
  terminals: Set<string>;
  nonTerminals: Set<string>;
  constructor(grammar: Production[], terminals: Set<string>, nonTerminals: Set<string>) {
    this.grammar = grammar
    this.terminals = terminals
    this.nonTerminals = nonTerminals
  }
  toString() {
    let res = `grammar = ${this.grammar.toString()}
        terminals = ${[...this.terminals].toString()}
        nonTerminals = ${[...this.nonTerminals].toString()}`
  }
}