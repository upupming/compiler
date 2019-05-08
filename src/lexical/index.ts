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
  // 当前对源代码文件读取所处的位置
  let currentPosition = 0
  
  let symTable = emptySymTable
  // console.log(symTable)

  let byte = Buffer.alloc(1)
  // Read all bytes until 0 byte read
  // 每次读入一个新的字符之后，更新文件位置索引
  while (fs.readSync(sourceFileDescriptor, byte, 0, 1, currentPosition++) > 0) {
    logger.info(`top level byte read: ${byte.toString()}: ${byte[0]}, currentPosition = ${currentPosition}`)
    // fs.writeSync(tokenSequenceOutDescriptor, byte)
    let byteString = byte.toString()
    switch (byteString) {
      case '/':
        // 比如现在已经读取到的是 /，那么把下一个位置传过去
        currentPosition = parseCommentOrDIV(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, currentPosition)
        break
      case "'":
        // 比如现在已经读取到的是 '，那么把下一个位置传过去
        currentPosition = parseChar(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, currentPosition)
        break
      case '"':
        // 比如现在已经读取到的是 "，那么把下一个位置传过去
        currentPosition = parseString(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, currentPosition)
        break
      case '0':
      case '1':
      case '+':
      case '-':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        // 比如现在已经读取到的是 0, 1，那么把这个位置传过去
        currentPosition = parseBoolOrNumber(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, currentPosition-1) + 1
        break
      default:
        if(isChar(TypesOfChar.whites, byte[0])) {
          logger.info(`Ignored white character (ASCII): ${byte[0]}`)
        }
        // 关键字
        else {
          logger.info(`Trying to parse ${byte} as keyword...`)
          // 从当前读到字符的位置开始，识别 keyword
          let success = false;
          [success, currentPosition] = parseKeyword(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, currentPosition-1)
          if (!success) {
            currentPosition += 1
            logger.info(`Trying to parse ${byte.toString()} as identifier...`);
            // 构造不出关键字时，构造标识符
            [success, currentPosition] = parseIdentifier(sourceFileDescriptor, symTableOutDescriptor, tokenSequenceOutDescriptor, symTable, currentPosition-1)
            if (!success) {
              currentPosition += 1
            }
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
