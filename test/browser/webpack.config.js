var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

var ExtractTextPlugin = require('extract-text-webpack-plugin');

var BABEL_LOADER = 'babel?presets[]=es2015?plugins[]=';
var BUILD_DIR = 'build';
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR);
}

var webpackConfig = {
  entry: path.join(__dirname, 'index.js'),
  output: {
    path: path.join(__dirname, BUILD_DIR),
    filename: 'bundle.js',
    pathinfo: true,
  },
  debug: true,
  devtool: !!process.env.NO_SOURCE_MAP ? null : 'source-map',
  module: {
    loaders: [
      {
        test: /\.jade$/,
        exclude: /node_modules|mixpanel-common/,
        loaders: ['babel?presets[]=es2015', 'virtual-jade'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules|highcharts|mixpanel-common|\.jql\.js$/,
        loader: 'babel',
        query: {
          plugins: [
            'syntax-async-functions',
            'transform-regenerator',
          ],
          presets: ['es2015'],
        },
      },
      {
        test: /\.(png|svg)$/,
        loader: 'url-loader?limit=50000',
      },
      {
        test: /\.styl$/,
        exclude: /node_modules|mixpanel-common|mp-drawer/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader!autoprefixer-loader!stylus-loader'),
      },

      // TODO remove once this is in mixpanel-common
      {
        test: /\.styl$/,
        include: /mp-drawer/,
        loader: 'css-loader!autoprefixer-loader!stylus-loader',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      API_LOCAL: JSON.stringify(true),
      APP_ENV: JSON.stringify(process.env.NODE_ENV),
      DEBUG_LOG: JSON.stringify(false),
      MIXPANEL_TOKEN: JSON.stringify('test_token'),
      ROLLBAR_TOKEN: JSON.stringify('test_token'),
    }),
    new ExtractTextPlugin('bundle.css'),
  ],
  resolve: {
    alias: {
      'assets': path.join(__dirname, '..', '..', 'assets'),
    },
  },
  resolveLoader: {
    root: path.join(__dirname, '..', '..', 'node_modules'),
  },
  virtualJadeLoader: {
    vdom: 'snabbdom',
    runtime: 'var h = require("panel").h;',
  },
};

module.exports = webpackConfig;
