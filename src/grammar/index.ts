import { readFileSync, openSync, readSync, read, writeFileSync, stat } from "fs";
import * as assert from 'assert'
import * as _ from 'lodash'
import { Item, LRProduction, FIRSTSetObject, FIRSTArrayObject, LRTable, Production, GrammarAll, GrammarTreeNode } from "./types";

/**
 * 从文件读取文法，转为数据结构
 * 每个产生式会生成唯一 id
 * @param grammarPath 
 */
function getGrammar(grammarPath: string): GrammarAll {
  let fileContent = readFileSync(grammarPath, 'utf-8')
  let productionsRaw = (fileContent.trim().split(/\r?\n/))
  // console.log(`productionsRaw = ${productionsRaw}`)
  let grammar: Production[] = productionsRaw.map(pStr => {
    // console.log(`pStr: ${pStr}`)
    let left = pStr.slice(0, pStr.indexOf('：') - pStr.length)
    let rights = pStr.slice(pStr.indexOf('：') + 1).split('，')
    if (_.isEqual(rights, [''])) {
      rights = []
    }
    // 右部为空的情况
    if (rights == ['']) {
      rights = []
    }
    return new Production(
      left,
      rights
    )
  })

  let terminals = new Set()
  let nonTerminals = new Set()
  grammar.forEach(production => {
    // console.log(production)
    nonTerminals.add(production.left)
    production.rights.forEach((right: string) => {
      terminals.add(right)
    })
  })
  for (let elem of nonTerminals) {
    terminals.delete(elem)
  }

  return {
    grammar,
    terminals,
    nonTerminals
  }
}

function printItem(tag: string, item: Item) {
  console.log(`${tag}:`)
  console.log(item.toString())
}

function doShiftReduce(tablePath: string, codePath: string, grammarPath: string): GrammarTreeNode|undefined {
  // console.log(`Reading table before parsing...`)
  let tableRaw = JSON.parse(readFileSync(tablePath, 'utf-8'))
  let table = LRTable.fromRaw(tableRaw)
  table.print()

  let { grammar } = getGrammar(grammarPath)
  // console.log(`grammar read = 
  // ${grammar.toString()}`)
  // console.log()

  let stateStack = ['0']
  let symbolStack = ['$']
  let nodeStack = []

  let sourceCode = readFileSync(codePath, 'utf-8')
  // console.log(`Source code
  //   ${sourceCode}`)
  let regex = /<(.*), (.*)>/g
  let matches: RegExpExecArray|null
  let inputTokens: string[] = [], inputValues = []
  while (matches = regex.exec(sourceCode)) {
    inputTokens.push(matches[1]);
    inputValues.push(matches[2]);
  }
  inputTokens.push('$')
  inputValues.push('null')
  let pos = 0
  while (true) {

    let print = function () {
      let a = `State stack: [${stateStack}]`
      let b = `Symbol stack: [${symbolStack}]`
      let c = `Input left: [${inputTokens.slice(pos)}]`
      console.log(`${a.padEnd(50)} ${b.padEnd(50)} ${c.padEnd(50)}`)
    }
    print()

    let state = stateStack[stateStack.length - 1]
    let token: string = inputTokens[pos]
    let value: string = inputValues[pos]

    console.log(`Processing state ${state} input token ${token}`)
    let action = table.ACTION[state][token]
    console.log(`ACTION[${state}][${token}] = ${action}`)
    if (!action) {
      throw new Error(`Grammar error at pos ${pos}, no state to go: ${token}`)
    }
    // acc
    if (action == 'acc') {
      console.log(`Congratulations, the grammar is okay!`)
      // 必然只有最终一个父结点，就是文法的开始符号
      assert(nodeStack.length == 1)
      let root = new GrammarTreeNode("S'", 'null', [nodeStack.pop() as GrammarTreeNode], 0)
      return root
    }
    // Shift
    if (action[0] == 's') {
      console.log(`Shift ${token} and push ${action.slice(1)} to state stack`)
      stateStack.push(action.slice(1))
      symbolStack.push(token)
      
      // 终结符移入时，创建新的语法树结点
      let node = new GrammarTreeNode(token, value, [], -1)
      nodeStack.push(node)
      pos++
    }
    let tempStack: GrammarTreeNode[] = []
    // Reduce
    if (action[0] == 'r') {
      let reduceProduction = grammar[parseInt(action.slice(1))]
      // 规约时，新建父节点
      let parentNode = new GrammarTreeNode(reduceProduction.left, 'null', [], reduceProduction.productionNumber)
      for (let i = 0; i < reduceProduction.rights.length; i++) {
        stateStack.pop()
        let temp = symbolStack.pop()
        assert.deepEqual(temp, reduceProduction.rights[reduceProduction.rights.length - 1 - i])
      
        // 父节点指向所有子节点
        let tempNode = nodeStack.pop() as GrammarTreeNode
        assert.deepEqual(tempNode.token, temp)
        tempStack.push(tempNode)
      }
      parentNode.children.push(...tempStack.reverse())
      symbolStack.push(reduceProduction.left)
      // 压入父节点
      nodeStack.push(parentNode)
      console.log(`Reduce using production: ${reduceProduction.toString()}`)
      print()
      // GOTO
      let goto = table['GOTO'][stateStack[stateStack.length - 1]][reduceProduction.left]
      if (!goto) {
        throw new Error(`No new state to go after reduce: ${reduceProduction.toString()}`)
      } else {
        console.log(`Goto state ${goto}`)
        stateStack.push(goto)
      }
    }
  }
}

