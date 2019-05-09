import * as lexical from '../src/lexical/index'
import 'should'
import * as path from 'path'

const codeFiles: string[] = [
  path.resolve(__dirname, './code/demo.c'),
  path.resolve(__dirname, './code/comment.c'),
  path.resolve(__dirname, './code/char.c'),
  path.resolve(__dirname, './code/string.c'),
  path.resolve(__dirname, './code/boolIntFloat.c'),
  path.resolve(__dirname, './code/keyword.c'),
  path.resolve(__dirname, './code/identifier.c'),
  path.resolve(__dirname, './code/final.c')
]
const symTableOutPaths: string[] = [
  path.resolve(__dirname, './code/demo.c.symTable.json'),
  path.resolve(__dirname, './code/comment.c.symTable.json'),
  path.resolve(__dirname, './code/char.c.symTable.json'),
  path.resolve(__dirname, './code/string.c.symTable.json'),
  path.resolve(__dirname, './code/boolIntFloat.c.symTable.json'),
  path.resolve(__dirname, './code/keyword.c.symTable.json'),
  path.resolve(__dirname, './code/identifier.c.symTable.json'),
  path.resolve(__dirname, './code/final.c.symTable.json')
]
const tokenSequenceOutPaths: string[] = [
  path.resolve(__dirname, './code/demo.c.tokenSequence.txt'),
  path.resolve(__dirname, './code/comment.c.tokenSequence.txt'),
  path.resolve(__dirname, './code/char.c.tokenSequence.txt'),
  path.resolve(__dirname, './code/string.c.tokenSequence.txt'),
  path.resolve(__dirname, './code/boolIntFloat.c.tokenSequence.txt'),
  path.resolve(__dirname, './code/keyword.c.tokenSequence.txt'),
  path.resolve(__dirname, './code/final.c.tokenSequence.txt'),
  path.resolve(__dirname, './code/final.c.tokenSequence.txt')
]

describe('lexical', function () {
  // it('should parse 注释', function () {
  //   lexical.parseFile(codeFiles[1], symTableOutPaths[1], tokenSequenceOutPaths[1])
  // })
  // it('should parse 字符常量', function () {
  //   lexical.parseFile(codeFiles[2], symTableOutPaths[2], tokenSequenceOutPaths[2])
  // })
  // it('should parse 字符串常量', function () {
  //   lexical.parseFile(codeFiles[3], symTableOutPaths[3], tokenSequenceOutPaths[3])
  // })
  // it('should parse 布尔/整数/浮点数常量', function () {
  //   lexical.parseFile(codeFiles[4], symTableOutPaths[4], tokenSequenceOutPaths[4])
  // })
  // it('should parse 关键字', function () {
  //   lexical.parseFile(codeFiles[5], symTableOutPaths[5], tokenSequenceOutPaths[5])
  // })
  // it('should parse 标识符', function () {
  //   lexical.parseFile(codeFiles[6], symTableOutPaths[6], tokenSequenceOutPaths[6])
  // })
  // it('should parse 语法错误', function () {
  //   lexical.parseFile(codeFiles[0], symTableOutPaths[0], tokenSequenceOutPaths[0])
  // })
  it('should parse FINAL', function () {
    lexical.parseFile(codeFiles[7], symTableOutPaths[7], tokenSequenceOutPaths[7])
  })
})
