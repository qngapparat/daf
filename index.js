// TODO use path.basename instead of slice(path.sep)[-1] ...
// TODO work on path handling generally

const amazon = require('./amazon')
/**
 * 
 * @param {string} fpath Path to .js file
 * @param {number} linenum Linenumber in file, where //l of section is
 * @param {string} outpath Where faasified files should be written
 */
function main(fpath, linenum, outpath, commentout) {

  if(fpath == null) throw new Error("Specify fpath")
  if(linenum == null) throw new Error("Specify linenum")
  if(outpath == null) throw new Error("Specify outpath")

  // TODO run webpack once on commonjs, once on es6 dummy file, take the success
      // (const xx = requrie(), module.exports = won't work if user specified that as es6)
      // and vice versa

  // TODO support method level llend ??
   // add faas call == replace body = entire.slice(entire.indexOf("{") + 1, entire.lastIndexOf("}"));



  return amazon({
    '--outpath': outpath,
    '--linenum': linenum,
    '--fpath': fpath,
    '--commentout': commentout
  })
}


module.exports = main
