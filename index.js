let acorn = require('acorn')
let fsp = require('fs').promises
let fs = require('fs')
let path = require('path')
let uuidv4 = require('uuid').v4

let acorn_globals = require('acorn-globals')
const arg = require('arg')
const extractLines = require('./extractLines')
const amazon = require('./amazon')

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

  await amazon(args)


}


main()