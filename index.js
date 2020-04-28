let acorn = require('acorn')
let fsp = require('fs').promises
let fs = require('fs')
let path = require('path')
let uuidv4 = require('uuid').v4

let acorn_globals = require('acorn-globals')

const { isOpening, isClosing, isBalancedBracket, parsel } = require('./utils.js')
// TODO tacke external vars
// TODO tacke deps
// aka TODO extend 


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
  console.log(bracketExpr)
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

  // #################################################

  // For each section that shall be distributed

  for (const sec of linSection) {
    const secTxt = sec
      .map(s => s.str)
      .join('\n')
    console.log(`analyzing '${ secTxt }'`)

    // analyze l header
    const analy = parsel(sec[0].str)
    // analyze global vars
    // const globalVarReport = acorn_globals(secTxt)
    // console.log(globalVarReport.map(rep => console.log(rep.nodes)))
    
    // act on that info
    // CREATE LAMBDA FN FOR THAT SECTION WITH GIVEN INP AND GIVEN RETUR    

    
    if (!fs.existsSync('./lambdas')){
      fs.mkdirSync('./lambdas');
    }

    const dirname = uuidv4()
    fs.mkdirSync(path.join('./lambdas', dirname))



    // WRITE PACKAGE.JSON
    const deps = {}
    for (const npmi of analy.npminstall) {
      // js2faas@latest => @
      let firstWeird = npmi.match(/[^a-zA-Z0-9]+/)
      if(firstWeird.length) {
        const separator = firstWeird[0]
        const [name, version] = npmi.split(separator)
        deps[name] = version
      } 
      else {
        deps[name] = 'latest'
      }
    }

    let pkgjsonContent = {
      "name": "abcde",
      "version": "0.0.1",
      "description": "",
      "main": "index.js",
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "author": "",
  
      "dependencies": {
        ...deps
      }
    }

    pkgjsonContent = JSON.stringify(pkgjsonContent, null, 2)
    fs.writeFileSync(path.join('./lambdas', dirname, 'package.json'), pkgjsonContent)

    // WRITE INDEX.JS
    const varDeclarationStatements = analy.vars
      .map(varn => `let ${varn.as} = event.${varn.name};`)
  
    const filecontent = `
exports.handler = async (event, context) => {
  ${ varDeclarationStatements.join('\n') }
  ${secTxt}
  ${ analy.return != null ? `context.succeed(${analy.return})` : ""}
}
    `
  console.log("===========")
  console.log(filecontent)
  console.log("===========")

    // TODO lol
  fs.writeFileSync(path.join('./lambdas', dirname, 'index.js'), filecontent)
  }
  
  console.log("Done")




}


main()