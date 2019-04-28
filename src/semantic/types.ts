import { GrammarAll } from "../grammar/types";

/**
 * Label
 * 可能未知，等待回填
 * 由
 */
export class Label {
  private static globalLabel = 1
  label: number
  constructor() {
    this.label = Label.globalLabel++
  }
}

export let Width4Type = {
  'INT': 4
};

/**
 * 布尔表达式
 */
export class Bool {
  labelWhenTrue: number;
  labelWhenFalse: number;
  trueList: number[] = []
  falseList: number[] = []
  constructor() {
    this.labelWhenFalse = this.labelWhenTrue = 0
  }
}

export class S {
  next: number;
}

/**
 * 四元式，组成部分有：
 * 操作符、操作数 1、操作数 2、结果
 */
export class Quaternary {
  private operator: string;
  private operand1: string;
  private operand2: string;
  // `result` 可能是 Label 但是却没有确定值
  public result: string|number;
  constructor(operator: string, operand1: string, operand2: string, result: string|number) {
    this.operator = operator;
    this.operand1 = operand1;
    this.operand2 = operand2;
    this.result = result;
  }
  toString() {
    return `(${this.operator}, ${this.operand1}, ${this.operand2}, ${this.result})`
  }
}

export class Code {
  private lines: Quaternary[] = [];
  gencode(operator, operand1, operand2, result) {
    this.lines.push(
      new Quaternary(operator, operand1, operand2, result)
    )
  }
  get nextLineNumber() {
    return this.lines.length + 1
  }
  backpatch(labelToLineNumber) {
    for (let line of this.lines) {
      // 暂未填行号
      if (line.result[0] === 'L') {
        line.result = labelToLineNumber[line.result]
      }
    }
  }
  toString() {
    let result = '';
    for (let i = 0; i < this.lines.length; i++) {
      let line = this.lines[i];
      result += `${i+1}. ${line.toString()}\n`
    }
    return result
  }
}

// export 

// export class GrammarWithActionsAll extends GrammarAll {
  
// }
