let acorn = require('acorn')
let fsp = require('fs').promises
let fs = require('fs')
let path = require('path')
let uuidv4 = require('uuid').v4

let acorn_globals = require('acorn-globals')
const arg = require('arg')

const { isOpening, isClosing, isBalancedBracket, parsel } = require('./utils.js')
// TODO tacke external vars
// TODO tacke deps
// aka TODO extend 


async function main() {

  // TODO take outpath

  const args = arg({
    '--fpath': String,
    '--linenum': String,
    '--outpath': String
  })

  if (args['--fpath'] == null) {
    console.log('Specify --fpath')
    process.exit()
  }
  
  if (args['--linenum'] == null) {
    console.log('Specify --linenum')
    process.exit()
  }

  if (args['--outpath'] == null) {
    console.log('Specify --outpath')
    process.exit()
  }

  const FPATH = args['--fpath']
  const LINEFROM = args['--linenum']
  const OUTPATH = args['--outpath']

  let txt = await fsp.readFile(FPATH, { encoding: 'utf8' })

  /**
   * IE:
   * [
   *  { str: '//l',        isOpening: true,  isClosing: false },
   *  { str: 'let a = 1;', isOpening: false, isClosing: false },
   *  { str: '// lend',    isOpening: false,  isClosing: true }
   * ]
   * 
   */
  let lines = txt.split('\n')
  
  // add some aux info
  lines = lines.map(line => {
    return {
      str: line,
      isOpening: isOpening(line),
      isClosing: isClosing(line)
    }
  })
  
  // discard lines before our focused //l comment
  lines = lines.slice(LINEFROM)
  
  
  // and  lines after its closing //lend comment
  let closingIndex = lines.map(l => l.isClosing).indexOf(true) === -1
  ? lines.length
  : lines.map(l => l.isClosing).indexOf(true) + 1 // include //lend
  lines = lines.slice(0, closingIndex)
  
  console.log(lines)
  // ensure it's in a proper form
  // ####################################################################

  if (lines[0].isOpening === false) throw new Error("Couldn't extract code from file (l)")
  if (lines[lines.length - 1].isClosing === false) throw new Error("Couldn't extract code from file (lend)")

  // ensure there aren't other l or lend inbetween
  let inbetween = lines.slice(1, lines.length - 1)
  if (inbetween.map(l => l.isOpening).some(x => x) === true) {
    throw new Error("Rogue 'l' comment found inbetween")
  }

  if (inbetween.map(l => l.isClosing).some(x => x) === true) {
    throw new Error("Rogue 'lend' comment found inbetween")
  }

  console.log("LINES:", lines)

  // // CAN OMIT BECAUSE WE GET SPECIFIC LOCATION #################################################
  // // convert //l, //lend to equivalent bracket expression 
  // // ...to check it's well formed
  // const bracketExpr = lines
  //   .map(l => l.isOpening ? '(' : l.isClosing ? ')' : '')
  // // ensure its balanced
  // const pendingBrackets = bracketExpr.reduce((acc, ch) => {
  //   let c = acc
  //   if (ch === '(') c++
  //   if (ch === ')') c--
  //   if (c < 0) throw new Error("Opening/closing comments aren't balanced")
  //   return c
  // }, 0)
  // if (pendingBrackets !== 0) throw new Error("Opening/closing commends aren't balanced")

  // // ensure its not nested
  // bracketExpr.reduce((acc, ch) => {
  //   let c = acc
  //   if (ch === '(') c++
  //   if (ch === ')') c--
  //   if (c >= 2) throw new Error("Nested comments arent allowed")
  //   return c;
  // }, 0)

  // #################################################


  // Get rid of lnes that aren't l, lend, or between l and lend
  // == lines that won't be distributed

  // ASSUMES balanced, not nested (checked before)
  // let linSection = []
  // let inSection = false 

  // for (const line of lines) {

  //   if(line.isOpening) {
  //     // open a new section
  //     linSection.push([line])
  //     inSection = true
  //     continue
  //   }

  //   if(line.isClosing) { 
  //     linSection[linSection.length-1].push(line)
  //     inSection = false 
  //     continue
  //   }

  //   // append to current section
  //   if(inSection) {
  //     linSection[linSection.length-1].push(line)
  //   } 

  // }

  // #################################################


  // For each section that shall be distributed
  // NOW THERES ONLY ONE 

  const sec = lines;

  const secTxt = sec
    .map(s => s.str)
    .join('\n')
  console.log(`analyzing '${secTxt}'`)

  // analyze l header
  const analy = parsel(sec[0].str)
  // analyze global vars
  // const globalVarReport = acorn_globals(secTxt)
  // console.log(globalVarReport.map(rep => console.log(rep.nodes)))

  /// ########################################
  // act on that info
  // CREATE LAMBDA FN FOR THAT SECTION WITH GIVEN INP AND GIVEN RETUR    


  if (!fs.existsSync('./lambdas')) {
    fs.mkdirSync('./lambdas');
  }

  const dirname = analy.fname ? analy.fname : uuidv4()
  if(!fs.existsSync(path.join(OUTPATH, 'lambdas', dirname))){
    fs.mkdirSync(path.join(OUTPATH, 'lambdas', dirname))
  }
  console.log(`Writing Functions to ${ path.join(OUTPATH, 'lambdas', dirname ) }`)


  // WRITE PACKAGE.JSON
  const deps = {}
  for (const npmi of analy.install) {
    // process // l install field
    // js2faas@latest => @
    let firstWeird = npmi.match(/[^a-zA-Z0-9]+/)
    if (firstWeird.length) {
      const separator = firstWeird[0]
      const [name, version] = npmi.split(separator)
      deps[name] = version
    }
    else {
      deps[name] = 'latest' // TODO use current as default, not latest
    }
  }

  let pkgjsonContent = {}

  // that lambda already exists => take existing package.json don't create from scratch
  if (fs.existsSync(path.join(OUTPATH, 'lambdas', dirname, 'package.json'))) {
    console.log("MODIFYING EXIETING PACKAGE:JSON")
    pkgjsonContent = JSON.parse(fs.readFileSync(path.join(OUTPATH, 'lambdas', dirname, 'package.json'), { encoding: 'utf8' }))
  }

  pkgjsonContent = {
    "name": analy.fname ? analy.fname : dirname, // TODO Better fallback ?
    "version": "0.0.1",
    "description": "",
    "main": "index.js",
    "scripts": {
      "test": "echo \"Error: no test specified\" && exit 1"
      // TODO deploy scr
    },
    "author": "",
    ...pkgjsonContent, // only overwrite dependencies of previous package.json (if there's one)
    "dependencies": {
      ...deps
    }
  }

  // write package.json
  pkgjsonContent = JSON.stringify(pkgjsonContent, null, 2)
  fs.writeFileSync(path.join(OUTPATH, 'lambdas', dirname, 'package.json'), pkgjsonContent)

  //////////////////////////////////////////


  // WRITE INDEX.JS
  // (always overwrite)
  const varDeclarationStatements = analy.vars
    .map(varn => `let ${varn.as} = event.${varn.name};`)

  const filecontent = `
exports.handler = async (event, context) => {
  ${ varDeclarationStatements.join('\n')}
  ${secTxt}
  ${ analy.return != null ? `context.succeed(${analy.return.name})` : ""}
}
    `
  console.log("===========")
  console.log(filecontent)
  console.log("===========")

  // TODO lol
  fs.writeFileSync(path.join(OUTPATH, 'lambdas', dirname, 'index.js'), filecontent)


  console.log("Done")

}


main()