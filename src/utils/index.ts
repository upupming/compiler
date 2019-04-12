const logger = {
    error(msg: string) {
      console.log(`[ERROR]: ${msg}`)
    },
    warning(msg: string) {
      console.log(`[WARNING]: ${msg}`)
    },
    info(msg: string) {
      console.log(`[INFO]: ${msg}`)
    },
    success(msg: string) {
      console.log(`[SUCCESS]: ${msg}`)
    }
  }
  

enum TypesOfChar {
    character,
    asterisk,
    not_asterisk,
    slash,
    backslash,
    single_quote,
    double_quote,
    bool,
    whites,
		digit,
		dot,
		E,
		add_minus,
		letter,
		letter_
}

/**
 * Returns true is `char` is `what` type
 * @param what Type of char
 */
function isChar(what: TypesOfChar, char: number) {
    let charString = String.fromCharCode(char)
    switch (what) {
      case TypesOfChar.character:
        return char >= 0 && char <= 127
      case TypesOfChar.asterisk:
        return charString == '*'
      case TypesOfChar.not_asterisk:
        return charString != '*'
      case TypesOfChar.slash:
        return charString == '/'
      case TypesOfChar.backslash:
        return charString == '\\'
      case TypesOfChar.single_quote:
        return charString == "'"
      case TypesOfChar.double_quote:
        return charString == '"'
			case TypesOfChar.bool:
        return charString == '0' || charString == '1'
      case TypesOfChar.whites:
        return charString == ' ' || charString == '\t' || charString == '\n' || charString == '\r' || charString == '\r\n'
			case TypesOfChar.digit:
				return char >= '0'.charCodeAt(0) && char <= '9'.charCodeAt(0)
			case TypesOfChar.dot:
				return charString == '.'
			case TypesOfChar.E:
				return charString == 'E' || charString == 'e'
				case TypesOfChar.add_minus:
				return charString == '+' || charString == '-'
			case TypesOfChar.letter:
				return (char >= 'A'.charCodeAt(0) && char <= 'Z'.charCodeAt(0)) || (char >= 'a'.charCodeAt(0) && char <= 'z'.charCodeAt(0))
			case TypesOfChar.letter_:
				return (char >= 'A'.charCodeAt(0) && char <= 'Z'.charCodeAt(0)) || (char >= 'a'.charCodeAt(0) && char <= 'z'.charCodeAt(0)) || char == '_'.charCodeAt(0)
      // Not in the list, may be a keyword
      default:
        return -1
    }
  }  

export {
    TypesOfChar,
    isChar,
    logger
}