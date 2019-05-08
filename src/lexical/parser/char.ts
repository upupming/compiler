import { logger, isChar, TypesOfChar } from "../../utils";
import * as fs from 'fs';

function parseCharacter(sourceFileDescriptor: number, symTableOutDescriptor: number, tokenSequenceOutDescriptor: number, symTable, currentPosition): [string, number] {
    let state = 2
    const accStates = [5]
    const label = 'character'
    let value: string
    /**
     * Returns -1 if the input is not valid, else returns the nextState, DFA 状态转移表
     * @param currentState 
     * @param input 
     */
    function getNextState(currentState: number, input: number): number {
      switch(currentState) {
        case 2:
          if (isChar(TypesOfChar.backslash, input)) {
            value = String.fromCharCode(input)
            return 4
          }
          else if (isChar(TypesOfChar.character, input)) {
            value = String.fromCharCode(input)
            return 5
          }
        case 4:
          let charString = String.fromCharCode(input)
          switch (charString) {
            case 'a':
            case 'f':
            case 'n':
            case 'r':
            case 't':
            case 'v':
            case 'b':
            case '\\':
            case "'":
            case '"':
            case '?':
            case 'o':
              value = '\\' + charString
              return 5
          } 
        default: 
          return -1
      }
    }
    let byte = Buffer.alloc(1)
    while (fs.readSync(sourceFileDescriptor, byte, 0, 1, currentPosition++) > 0) {
      // fs.writeSync(tokenSequenceOutDescriptor, byte)
  
      let newState = getNextState(state, byte[0])
      logger.info(`${label} state: ${state}, byte read: ${byte.toString()}, new state: ${newState}`)
      state = newState
      if (state == -1) {
        throw new Error(`${label} lexical error: ${String.fromCharCode(byte[0])}`)
      }
      else if (accStates.includes(state)) {
        logger.success(`Accepted a ${label}`)
        // // 输出 token
        // if (fs.writeSync(
        //   tokenSequenceOutDescriptor,
        //   `<${label}, ${String.fromCharCode(value)}>\n`
        // ) <= 0) {
        //   logger.error('Written token sequence failed')
        // }
        return [value, currentPosition]
      }
    }
  }
  
  function parseChar (sourceFileDescriptor: number, symTableOutDescriptor: number, tokenSequenceOutDescriptor: number, symTable, currentPosition): number {
    // 由于在主函数 parse 中已经读取完 ' 了，目前已经进入了状态 2
    let state = 2
    const accStates = [4]
    const label = 'VAR_CHAR'
    let value: string
    /**
     * Returns -1 if the input is not valid, else returns the nextState, DFA 状态转移表
     * @param currentState 
     * @param input 
     */
    function getNextState(currentState: number, input: number): number {
      switch(currentState) {
        case 1:
          if (isChar(TypesOfChar.single_quote, input)) {
            return 2
          }
        case 2:
          [value, currentPosition] = parseCharacter(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, currentPosition)
          return 3
        case 3:
          if (isChar(TypesOfChar.single_quote, input)) {
            return 4
          } 
        default: 
          return -1
      }
    }
    let byte = Buffer.alloc(1)
    // 状态为 2 时无需读入输入，而是转由 parseCharacter 进行处理
    if (state == 2) {
      [value, currentPosition] = parseCharacter(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, currentPosition)
      state = 3
    }
    while (fs.readSync(sourceFileDescriptor, byte, 0, 1, currentPosition++) > 0) {
      // fs.writeSync(tokenSequenceOutDescriptor, byte)
  
      let newState = getNextState(state, byte[0])
      logger.info(`${label} state: ${state}, byte read: ${byte.toString()}, new state: ${newState}`)
      state = newState
      if (state == -1) {
        throw new Error(`${label} lexical error: ${String.fromCharCode(byte[0])}`)
      }
      else if (accStates.includes(state)) {
        logger.success(`Accepted a ${label}`)
        // 输出 token
        if (fs.writeSync(
          tokenSequenceOutDescriptor,
          `<${label}, ${value}>\n`
        ) <= 0) {
          logger.error('Written token sequence failed')
        }
        symTable[label].indexOf(value) === -1 && symTable[label].push(value)
        return currentPosition
      }
  
      // 得到的新状态为 2 时无需读入输入，而是转由 parseCharacter 进行处理
      if (state == 2) {
        [value, currentPosition] = parseCharacter(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, currentPosition)
        state = 3
      }
    }
  }

export {
    parseCharacter,
    parseChar
}