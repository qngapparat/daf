let acorn = require('acorn')
let fsp = require('fs').promises
let acorn_globals = require('acorn-globals')

const { isOpening, isClosing, isBalancedBracket } = require('./utils.js')
// TODO tacke external vars
// TODO tacke deps
// aka TODO extend //l syntax


async function main() {
  let txt = await fsp.readFile('./demoprog.js', { encoding: 'utf8' })

  /**
   * IE:
   * [
   *  { str: '//l',        isOpening: true,  isClosing: false },
   *  { str: 'let a = 1;', isOpening: false, isClosing: false },
   *  { str: '// lend',    isOpening: false,  isClosing: true }
   * ]
   * 
   */
  let lines = txt.split('\n').map(line => {
    return {
      str: line,
      isOpening: isOpening(line),
      isClosing: isClosing(line)
    }
  })

  // #################################################


  // convert //l, //lend to equivalent bracket expression 
  // ...to check it's well formed
  const bracketExpr = lines
    .map(l => l.isOpening ? '(' : l.isClosing ? ')' : '')

  // ensure its balanced
  const pendingBrackets = bracketExpr.reduce((acc, ch) => {
    let c = acc
    if (ch === '(') c++
    if (ch === ')') c--
    if (c < 0) throw new Error("Opening/closing comments aren't balanced")
    return c
  }, 0)
  if (pendingBrackets !== 0) throw new Error("Opening/closing commends aren't balanced")

  // ensure its not nested
  bracketExpr.reduce((acc, ch) => {
    let c = acc
    if (ch === '(') c++
    if (ch === ')') c--
    if (c >= 2) throw new Error("Nested comments arent allowed")
    return c;
  }, 0)

  console.log(lines)

  // #################################################


  // Get rid of lnes that aren't l, lend, or between l and lend
  // == lines that won't be distributed

  // assumes balanced, not nested (checked before)
  let linSection = []
  let inSection = false 

  for (const line of lines) {

    if(line.isOpening) {
      // open a new section
      linSection.push([line])
      inSection = true
      continue
    }
    
    if(line.isClosing) { 
      linSection[linSection.length-1].push(line)
      inSection = false 
      continue
    }
    
    // append to current section
    if(inSection) {
      linSection[linSection.length-1].push(line)
    } 
    
  }

  console.log(linSection)

  // #################################################

  // For each section that shall be distributed

  for (const sec of linSection) {
    const secTxt = sec
      .map(s => s.str)
      .join('\n')
    console.log(`analyzing '${ secTxt }'`)
    // analyze global vars
    const globalVarReport = acorn_globals(secTxt)
    console.log(globalVarReport.map(rep => console.log(rep.nodes)))
  }
  
}


main()