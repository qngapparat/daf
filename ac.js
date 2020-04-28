let fsp = require('fs').promises
let detect = require('acorn-globals')

const sc = detect('let a = 1')
console.log(sc)