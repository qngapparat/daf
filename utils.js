
// whether codeline is pragma start
function isOpening(line){
  return /^[\/]+\s*l\s*$/.test(line)
} 

// whether codeline is pragma end
function isClosing(line) {
  return /^[\/]+\s*lend\s*$/.test(line)
}

function isBalancedBracket(str) {
  let counter = 0
  for(const ch of str) {
    if(ch === '(') counter ++;
    if(ch === ')') counter--;
    if(counter < 0) return false;
  }
  return counter === 0 // well-formed bracket expression
}

module.exports = {
  isOpening,
  isClosing,
  isBalancedBracket
}