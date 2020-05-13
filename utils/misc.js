const path = require('path')
const webpack = require('webpack')
const tmp = require('tmp')
const fs = require('fs')

// whether codeline is pragma start
function isOpening(line) {
  line = line.replace(/\/\/\s*l/, '//l')
  line = line.trim()
  return line.includes("//l ") || /\/\/l$/.test(line)
}

// whether codeline is pragma end
function isClosing(line) {
  line = line.replace(/\/\/\s*lend/, '//lend')
  line = line.trim()
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


module.exports = {
  isOpening,
  isClosing,
  isBalancedBracket,
}