var peg = require("pegjs");

var parser = peg.generate(`
  start 
   = var

  var 
   = '[0-9a-zA-Z_$\.\/]*'
   `)

var res = parser.parse("'wegweg'")
console.log(res)