const fsp = require('fs').promises
const { isOpening, isClosing } = require('./misc')

async function extractLines(fpath, fromlinenum) {
  let txt = await fsp.readFile(fpath, { encoding: 'utf8' })


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
  lines = lines.slice(fromlinenum)


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

  return lines 
}


module.exports = extractLines