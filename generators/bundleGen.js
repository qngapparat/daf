const path = require('path')
const tmp = require('tmp')
const webpack = require('webpack')
const fs = require('fs')

function generate(reqS) {

  // We're importing a FILE / FUNCTION
  // => bundle /.dir/myfunc with webpack and write it
  if (reqS.name.includes('.') || reqS.name.includes('/') || reqS.name.includes("\\")) {

    // Ensure user specified an 'as' alias
    if (reqS.as == null || reqS.as.trim() === '') throw new Error("Specify an 'as' alias, for example: require(./file.js as alias)")
   
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

    return {
      fname, 
      fcontent
    }
  }

  module.exports = generate