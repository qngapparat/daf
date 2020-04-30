const path = require('path')
const webpack = require('webpack')
const tmp = require('tmp')
const fs = require('fs')

// whether codeline is pragma start
function isOpening(line) {
  line = line.replace(/\/\/\s*l/, '//l')
  return line.includes("//l ") || /\/\/l$/.test(line)
}

// whether codeline is pragma end
function isClosing(line) {
  return /^[\/]+\s*lend\s*$/.test(line)
}

function isBalancedBracket(str) {
  let counter = 0
  for (const ch of str) {
    if (ch === '(') counter++;
    if (ch === ')') counter--;
    if (counter < 0) return false;
  }
  return counter === 0 // well-formed bracket expression
}

/**
 * 
 * @param {string} lcomment 
 * @param {string} args cli arguments
 * @returns [ vars: [...{name: 'a', as: 'a'} ] ]
 */
async function parsel(lcomment, args) {
  let str = lcomment
    .replace(/\/+/, '') // remove leading /'s
    .trim()
  console.log("STR", str)
  if (str[0] !== 'l') throw new Error("First char should be lowercase l: ", str)

  // remove l
  str = str.slice(1).trim()

  // remove spaces before ...
  str = str.replace(/\s*\(\s*/g, '(')
  // ... and after brackets
  str = str.replace(/\s*\)\s*/g, ')')

  let anl = {
    vars: [],
    return: null,
    install: [],
    require: [],
    name: null
  }


  if (str.includes('vars')) {
    let varsStr = str.match(/vars([^)]+)/)[0]
    // inner text 
    varsStr = varsStr
      .replace('vars(', '')
      .replace(/\)$/, '')

    let defs = varsStr
      .split(',')
      .map(def => def.trim())
      .filter(def => def !== '')


    for (const def of defs) {
      // a as alias => { name: 'a', as: 'alias' }
      if (/\sas\s/.test(def) === true) {
        anl.vars.push({
          name: def.split('as')[0].trim(),
          as: def.split('as')[1].trim()
        })
      }

      else {
        anl.vars.push({ name: def.trim(), as: def.trim() })
      }
    }
  }


  if (str.includes('require')) {
    console.log("STR", str)
    let requireStr = str.match(/require([^)]+)/)[0]
    // inner text 
    requireStr = requireStr
    .replace('require(', '')
    .replace(/\)$/, '')
    
    let reqStatements = requireStr
      .split(',')
      .map(reqstatement => reqstatement.trim())
      .filter(reqstatement => reqstatement !== '')


    // eg:
    // 'opencv2 as cv2'
    // or
    // './dir/myfunc as myf'
    // or
    // 'opencv'
    for (const reqS of reqStatements) {

      // we're importing a file / function
      // eg: 
      //  // l require(./dir/myfunc as myfunc)
      if (reqS.includes('.') || reqS.includes('/') || reqS.includes("\\")) {

        console.log("Importing a funciton/file: ", reqS)

        // Ensure user specified an 'as' alias
        if (/\sas\s/.test(reqS) === false) throw new Error("Specify an 'as' alias in your require() clause")

        // eg './dir/myfunc'
        const reqSpath = reqS.split(' as ')[0].trim()

        // './dir/myfunc' but absolute => /home/user/dir/myfunc
        const absolutereqSpath = path.resolve(
          path.resolve(args['--fpath'], '..'), // where file with //l lies 
          reqSpath // relative path from where filewith//l lies to file he wants to import
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

        const bundlejssrc = fs.readFileSync(path.join(outfiledir, 'bundle.js'), {encoding: 'utf8'})

        console.log("BUNDLE SRC: ", bundlejssrc)
      }

      // we're importing a package
      else {
        console.log("Importing a package: ", reqS)

        // Get actual name
        // 'a as b' => b
        // 'c' => c
      }

      // a as alias => { name: 'a', as: 'alias' }
      if (/\sas\s/.test(reqS) === true) {
        anl.require.push({
          name: reqS.split(' as ')[0].trim(),
          as: reqS.split(' as ')[1].trim()
        })
      }

      else {
        // don't allow './dir/myfunc', it must have an alphanumeric alias to be used as variablename
        if (/[a-zA-Z_$][0-9a-zA-Z_$]*/.test(reqS) === false) {
          throw new Error(`Please specify an alias with 'as' for ${reqS}`)
        }
        anl.require.push({ name: reqS.trim(), as: reqS.trim() })
      }
    }
  }


  if (str.includes('return')) {
    let returnStr = str.match(/return([^)]+)/)[0]
    // inner text 
    returnStr = returnStr
      .replace('return(', '')
      .replace(/\)$/, '')
      .trim()

    if (returnStr == '') {
      console.log("Nothing specified with return, faas fn will be void")
      return
    }

    if (/\sas\s/.test(returnStr) === true) {
      anl.return = {
        name: returnStr.split("as")[0].trim(),
        as: returnStr.split("as")[1].trim()
      }
    }
    else {
      anl.return = {
        name: returnStr,
        as: returnStr
      }
    }
  }
  else {
    console.log("Nothing specified with return, faas fn will be void")
  }


  if (str.includes('install')) {
    let installStr = str.match(/install([^)]+)/)[0]
    // inner text 
    // inner text 
    installStr = installStr
      .replace('install(', '')
      .replace(/\)$/, '')

    let names = installStr
      .split(',')
      .map(name => name.trim())
      .filter(name => name !== '')

    anl.install = names
  }


  if (str.includes('name')) {
    let nameStr = str.match(/name([^)]+)/)[0]
    // inner text 
    // inner text 
    nameStr = nameStr
      .replace('name(', '')
      .replace(/\)$/, '')

    anl.name = nameStr.trim()
  }

  console.log(anl)
  return anl

}


module.exports = {
  isOpening,
  isClosing,
  isBalancedBracket,
  parsel
}