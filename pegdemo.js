var peg = require("pegjs");


var parser = peg.generate(`
  start
   = line 


  line 
   =  directivelist

  directivelist
   = directive *
   
  directive 
   = vars  

  vars 
   = "vars" "(" deflist ")"

  /* toplevel */
  // TODO install, require, return 


  deflist
   = def 
   / def ", " deflist

  def
   =  vnamepath  " as "  vnamepath
   /  vnamepath  // TODO take into account whitespaces (lol)

  vnamepath
   = [0-9a-zA-Z_$\.\/]+
`)



var res = parser.parse("vars(abc as abab)")
console.log(JSON.stringify(res, null,2))