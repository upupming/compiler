import { logger } from "../../utils";
import { parseCharacter } from "./char";
import * as fs from 'fs';

export function parseString (sourceFileDescriptor: number, symTableOutDescriptor: number, tokenSequenceOutDescriptor: number, symTable, currentPosition): number {
    const label = 'VAR_STR'
    let value = ''
    // 状态为 2 时无需读入输入，而是转由 parseCharacter 进行处理
    while (true) {
      let tmp
      [tmp, currentPosition] = parseCharacter(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, currentPosition)
      if (tmp == '"') {
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
      } else {
        value += tmp
      }
    }
  }