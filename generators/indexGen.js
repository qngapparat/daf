const prettier = require('prettier')

/**
 * Generate the code for the lambda's index.js file
 * 
 * @param {object} analy The output of parsel
 * @param {string} secTxt The \n-separated code segment to be Faasified 
 */
function generate(analy, secTxt) {

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
      { semi: false, parser: 'babel' }
    )

    return filecontent
}

module.exports = generate