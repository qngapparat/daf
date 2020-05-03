const { parsel } = require('./utils')
const extractLines = require('./extractLines')
const fs = require('fs')
const path = require('path')
const uuidv4 = require('uuid').v4
const tmp = require('tmp')
const webpack = require('webpack')
const prettier = require('prettier')
const { isClosing } = require('./utils')
async function main(args) {

  // get lines of source code that should be put on Faas
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


  // WRITE PACKAGE.JSON
  const deps = {}
  for (const npmi of analy.install) {
    // process // l install() field
    // js2faas@latest => @
    let firstWeird = npmi.match(/[^a-zA-Z0-9]+/)
    if (firstWeird && firstWeird.length) {
      const separator = firstWeird[0]
      const [name, version] = npmi.split(separator)
      deps[name] = separator + version // DO include separator: ie ^1.0.0
    }
    else {
      deps[npmi] = 'latest' // TODO use current as default, not latest
    }
  }

  let pkgjsonContent = {}

  // that lambda already exists => take existing package.json don't create from scratch
  if (fs.existsSync(path.join(args['--outpath'], 'lambdas', dirname, 'package.json'))) {
    console.log(`Updating existing function ${dirname}`)
    pkgjsonContent = JSON.parse(fs.readFileSync(path.join(args['--outpath'], 'lambdas', dirname, 'package.json'), { encoding: 'utf8' }))
  } else {
    console.log(`Creating new function ${dirname} `)
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
  fs.writeFileSync(path.join(args['--outpath'], 'lambdas', dirname, 'package.json'), pkgjsonContent)

  //////////////////////////////////////////

  //WRITE OTHER .JS FILES
  //(code files that index.js will depend on)

  // eg:
  // 'opencv2 as cv2'
  // or
  // './dir/myfunc as myf'
  // or
  // 'opencv'
  for (const reqS of analy.require) {

    // We're importing a FILE / FUNCTION
    // eg: 
    //  // l require(./dir/myfunc as myfunc)
    // => { name: './dir/myfunc', as: 'myfunc' }
    if (reqS.name.includes('.') || reqS.name.includes('/') || reqS.name.includes("\\")) {

      // Ensure user specified an 'as' alias
      if (reqS.as == null || reqS.as.trim() === '') throw new Error("Specify an 'as' alias, for example: require(./file.js as alias)")
      console.log("Importing a funciton/file: ", reqS)


      // './dir/myfunc' but absolute => /home/user/dir/myfunc
      const absolutereqSpath = path.resolve(
        path.resolve(args['--fpath'], '..'), // where file with //l lies 
        reqS.name // relative path from where filewith//l lies to file he wants to import
      )

      console.log("PATH: ", absolutereqSpath)

      // Workaround for silly webpack not accepting code strings, only filepaths

      // create dummy file that imports, and immediately exports the function
      // then we run webpack on that, to bundle all its code dependencies
      // the output is the function, but with all deps to run independently

      // 1 Create dummy input file
      let infilepath = tmp.fileSync({ postfix: '.js' });
      infilepath = infilepath.name
      fs.writeFileSync(infilepath, `
          const f = require('${ absolutereqSpath}');
          module.exports = f;
        `)

      // 2 Create dummy output directory
      let outfiledir = tmp.dirSync();
      outfiledir = outfiledir.name

      // 3 Run webpack: inputfile => webpack => outputdir/bundle.js
      await new Promise((resolve, reject) => {
        webpack(
          {
            mode: 'development', // don't scramble source
            entry: infilepath,
            output: {
              path: outfiledir,
              filename: 'bundle.js'
            },
          }
          , (err, stats) => { // Stats Object
            if (err || stats.hasErrors()) {
              reject(err, stats)
            } else {
              resolve()
            }
          });
      })

      // Get webpack output
      const bundlejssrc = fs.readFileSync(path.join(outfiledir, 'bundle.js'), { encoding: 'utf8' })

      console.log("BUNDLE SRC: ", bundlejssrc)

      const fcontent = `
        const a = 
         ${ bundlejssrc}

        ;module.exports = a;
      `
      // ./some/dir/myfunc.js => myfunc.js
      const fname = reqS.name.split(path.sep).pop()

      // write webpacked js file
      fs.writeFileSync(
        path.join(args['--outpath'], 'lambdas', dirname, fname),
        fcontent
      )

      console.log("WRITTEN FILE ${fname}")

    }

    // we're importing a NPM PACKAGE
    else {
      console.log("Importing a package: ", reqS)


      // TODO
      // Get actual name
      // 'a as b' => b
      // 'c' => c
    }

    // // a as alias => { name: 'a', as: 'alias' }
    // if (/\sas\s/.test(reqS) === true) {
    //   anl.require.push({
    //     name: reqS.split(' as ')[0].trim(),
    //     as: reqS.split(' as ')[1].trim()
    //   })
    // }

    // else {
    //   // don't allow './dir/myfunc', it must have an alphanumeric alias to be used as variablename
    //   if (/[a-zA-Z_$][0-9a-zA-Z_$]*/.test(reqS) === false) {
    //     throw new Error(`Please specify an alias with 'as' for ${reqS}`)
    //   }
    //   anl.require.push({ name: reqS.trim(), as: reqS.trim() })
    // }
  }





  // WRITE INDEX.JS
  // (always overwrite)
  const varDeclarationStatements = analy.vars
    .map(varn => `let ${varn.as} = event.${varn.name};`)

  // strip //l and //lend
  secTxt = secTxt
    .split('\n')
    .slice(1, -1)
    .join('\n')


  const requireTxt = analy.require
    .map(reqStatement => `const ${reqStatement.as} = require('${reqStatement.name}')`)
    .join('\n')

  const filecontent = prettier.format(
    `
      ${requireTxt}

      exports.handler = async (event, context) => {
        ${ varDeclarationStatements.join('\n')}
        ${secTxt}
        ${ analy.return != null ? `context.succeed(${analy.return.name})` : ""}
      }
    `,
    { semi: false }
  )
  console.log("===========")
  console.log(filecontent)
  console.log("===========")

  // TODO lol
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
          (analy.return && `let ${ analy.return } = ` || '') + `(new (require('aws-sdk'))
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