function calFIRST(grammarPath: string, FIRSTPath: string) {
  console.log('Read grammar:')
  let grammarAll = getGrammar(grammarPath)
  console.log(grammarAll)


  let terminals = grammarAll.terminals
  let nonTerminals = grammarAll.nonTerminals
  let grammar = grammarAll.grammar

  // console.log(terminals.keys())

  let FIRST: FIRSTSetObject = {}
  let changed = true
  /**
   * 记录一个符号的 FIRST 符号
   * @param key 符号
   * @param values FIRST 符号
   */
  function addOrPut(key: string, values: string[] | Set<string>) {
    let old = JSON.stringify(Array.from(FIRST[key] || []))
    if (!FIRST[key]) {
      FIRST[key] = new Set(values)
    } else {
      FIRST[key] = new Set([...FIRST[key], ...values])
    }
    // console.log(`old = ${old}`)
    // console.log(`new = ${JSON.stringify(Array.from(FIRST[key]))} `)
    if (!changed) {
      changed = old !== JSON.stringify(Array.from(FIRST[key]))
    }
  }
  // console.log(FIRST)
  // 先计算终结符的 FIRST 集合
  for (let terminal of terminals.keys()) {
    FIRST[terminal] = new Set([terminal])
  }

  // 不断循环直到 FIRST 集不再改变
  while (changed) {
    changed = false
    console.log(`=================`)
    // 再计算非终结符，对产生式一条一条地进行处理
    // 如果X是一个非终结符，且X→Y1…Yk∈P (k≥1)，
    for (let production of grammar) {
      console.log(`正在处理 ${production.toString()}`)

      addOrPut(production.left, [])
      // 如果对于某个i，a 在FIRST (Yi ) 中且epsilon 在所有的FIRST(Y1) , … , FIRST(Yi-1)中(即Y1...Yi-1 * epsilon )，就把 a 加入到FIRST( X )中。
      let idx = 0
      while (production.rights[idx] && FIRST[production.rights[idx]] && FIRST[production.rights[idx]].has('epsilon')) {
        idx++
      }
      if (idx < production.rights.length && FIRST[production.rights[idx]]) {
        // console.log(`Adding FIRST(Y_${idx} = ${production.rights[idx]}) to FIRST of ${production.left} `)
        addOrPut(production.left, FIRST[production.rights[idx]])
      }
      // 如果对于所有的j = 1,2, . . . , k，epsilon 在FIRST(Yj)中，那么将 epsilon加入到 FIRST( X )
      let allEmptyString = true
      for (let right of production.rights) {
        if (!FIRST[right] || !FIRST[right].has('epsilon')) {
          allEmptyString = false
          break
        }
      }
      // A -> epsilon
      // console.log(`production.rights.length = ${production.rights.length}`)
      if (production.rights.length == 0) {
        allEmptyString = true
      }
      if (allEmptyString) {
        console.log('Adding epsilon to FIRST')
        addOrPut(production.left, ['epsilon'])
      }
      // 如果X→epsilon∈P，那么将 epsilon 加入到 FIRST( X )中
      if (production.rights == ['epsilon']) {
        console.log('Adding epsilon to FIRST')
        addOrPut(production.left, ['epsilon'])
      }
    }

    Production.finish()
  }

  let FIRSTArray: FIRSTArrayObject = {}
  // 转换为 Object 便于 JSON 处理
  Object.keys(FIRST).forEach(key => {
    FIRSTArray[key] = Array.from(FIRST[key])
  })

  console.log('计算得到的 FIRST 集如下：')
  console.log(FIRST)
  writeFileSync(FIRSTPath, JSON.stringify({
    terminals: Array.from(terminals),
    nonTerminals: Array.from(nonTerminals),
    FIRST: FIRSTArray
  }, null, 2))
}


