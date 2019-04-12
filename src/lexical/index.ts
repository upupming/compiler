import * as fs from 'fs'
import * as emptySymTable from './symTable.json';
import { parseCommentOrDIV } from './parser/comment';
import { isChar, TypesOfChar, logger } from '../utils/index';
import { parseChar } from './parser/char';
import { parseString } from './parser/string';
import { parseBoolOrNumber } from './parser/boolIntFloat';
import { parseKeyword } from './parser/keyword';
import { parseIdentifier } from './parser/identifier';

function parse (sourceFileDescriptor: number, symTableOutDescriptor: number, tokenSequenceOutDescriptor: number) {
  let symTable = emptySymTable
  // console.log(symTable)

  let byte = Buffer.alloc(1)
  // Read all bytes until 0 byte read
  while (byte[0] || fs.readSync(sourceFileDescriptor, byte, 0, 1, null)) {
    logger.info(`top level byte read: ${byte.toString()}`)
    fs.writeSync(tokenSequenceOutDescriptor, byte)
    let byteString = byte.toString()
    // 置空 byte，接受后续来的变化，用于外部循环判定
    let nowByte = byte
    byte = Buffer.alloc(1)
    switch (byteString) {
      case '/':
        byte[0] = parseCommentOrDIV(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable)
        break
      case "'":
        parseChar(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable)
        break
      case '"':
        parseString(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable)
        break
      case '0':
      case '1':
        byte[0] = parseBoolOrNumber(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, 1, byteString)
        break
      case '+':
      case '-':
        byte[0] = parseBoolOrNumber(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, 2, byteString)
        break
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        byte[0] = parseBoolOrNumber(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, 3, byteString)
        break
      default:
        if(isChar(TypesOfChar.whites, nowByte[0])) {
          logger.info(`Ignored white character (ASCII): ${nowByte[0]}`)
        }
        // 关键字
        else {
          byte[0] = parseKeyword(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, nowByte[0])
          if(isChar(TypesOfChar.whites, byte[0])) {
            logger.info(`Ignored white character (ASCII): ${byte[0]}`)
          } else {
            // 构造不出关键字时，构造标识符
            byte[0] = parseIdentifier(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, byte[0])
          }
        }
    }
  }

  // 将 symTable 写入文件
  fs.writeSync(symTableOutDescriptor, JSON.stringify(symTable, null, 2), 0, 'utf-8')
}

function parseFile (sourceFilePath: string, symTableOutPath: string, tokenSequenceOutPath: string) {
  const input = fs.openSync(sourceFilePath, 'r')
  const symbol = fs.openSync(symTableOutPath, 'w')
  const token = fs.openSync(tokenSequenceOutPath, 'w')
  parse(input, symbol, token)
}

export {
  parse,
  parseFile
}
