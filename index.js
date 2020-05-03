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

  return amazon({
    '--outpath': outpath,
    '--linenum': linenum,
    '--fpath': fpath,
    '--commentout': commentout
  })
}


module.exports = main