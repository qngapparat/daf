
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
 * @returns [ vars: [...{name: 'a', as: 'a'} ] ]
 */
function parsel(lcomment) {
  let str = lcomment
    .replace(/[\/\*]/g, '') // remove / and * (// and /*... */)
    .trim()
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