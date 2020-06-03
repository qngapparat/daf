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

  // TODO support native method level llend
  return amazon({
    '--outpath': outpath,
    '--linenum': linenum,
    '--fpath': fpath,
    '--commentout': commentout
  })
}


module.exports = main
