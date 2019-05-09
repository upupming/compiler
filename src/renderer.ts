import { readFileSync } from "fs";
import { resolve, join } from "path";
import { parse, parseFile } from "./lexical";
import { calTable, calFIRST, doShiftReduce } from "./grammar";
import { GrammarTreeNode } from "./grammar/types";
import { CodeGenerator } from "./semantic/while";

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const sourceCodeTextArea = <HTMLInputElement>document.getElementById("sourceCode")
const tokenSequenceTextArea = <HTMLInputElement>document.getElementById("tokenSequence")
const grammarTreeTextArea = <HTMLInputElement>document.getElementById("grammarTree")
const quadCodeTextArea = <HTMLInputElement>document.getElementById("quadCode")

const sourceCodeFile = resolve('test/code/final.c')
const symTableFile = resolve('test/code/final.c.symTable.json')
const tokenSeqFile = resolve('test/code/final.c.tokenSequence.txt')
const grammarFile = resolve('test/semantic/while.txt')
const FIRSTFile = resolve('test/semantic/while.FIRST.json')
const tableFile = resolve('test/semantic/while.table.json')

sourceCodeTextArea.value = readFileSync(sourceCodeFile).toString()



const lexicalButton = document.getElementById('lexical')

lexicalButton.onclick = function() {
    parseFile(sourceCodeFile, symTableFile, tokenSeqFile)
    tokenSequenceTextArea.value = readFileSync(tokenSeqFile).toString();
    (<any>$("textarea")).setTextareaCount();
}

const grammarButton = document.getElementById('grammar')

let root 
grammarButton.onclick = function() {
    calFIRST(grammarFile, FIRSTFile)
    calTable(grammarFile, FIRSTFile, tableFile)
    calTable(grammarFile, FIRSTFile, tableFile)
    root = doShiftReduce(tableFile, tokenSeqFile, grammarFile)
    let grammarTreeString = ''
    let consoleLog = console.log
    console.log = function(str) {
        grammarTreeString += str + '\n'
    }
    const printTree = require('print-tree');
    grammarTreeTextArea.value = printTree(
        root,
        (node: GrammarTreeNode) => node.toString(),
        (node: GrammarTreeNode) => node.children
    )
    console.log = consoleLog
    grammarTreeTextArea.value = grammarTreeString;
    (<any>$("textarea")).setTextareaCount();
}

const semanticButton = document.getElementById('semantic')

semanticButton.onclick = function() {
    let generator = new CodeGenerator(root)
    generator.generate()
    quadCodeTextArea.value = generator.code.toString();
    (<any>$("textarea")).setTextareaCount();
}