/**
 * 读取之前生成的 FIRST 集文件
 * 返回一个对象，键值为符号，属性为 FIRST 集数组
 * @param FIRSTPath 
 */
function getFIRST(FIRSTPath: string): FIRSTArrayObject {
  return JSON.parse(readFileSync(FIRSTPath, 'utf-8'))['FIRST']
}


let state = 0
/**
 * 根据当前项目 I 构造项目集闭包，
 * I 的 state 必须确定，以供同一集族其他项目继承
 * @param I 
 * @param grammarAll 
 * @param FIRST 
 */
function getClosure(item: Item, grammarAll: GrammarAll, FIRST: FIRSTArrayObject): Item {
  // console.log('============== Begin getClosure ==============')
  // printItem('Initial Item', item)
  let nonTerminals = grammarAll.nonTerminals
  let grammar: Production[] = grammarAll.grammar
  // console.log(`typeof grammar: ${typeof grammar}`)
  // console.log(`typeof item.productions: ${typeof item.productions}`)
  let updating = true
  while (updating) {
    updating = false
    // 每个 LR 产生式 production 包含
    // left 属性、rights数组、index 值在 [0,n]之间、lookahead 表示展望符
    // for ( I中的每个项[A → α·Bβ，a ])
    for (let production of item.productions) {
      // 产生式符合 A → α·Bβ，a 的形式
      // console.log(`typeof production: ${typeof production}`)
      // 产生空串，不考虑；规约状态不考虑
      if (production.isReductionProduction()) {
        continue
      }
      let B = production.rights[production.index]
      // A → α·Bβ
      if (nonTerminals.has(B)) {
        // console.log(`A → α·Bβ production`)
        // console.log(`正在处理 production A → α·Bβ...`)
        console.log(production.toString())
        // console.log(`找到圆点后的非终结符 B = ${B} `)
        for (let aProduction of grammar) {
          // for (G'的每个产生式 B → γ)
          if (aProduction.left == B) {
            // console.log(`找到 aProduction ${B} → γ`)
            // console.log(`>>>`)
            // console.log(typeof aProduction)
            // console.log(aProduction.toString())
            // console.log(`>>>`)
            // for ( FIRST (βa)中的每个符号b )
            let key: string
            // 1. β 不存在，即 A → α·B
            if (production.rights.length == production.index + 1) {
              key = production.lookahead
            } else {
              key = production.rights[production.index + 1]
            }
            // console.log(`lookahead inherited from = ${key} `)
            // if (key != '$') {
            let newProduction: LRProduction
            if (key == '$') {
              // 注意，空产生式的话，rights 直接为空，这是由 getGrammar 保证的
              newProduction = new LRProduction(B, aProduction.rights, 0, '$', aProduction.productionNumber)
              updating = item.addProductionIfNotExist(newProduction)
              // printItem('添加之后的 item 集', item)
            } else {
              for (let b of FIRST[key]) {
                // 对应 beta 产生空的情况
                if (b == 'epsilon') {
                  newProduction = new LRProduction(B, aProduction.rights, 0, production.lookahead, aProduction.productionNumber)
                } else {
                  newProduction = new LRProduction(B, aProduction.rights, 0, b, aProduction.productionNumber)
                }
                updating = item.addProductionIfNotExist(newProduction)
                // printItem('添加之后的 item 集', item)
              }
            }
          }
        }
      }
    }
  }
  // console.log('============== End getClosure ==============')
  // item.state = state++
  return item
}

