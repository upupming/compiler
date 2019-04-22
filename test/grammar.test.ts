import * as grammar from '../src/grammar/index'
import 'should'
import * as path from 'path'
import { parseFile } from '../src/lexical';


describe('working on grammar components', function () {

  const tablePath = path.resolve(__dirname, 'table/demo.json')
  const codePath = path.resolve(__dirname, 'grammar-components/demo.c')
  const grammarPath = path.resolve(__dirname, 'grammar-components/grammar.txt')
  const FIRSTPath = path.resolve(__dirname, 'grammar-components/FIRST.json')
  const tableOutputPath = path.resolve(__dirname, 'grammar-components/table.json')

  // it('should parse 赋值语句', function () {
  //   grammar.doShiftReduce(tablePath, codePath, grammarPath)
  // })
  // it('should generate FIRST 集合', function () {
  //   grammar.calFIRST(grammarPath, FIRSTPath)
  // })
  // it('should generate LR Table', function () {
  //   grammar.calTable(grammarPath, FIRSTPath, tableOutputPath)
  // })
})

describe('real application', function () {
  const sourcePaths = [
    '',
    path.resolve(__dirname, 'grammar-app/while.c'),
  ]
  const grammarPaths = [
    path.resolve(__dirname, 'grammar-app/declaration.txt'),
    path.resolve(__dirname, 'grammar-app/while.txt'),
    path.resolve(__dirname, 'grammar-app/while-correct.txt'),
  ]

  function roundTrip(grammarPath: string) {
    const dirname = path.dirname(grammarPath)
    const grammarBasename = path.basename(grammarPath, '.txt')
    const FIRSTPath = path.resolve(dirname, grammarBasename + '.FIRST.txt')
    const tablePath = path.resolve(dirname, grammarBasename + '.table.json')
    const codePath = path.resolve(dirname, grammarBasename + '.tokens.txt')

    grammar.calFIRST(grammarPath, FIRSTPath)
    grammar.calTable(grammarPath, FIRSTPath, tablePath)
    grammar.doShiftReduce(tablePath, codePath, grammarPath)
  }

  function parseRoundTip(sourcePath: string) {
    const dirname = path.dirname(sourcePath)
    const sourceBasename = path.basename(sourcePath, '.c')
    const symTablePath = path.resolve(dirname, sourceBasename + '.symTable.txt')
    const tokenSeqPath = path.resolve(dirname, sourceBasename + '.tokens.txt')
    parseFile(sourcePath, symTablePath, tokenSeqPath)
    return tokenSeqPath
  }

  it('should round trip', function () {
    // parseRoundTip(sourcePaths[1])
    roundTrip(grammarPaths[1])
  })

})
