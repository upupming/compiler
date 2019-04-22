import { logger } from "../../utils";
import * as fs from 'fs'

export function parseKeyword(sourceFileDescriptor: number, symTableOutDescriptor: number, tokenSequenceOutDescriptor: number, symTable, nowValue: number) {
  let state = getNextState(1, nowValue)
  if (state == -1) {
    return nowValue
  }
  logger.info(`current state: ${state}`)
  const accStatesAndResults = {
    2: 'LNOT',
    3: 'NEQ',
    4: 'MOD',
    5: 'BAND',
    6: 'LAND',
    7: 'MUL',
    8: 'ADD',
    9: 'INC',
    10: 'MINUS',
    11: 'DEC',
    13: 'LT',
    14: 'BLSFT',
    15: 'GE',
    16: 'ASS',
    17: 'EQL',
    18: 'GT',
    19: 'GE',
    20: 'BRSFT',
    21: 'BXOR',
    223: 'BOOL',
    242: 'CHAR',
    252: 'CASE',
    261: 'DO',
    273: 'ELSE',
    284: 'FLOAT',
    293: 'GOTO',
    31: 'IF',
    321: 'INT',
    344: 'STRUCT',
    354: 'SWITCH',
    363: 'VOID',
    374: 'WHILE',
    38: 'BOR',
    39: 'LOR',
    40: 'BNOT',
    41: 'SIMI',
    42: 'LBAC',
    43: 'RBAC',
    44: 'LPAR',
    45: 'RPAR',
    46: 'LBRA',
    47: 'RBRA'
  }
  const label = 'Keyword'
  /**
   * Returns -1 if the input is not valid, else returns the nextState, DFA 状态转移表
   * @param currentState 
   * @param input 
   */
  function getNextState(currentState: number, input: number): number {
    switch (currentState) {
      case 1:
        switch (String.fromCharCode(input)) {
          case '!':
            return 2
          case '%':
            return 4
          case '&':
            return 5
          case '*':
            return 7
          case '+':
            return 8
          case '-':
            return 10
          case '<':
            return 13
          case '=':
            return 16
          case '>':
            return 18
          case '^':
            return 21
          case 'b':
            return 22
          case 'c':
            return 23
          case 'd':
            return 26
          case 'e':
            return 27
          case 'f':
            return 28
          case 'g':
            return 29
          case 'i':
            return 30
          case 's':
            return 33
          case 'v':
            return 36
          case 'w':
            return 37
          case '|':
            return 38
          case '~':
            return 40
          case ';':
            return 41
          case '{':
            return 42
          case '}':
            return 43
          case '(':
            return 44
          case ')':
            return 45
          case '[':
            return 46
          case ']':
            return 47
          default:
            return -1
        }
      case 2:
        if (String.fromCharCode(input) == '=') {
          return 3
        }
      case 5:
        if (String.fromCharCode(input) == '&') {
          return 6
        }
      case 8:
        if (String.fromCharCode(input) == '+') {
          return 9
        }
      case 10:
        if (String.fromCharCode(input) == '-') {
          return 11
        }
      case 13:
        if (String.fromCharCode(input) == '<') {
          return 14
        }
        if (String.fromCharCode(input) == '=') {
          return 15
        }
      case 16:
        if (String.fromCharCode(input) == '=') {
          return 17
        }
      case 18:
        if (String.fromCharCode(input) == '=') {
          return 19
        }
        if (String.fromCharCode(input) == '>') {
          return 20
        }
      case 22:
        if (String.fromCharCode(input) == 'o') {
          return 221
        }
      case 221:
        if (String.fromCharCode(input) == 'o') {
          return 222
        }
      case 222:
        if (String.fromCharCode(input) == 'l') {
          // 接收状态，bool
          return 223
        }
      case 23:
        if (String.fromCharCode(input) == 'a') {
          return 25
        }
        if (String.fromCharCode(input) == 'h') {
          return 24
        }
      case 24:
        if (String.fromCharCode(input) == 'a') {
          return 241
        }
      case 241:
        if (String.fromCharCode(input) == 'r') {
          // 接收状态，char
          return 242
        }
      case 25:
        if (String.fromCharCode(input) == 's') {
          return 251
        }
      case 251:
        if (String.fromCharCode(input) == 'e') {
          // 接收状态，case
          return 252
        }
      case 26:
        if (String.fromCharCode(input) == 'o') {
          // 接收状态，do
          return 261
        }
      case 27:
        if (String.fromCharCode(input) == 'l') {
          return 271
        }
      case 271:
        if (String.fromCharCode(input) == 's') {
          return 272
        }
      case 272:
        if (String.fromCharCode(input) == 'e') {
          // 接收状态，else
          return 273
        }
      case 28:
        if (String.fromCharCode(input) == 'l') {
          return 281
        }
      case 281:
        if (String.fromCharCode(input) == 'o') {
          return 282
        }
      case 282:
        if (String.fromCharCode(input) == 'a') {
          return 283
        }
      case 283:
        if (String.fromCharCode(input) == 't') {
          // 接收状态，float
          return 284
        }
      case 29:
        if (String.fromCharCode(input) == 'o') {
          return 291
        }
      case 291:
        if (String.fromCharCode(input) == 't') {
          return 292
        }
      case 292:
        if (String.fromCharCode(input) == 'o') {
          // 接收状态，goto
          return 293
        }
      case 30:
        if (String.fromCharCode(input) == 'f') {
          // 接收状态，if
          return 31
        }
        else if (String.fromCharCode(input) == 'n') {
          return 32
        }
      case 32:
        if (String.fromCharCode(input) == 't') {
          // 接收状态，int
          return 321
        }
      case 33:
        if (String.fromCharCode(input) == 't') {
          return 34
        }
        else if (String.fromCharCode(input) == 'w') {
          return 35
        }
      case 34:
        if (String.fromCharCode(input) == 'r') {
          return 341
        }
      case 341:
        if (String.fromCharCode(input) == 'u') {
          return 342
        }
      case 342:
        if (String.fromCharCode(input) == 'c') {
          return 343
        }
      case 343:
        if (String.fromCharCode(input) == 't') {
          // 接收状态，struct
          return 344
        }
      case 35:
        if (String.fromCharCode(input) == 'i') {
          return 351
        }
      case 351:
        if (String.fromCharCode(input) == 't') {
          return 352
        }
      case 352:
        if (String.fromCharCode(input) == 'c') {
          return 353
        }
      case 353:
        if (String.fromCharCode(input) == 'h') {
          // 接收状态，switch
          return 354
        }
      case 36:
        if (String.fromCharCode(input) == 'o') {
          return 361
        }
      case 361:
        if (String.fromCharCode(input) == 'i') {
          return 362
        }
      case 362:
        if (String.fromCharCode(input) == 'd') {
          // 接收状态，void
          return 363
        }
      case 37:
        if (String.fromCharCode(input) == 'h') {
          return 371
        }
      case 371:
        if (String.fromCharCode(input) == 'i') {
          return 372
        }
      case 372:
        if (String.fromCharCode(input) == 'l') {
          return 373
        }
      case 373:
        if (String.fromCharCode(input) == 'e') {
          // 接收状态，while
          return 374
        }
      case 38:
        if (String.fromCharCode(input) == '|') {
          // 接收状态，||
          return 39
        }
      default:
        return -1
    }
  }
  let byte = Buffer.alloc(1)
  while (fs.readSync(sourceFileDescriptor, byte, 0, 1, null)) {
    fs.writeSync(tokenSequenceOutDescriptor, byte)

    let newState = getNextState(state, byte[0])
    logger.info(`${label} state: ${state}, byte read: ${byte.toString()}, new state: ${newState}`)

    if (newState == -1) {
      if (Object.keys(accStatesAndResults).includes(state + '')) {
        logger.success(`Accepted a ${accStatesAndResults[state]}`)
        // 输出 token
        if (fs.writeSync(
          tokenSequenceOutDescriptor,
          `\n<${accStatesAndResults[state]}, ${symTable[accStatesAndResults[state]]}>\n`
        ) <= 0) {
          logger.error('Written token sequence failed')
        }
        // 但是这里多读了一个字符，我们将其用返回值还给 caller
        return byte[0]
      }
      // // 如果当前不处于终止状态，则报错
      // else throw new Error(`${label} lexical error: ${String.fromCharCode(byte[0])}`)
      else {
        return byte[0]
      }
    } else {
      state = newState
    }
  }
  if (Object.keys(accStatesAndResults).includes(state + '')) {
    // 文件结束处理
    logger.success(`Accepted a ${accStatesAndResults[state]}`)
    // 输出 token
    if (fs.writeSync(
      tokenSequenceOutDescriptor,
      `\n<${accStatesAndResults[state]}, ${symTable[accStatesAndResults[state]]}>\n`
    ) <= 0) {
      logger.error('Written token sequence failed')
    }
    return
  } else {
    throw new Error(`${label} lexical error: unexpected terminal`)
  }
}