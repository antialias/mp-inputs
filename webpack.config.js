var AssetsPlugin = require('assets-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');
var webpack = require('webpack');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var BABEL_LOADER = 'babel?presets[]=es2015';
var BUILD_DIR = 'build-' + process.env.NODE_ENV;

var webpackConfig = {
  entry: {
    app: './src/index.js',
    standalone: './standalone/index.js',
  },
  module: {
    devtool: 'sourcemap',
    preLoaders: [
      {
        test: /\.js$/,
        include: path.join(__dirname, 'src'),
        loader: 'eslint',
      },
    ],
    loaders: [
      {
        test: /\.jade$/,
        exclude: /node_modules|mixpanel-common/,
        loaders: [BABEL_LOADER, 'virtual-jade'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules|highcharts|mixpanel-common|\.jql\.js$/,
        loader: BABEL_LOADER,
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
      APP_ENV: JSON.stringify(process.env.NODE_ENV),
      ROLLBAR_TOKEN: JSON.stringify('f1363513be0a42d1951b4f4e153996ec'),
    }),
    new AssetsPlugin({
      filename: path.join(BUILD_DIR, 'assets.json'),
      fullPath: false,
    }),
  ],
  resolve: {
    alias: {
      'assets': path.join(__dirname, 'assets'),
    },
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
  virtualJadeLoader: {
    vdom: 'snabbdom',
    runtime: 'var h = require("panel").h;',
  },
};

if (process.env.NODE_ENV === 'development') {
  webpackConfig = Object.assign({}, webpackConfig, {
    debug: true,
    output: {
      path: BUILD_DIR,
      filename: '[name].bundle.js',
      pathinfo: true,
    },
    plugins: webpackConfig.plugins.concat([
      new webpack.DefinePlugin({
        API_LOCAL: JSON.stringify(true),
        DEBUG_LOG: JSON.stringify(true),
        MIXPANEL_TOKEN: JSON.stringify('9c4e9a6caf9f429a7e3821141fc769b7'), // Project 132990 Mixpanel Dev
      }),
      new ExtractTextPlugin('[name].bundle.css'),
      new HtmlWebpackPlugin({
        template: 'index.template.html',
        filename: '../index-dev.html',
      }),
    ]),
  });

} else if (process.env.NODE_ENV === 'production') {
  webpackConfig = Object.assign({}, webpackConfig, {
    output: {
      path: BUILD_DIR,
      filename: '[chunkhash]-[name].bundle.min.js',
    },
    plugins: webpackConfig.plugins.concat([
      new webpack.DefinePlugin({
        API_LOCAL: JSON.stringify(false),
        DEBUG_LOG: JSON.stringify(false),
        MIXPANEL_TOKEN: JSON.stringify('2fd54f3085a7b7d70da94096fc415078'),
      }),
      new ExtractTextPlugin('[contenthash]-[name].bundle.min.css'),
      new HtmlWebpackPlugin({
        template: 'index.template.html',
        filename: '../index.html',
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {warnings: false},
        mangle: {except: [
          'main', // JQL queries need to define 'main()'
        ]},
      }),
    ]),
    eslint: {
      failOnWarning: false,
      failOnError: true,
    },
  });
}

module.exports = webpackConfig;
