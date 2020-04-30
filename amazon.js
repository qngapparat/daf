const { parsel } = require('./utils')
const extractLines = require('./extractLines')
const fs = require('fs')
const path = require('path')
const uuidv4 = require('uuid').v4
const prettier = require('prettier')

async function main(args) {

  // get lines of source code that should be put on Faas
  const sec = await extractLines(args['--fpath'], args['--linenum']);

  let secTxt = sec
    .map(s => s.str)
    .join('\n')
 
  // analyze l header
  const analy = parsel(sec[0].str)
 
  // MAKE DIRECTORIES
  if (!fs.existsSync(args['--outpath'])) {
    fs.mkdirSync(args['--outpath']);
  }
  if (!fs.existsSync(path.join(args['--outpath'], 'lambdas'))) {
    fs.mkdirSync(path.join(args['--outpath'], 'lambdas'));
  }
  const dirname = analy.name ? analy.name : uuidv4()
  if(!fs.existsSync(path.join(args['--outpath'], 'lambdas', dirname))){
    fs.mkdirSync(path.join(args['--outpath'], 'lambdas', dirname))
  }

 
  // WRITE PACKAGE.JSON
  const deps = {}
  for (const npmi of analy.install) {
    // process // l install() field
    // js2faas@latest => @
    let firstWeird = npmi.match(/[^a-zA-Z0-9]+/)
    if (firstWeird && firstWeird.length) {
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
  if (fs.existsSync(path.join(args['--outpath'], 'lambdas', dirname, 'package.json'))) {
    console.log(`Updating existing function ${ dirname }`)
    pkgjsonContent = JSON.parse(fs.readFileSync(path.join(args['--outpath'], 'lambdas', dirname, 'package.json'), { encoding: 'utf8' }))
  } else {
    console.log(`Creating new function ${ dirname } `)
  }

  pkgjsonContent = {
    "name": analy.name ? analy.name : dirname, // TODO Better fallback ?
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
  fs.writeFileSync(path.join(args['--outpath'],'lambdas', dirname, 'package.json'), pkgjsonContent)

  //////////////////////////////////////////

  // WRITE INDEX.JS
  // (always overwrite)
  const varDeclarationStatements = analy.vars
    .map(varn => `let ${varn.as} = event.${varn.name};`)

  // strip //l and //lend
  secTxt = secTxt
    .split('\n')
    .slice(1, -1)
    .join('\n')

  const filecontent = prettier.format(
    `
      exports.handler = async (event, context) => {
        ${ varDeclarationStatements.join('\n')}
        ${secTxt}
        ${ analy.return != null ? `context.succeed(${analy.return.name})` : ""}
      }
    `,
    { semi: false }
  )
  //console.log("===========")
  //console.log(filecontent)
  //console.log("===========")

  // TODO lol
  fs.writeFileSync(path.join(args['--outpath'], 'lambdas', dirname, 'index.js'), filecontent)

  //////////////////////////////////////////
  //console.log("Done")
}

module.exports = main