
const arg = require('arg')

async function main() {
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

  
}


main()