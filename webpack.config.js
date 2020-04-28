const path = require('path');

module.exports = {
  entry: './webpackdemo/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  mode: 'development'
};