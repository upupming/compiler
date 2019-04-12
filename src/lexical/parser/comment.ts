import { isChar, TypesOfChar, logger } from "../../utils";
import * as fs from 'fs'

export function parseCommentOrDIV (sourceFileDescriptor: number, symTableOutDescriptor: number, tokenSequenceOutDescriptor: number, symTable):number {
    let state = 2
		const accStatesAndResults = {
      2: 'DIV',
      5: 'CMT',
    }
    const label = 'CMT/DIV'
    /**
     * Returns -1 if the input is not valid, else returns the nextState, DFA 状态转移表
     * @param currentState 
     * @param input 
     */
    function getNextState(currentState: number, input: number): number {
      switch(currentState) {
        case 1:
          if (isChar(TypesOfChar.slash, input)) {
            return 2
          }
        case 2:
          if (isChar(TypesOfChar.asterisk, input)) {
            return 3
          }
        case 3:
          if (isChar(TypesOfChar.not_asterisk, input)) {
            return 3
          } 
          else if (isChar(TypesOfChar.asterisk, input)) {
            return 4
          }
        case 4:
          if (isChar(TypesOfChar.slash, input)) {
            return 5
          }
          else if (isChar(TypesOfChar.not_asterisk, input)) {
            return 3
          }
          else if (isChar(TypesOfChar.asterisk, input)) {
            return 4
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
				if (Object.keys(accStatesAndResults).includes(state+'')) {
					logger.success(`Accepted a ${accStatesAndResults[state]}`)
					// 输出 token
					if (fs.writeSync(
						tokenSequenceOutDescriptor,
						`\n<${label}, ${symTable[label]}>\n`
					) <= 0) {
						logger.error('Written token sequence failed')
					}
					// 但是这里多读了一个字符，我们将其用返回值还给 caller
					return byte[0]
				}
        // 如果当前不处于终止状态，则报错
				else throw new Error(`${label} lexical error: ${String.fromCharCode(byte[0])}`)
      } else {
				state = newState
			}
    }
    if (!Object.keys(accStatesAndResults).includes(state+'')) {
      throw new Error(`${label} lexical error: unexpected terminal`)
    }
  }