/**
 * GOTO 表，使用函数进行实现
 * 从一个项目集【param】到另一个项目集【return】
 * @param item 当前项目
 * @param X 遇到的符号
 * @param grammarAll 
 * @param FIRST 
 * @param state 新项目的状态号
 */
function goto(item: Item, X: string, grammarAll: GrammarAll, FIRST: FIRSTArrayObject): Item {
  // console.log(`====== Begin Goto function ===== `)
  // console.log(`Cal goto item = ${item.toString()} \n X = ${X} `)
  let J = new Item([])
  for (let production of item.productions) {
    // for ( I 中的每个项[A → α·Xβ，a ])
    if (production.isWaitingFor(X)) {
      J.productions.push(production.getNextLRProduction())
    }
  }
  // console.log(`J = ${J.toString()} `)
  let to = getClosure(J, grammarAll, FIRST)
  // console.log(`goto = ${to.toString()} `)
  // console.log(`====== End Goto function ===== `)
  return to
}

/**
 * 计算所有项目集
 * @param grammarAll 
 * @param FIRST 
 */
function getItems(grammarAll: GrammarAll, FIRST: FIRSTArrayObject, tableOutputPath: string): Item[] {
  // 初始化表为空
  // 之后每次计算 goto，要在 table 中的 GOTO 作相应的记录
  // 对于每个项目集，一旦发现有规约项目 A -> bc.，就在 ACTION 中作相应记录
  // 我们需要对每个 LR 产生式进行唯一的标号
  let table = new LRTable([...grammarAll.terminals], [...grammarAll.nonTerminals])

  // 从 Grammar 中的第一个产生式创建，要求其必须为 S' -> S
  assert(grammarAll.grammar[0].left == "S'")
  assert(_.isEqual(grammarAll.grammar[0].rights, ['S']), `Get first grammar rights of length ${grammarAll.grammar[0].rights.length}: ${grammarAll.grammar[0].rights.toString()}`)
  let initProduction = new LRProduction("S'", ['S'], 0, '$', grammarAll.grammar[0].productionNumber)
  let initItem = new Item([initProduction])
  // 所有项目集的数组
  let C: Item[] = [getClosure(initItem, grammarAll, FIRST)]
  let itemsUpdating = true
  while (itemsUpdating) {
    console.log(`new loop from getItems`)
    itemsUpdating = false

    for (let item of C) {

      function loopForX(X: string) {
        let newItem = goto(item, X, grammarAll, FIRST)
        // 非空且不在 C 中
        if (!newItem.isEmpty() && !C.some(i => i.equals(newItem))) {
          C.push(newItem)
          itemsUpdating = true
          table.goFromTo(item, newItem, X)
          console.log(`table.GOTO[${item.state}][${X}] = ${newItem.state}`)
          // console.log(`After updated, C = ${C.toString()} `)
        } else {
          // 重复的情况，
          // 或者为空的情况
          // 取消掉占用的 currentState
          Item.currentState--
        }
      }

      for (let X of [...grammarAll.nonTerminals, ...grammarAll.terminals]) {
        loopForX(X)
      }
      // 单独考虑空串
      // loopForX('epsilon')
    }
  }

  table.updateTable(C)
  table.print()
  table.saveToJson(tableOutputPath)
  writeFileSync(tableOutputPath + '.txt', table.toString())
  Production.finish()

  return C
}

/**
 * 计算 LR(1) 分析表
 * @param grammarPath 
 * @param FIRSTPath 
 */
function calTable(grammarPath: string, FIRSTPath: string, tableOutputPath: string) {
  let grammarAll = getGrammar(grammarPath)
  let { grammar, terminals, nonTerminals } = grammarAll
  let FIRST = getFIRST(FIRSTPath)
  // 构造 G' 的规范LR(1)项集族C = { I0, I1, … , In}
  let items = getItems(grammarAll, FIRST, tableOutputPath)

  console.log(`项目集族如下`)
  for (let i = 0; i < items.length; i++) {
    console.log(`第 ${i} 族`)
    console.log(items[i].toString())
  }
}

export {
  doShiftReduce,
  calFIRST,
  calTable
}