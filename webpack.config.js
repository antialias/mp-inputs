module.exports = {
  entry: ['./src/index.js'], 
  output: {
    filename: 'index.js',
    library: 'index.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
      }, {
        test: /\.jade$/,
        loaders: ['virtual-jade-loader'],
      },
    ],
  },
  externals: [
    'panel',
    'mixpanel-common',
    'lodash',
    'register-unique-tagname',
  ]
};
