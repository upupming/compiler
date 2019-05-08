import { logger, isChar, TypesOfChar } from "../../utils";
import * as fs from 'fs'

export function parseIdentifier (sourceFileDescriptor: number, symTableOutDescriptor: number, tokenSequenceOutDescriptor: number, symTable, currentPosition):[boolean, number] {
    let beginPosition = currentPosition
    let value = ''
    let state = 1
    const accStates = [2]
    const label = 'IDN'
    // logger.info(`${label} state: ${state}, byte read: ${String.fromCharCode(nowValue)}, new state: ${state}`)
    /**
     * Returns -1 if the input is not valid, else returns the nextState, DFA 状态转移表
     * @param currentState 
     * @param input 
     */
    function getNextState(currentState: number, input: number): number {
      switch(currentState) {
        case 1:
          if (isChar(TypesOfChar.letter, input)) {
            value += String.fromCharCode(input)
            return 2
          }
        case 2:
          if (isChar(TypesOfChar.letter_, input)) {
            value += String.fromCharCode(input)
            return 2
          }
          else if (isChar(TypesOfChar.digit, input)) {
            value += String.fromCharCode(input)
            return 2
          }
        default:
          return -1
      }
    }
    let byte = Buffer.alloc(1)
    while (fs.readSync(sourceFileDescriptor, byte, 0, 1, currentPosition++) > 0) {
      // fs.writeSync(tokenSequenceOutDescriptor, byte)
  
      let newState = getNextState(state, byte[0])
      logger.info(`${label} state: ${state}, byte read: ${byte.toString()}, new state: ${newState}, new value: ${value}`)
      if (newState == -1) {
        if (accStates.includes(state)) {
          logger.success(`Accepted a ${label}: ${value}`)
          // 输出 token
          if (fs.writeSync(
            tokenSequenceOutDescriptor,
            `<${label}, ${value}>\n`
          ) <= 0) {
            logger.error('Written token sequence failed')
          }
          //  写入符号表
          symTable[label].indexOf(value) === -1 && symTable[label].push(value)
          // 但是这里多读了一个字符，我们将其用返回值还给 caller
          return [true, currentPosition-1]
        }
        // 如果当前不处于终止状态，则直接返回，因为无法识别这个标识符
        return [false, beginPosition]
      } else {
        state = newState
      }
    }
    if (accStates.includes(state)) {
      // 处理文件结束的情况
      // 文件结束处理
      logger.success(`Accepted a ${label}`)
      // 输出 token
      if (fs.writeSync(
        tokenSequenceOutDescriptor,
        `<${label}, ${value}>\n`
      ) <= 0) {
        logger.error('Written token sequence failed')
      }
      //  写入符号表
      symTable[label].indexOf(value) === -1 && symTable[label].push(value)
      return currentPosition
    } else {
      throw new Error(`${label} lexical error: unexpected terminal`)
    }
  }
  