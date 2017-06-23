var commonConfig = require('./webpack-common.config');
module.exports = commonConfig({
  entry: ['./src/index.js'],
  output: {
    filename: 'index.js',
    library: 'index.js',
    libraryTarget: 'commonjs2',
  },
  externals: [
    'panel',
    'mixpanel-common',
    'lodash',
  ]
});
