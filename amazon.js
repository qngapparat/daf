const parsel = require('./utils/parsel')
const extractLines = require('./utils/extractLines')
const fs = require('fs')
const path = require('path')
const uuidv4 = require('uuid').v4
const tmp = require('tmp')
const webpack = require('webpack')
const prettier = require('prettier')
const { isClosing } = require('./utils/misc')

async function main(args) {
  // extract lines of source code that should be put on Faas
  const sec = await extractLines(args['--fpath'], args['--linenum']);

  let secTxt = sec
    .map(s => s.str)
    .join('\n')

  // analyze l header
  const analy = await parsel(sec[0].str, args)

  // MAKE DIRECTORIES
  if (!fs.existsSync(args['--outpath'])) {
    fs.mkdirSync(args['--outpath']);
  }
  if (!fs.existsSync(path.join(args['--outpath'], 'lambdas'))) {
    fs.mkdirSync(path.join(args['--outpath'], 'lambdas'));
  }
  const dirname = analy.name ? analy.name : uuidv4()
  if (!fs.existsSync(path.join(args['--outpath'], 'lambdas', dirname))) {
    fs.mkdirSync(path.join(args['--outpath'], 'lambdas', dirname))
  }


  // generate package.json
  pkgjsonContent = require('./generators/packagejsonGen')(args, analy, dirname)
  // write package.json
  pkgjsonContent = JSON.stringify(pkgjsonContent, null, 2)
  fs.writeFileSync(path.join(args['--outpath'], 'lambdas', dirname, 'package.json'), pkgjsonContent)

  
  // generate code dependencies
  // ie if the header is:
  //    //l require(./foo.js as foo) 
  //    => write bundle of foo.js 
  for (const reqS of analy.require) {
    // bundle the code with webpack
    const { fname, fcontent } = require('./generators/bundleGen')(reqS)
    // write webpacked js file
    fs.writeFileSync(
      path.join(args['--outpath'], 'lambdas', dirname, fname),
      fcontent
    )
  }

  // generate index.js
  // (always overwrite)
  const filecontent = require('./generators/indexGen')(analy, secTxt)
  console.log("===========")
  console.log(filecontent)
  console.log("===========")
  // write index.js
  fs.writeFileSync(path.join(args['--outpath'], 'lambdas', dirname, 'index.js'), filecontent)


  // If commentout was specified, comment out that section of monolith source
  if (args['--commentout']) {
    if (!analy.name) {
      throw new Error("Give it a name in order to use that feature")
    }

    console.log("Commenting out section....")
    let ls = fs.readFileSync(args['--fpath'], { encoding: 'utf8' })
    ls = ls.split('\n')
    // (1) add a /* under // l
    ls[args['--linenum']] += '\n/**'

    // (2) continue line by line until we find // lend, then add a */ before that
    for (const [idx, l] of ls.slice(args['--linenum']).entries()) {
      if (isClosing(l) === true) {
        // (3) add a Faas call the line below
        ls[Number(args['--linenum']) + idx] = `*/ \n${l}\n`
        ls[Number(args['--linenum']) + idx] +=
          (analy.return && `let ${ analy.return } = ` || '') + `await (new (require('aws-sdk'))
          .Lambda({ region: 'your_region', /* Your access key and secret access key */}))
          .invoke({ FunctionName: "${ analy.name }" }).promise()
        `
      }
    }
    // write back to disk
    const newsource = ls.join('\n')
    fs.writeFileSync(args['--fpath'], newsource)

    console.log("Commented out section!")
  }


  //////////////////////////////////////////
  //console.log("Done")
}

module.exports = main