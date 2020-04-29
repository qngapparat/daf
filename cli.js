#!/usr/bin/env node

const arg = require('arg')
const amazon = require('./amazon')

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

  await amazon(args)
}


main()