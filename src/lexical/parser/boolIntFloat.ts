import { isChar, TypesOfChar, logger } from '../../utils';
import * as fs from 'fs';

export function parseBoolOrNumber(
  sourceFileDescriptor: number,
  symTableOutDescriptor: number,
  tokenSequenceOutDescriptor: number,
  symTable,
  nowState,
  nowValue
): number {
  let state = nowState;
  let value = nowValue;
  const accStatesAndResults = {
    1: 'VAR_BOOL',
    3: 'VAR_INT',
    5: 'VAR_FLOAT',
    8: 'VAR_FLOAT'
  };
  const label = 'BOOL/VAR_INT/VAR_FLOAT';
  /**
   * Returns -1 if the input is not valid, else returns the nextState, DFA 状态转移表
   * @param currentState
   * @param input
   */
  function getNextState(currentState: number, input: number): number {
    switch (currentState) {
      case 1:
        if (isChar(TypesOfChar.digit, input)) {
          return 3;
        } else if (isChar(TypesOfChar.dot, input)) {
          return 4;
        }
      case 2:
        if (isChar(TypesOfChar.digit, input)) {
          return 3;
        }
      case 3:
        if (isChar(TypesOfChar.digit, input)) {
          return 3;
        } else if (isChar(TypesOfChar.dot, input)) {
          return 4;
        }
      case 4:
        if (isChar(TypesOfChar.digit, input)) {
          return 5;
        }
      case 5:
        if (isChar(TypesOfChar.digit, input)) {
          return 5;
        } else if (isChar(TypesOfChar.E, input)) {
          return 6;
        }
      case 6:
        if (isChar(TypesOfChar.add_minus, input)) {
          return 7;
        } else if (isChar(TypesOfChar.digit, input)) {
          return 8;
        }
      case 7:
        if (isChar(TypesOfChar.digit, input)) {
          return 8;
        }
      case 8:
        if (isChar(TypesOfChar.digit, input)) {
          return 8;
        }
      default:
        return -1;
    }
  }
  let byte = Buffer.alloc(1);
  while (fs.readSync(sourceFileDescriptor, byte, 0, 1, null)) {
    fs.writeSync(tokenSequenceOutDescriptor, byte);

    let newState = getNextState(state, byte[0]);
    logger.info(
      `${label} state: ${state}, byte read: ${byte.toString()}, new state: ${newState}`
    );
    // 当无法接收下一个字符，并且对当前处于终止状态时，进行接收
    if (newState == -1) {
      if (Object.keys(accStatesAndResults).includes(state + '')) {
        logger.success(`Accepted a ${accStatesAndResults[state]}`);
        // 输出 token
        if (
          fs.writeSync(
            tokenSequenceOutDescriptor,
            `\n<${accStatesAndResults[state]}, ${nowValue}>\n`
          ) <= 0
        ) {
          logger.error('Written token sequence failed');
        }
        //  写入符号表
        symTable[accStatesAndResults[state]].indexOf(nowValue) === -1 &&
          symTable[accStatesAndResults[state]].push(nowValue);
        // 但是这里多读了一个字符，我们将其用返回值还给 caller
        return byte[0];
      }
      // 如果当前不处于终止状态，则报错
      else
        throw new Error(
          `${label} lexical error: ${String.fromCharCode(byte[0])}`
        );
    } else {
      nowValue += String.fromCharCode(byte[0]);
      state = newState;
    }
  }
  if (Object.keys(accStatesAndResults).includes(state + '')) {
    // 文件结束处理
  logger.success(`Accepted a ${accStatesAndResults[state]}`);
  // 输出 token
  if (
    fs.writeSync(
      tokenSequenceOutDescriptor,
      `\n<${accStatesAndResults[state]}, ${nowValue}>\n`
    ) <= 0
  ) {
    logger.error('Written token sequence failed');
  }
  symTable[accStatesAndResults[state]].indexOf(nowValue) === -1 &&
    symTable[accStatesAndResults[state]].push(nowValue);
  return;
  } else {
    throw new Error(
      `${label} lexical error: unexpected terminal`
    );
  }
}
