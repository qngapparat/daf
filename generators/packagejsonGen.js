const fs = require('fs')
const path = require('path')
/**
 * @param {object} string The CLI args object
 * @param {object} analy That what parsel returns
 * @param {string} dirname Then 'name' of the lambda function
 */
function generate(args, analy, dirname) {
  
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
       // TODO deploy script ?
     },
     "author": "",
     ...pkgjsonContent, // only overwrite dependencies of previous package.json (if there's one)
     "dependencies": {
       ...deps
     }
   }

   return pkgjsonContent
}


module.exports = generate