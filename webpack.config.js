var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');
var webpack = require('webpack');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var babelLoader = 'babel?presets[]=es2015';
var webpackConfig = {
  entry: './src/index.js',
  module: {
    devtool: 'sourcemap',
    preLoaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint',
        query: {
          extends: 'eslint:recommended',
          parser: 'babel-eslint',
          rules: {
            'no-console': [1, {allow: ['warn', 'error']}],
            'no-debugger': 1,
            'no-use-before-define': 2,
            'eol-last': 2,
            'quotes': [2, 'single'],
            'comma-dangle': [2, 'only-multiline'],
          },
        },
      },
    ],
    loaders: [
      {
        test: /\.jade$/,
        exclude: /node_modules/,
        loaders: [babelLoader, 'virtual-jade'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: babelLoader,
      },
      {
        test: /\.(png|svg)$/,
        loader: 'url-loader?limit=50000',
      },
      {
        test: /\.styl$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader!autoprefixer-loader!stylus-loader'),
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      APP_ENV: JSON.stringify(process.env.NODE_ENV),
      ROLLBAR_TOKEN: JSON.stringify('f1363513be0a42d1951b4f4e153996ec'),
    }),
    new HtmlWebpackPlugin({template: 'index.template.html'}),
  ],
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
};

if (process.env.NODE_ENV === 'development') {
  webpackConfig = Object.assign({}, webpackConfig, {
    debug: true,
    output: {
      filename: 'build/bundle.js',
      pathinfo: true,
    },
    plugins: webpackConfig.plugins.concat([
      new webpack.DefinePlugin({ // Project 132990 Mixpanel Dev
        MIXPANEL_TOKEN: JSON.stringify('9c4e9a6caf9f429a7e3821141fc769b7'),
      }),
      new ExtractTextPlugin('build/bundle.css'),
    ]),
  });
} else if (process.env.NODE_ENV === 'production') {
  webpackConfig = Object.assign({}, webpackConfig, {
    output: {
      filename: 'dist/bundle.[hash].min.js',
    },
    plugins: webpackConfig.plugins.concat([
      new webpack.DefinePlugin({
        MIXPANEL_TOKEN: JSON.stringify('<IRB production Mixpanel project token>'),
      }),
      new ExtractTextPlugin('dist/bundle.[hash].min.css'),
      //new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}}),
    ]),
    eslint: {
      failOnWarning: false,
      failOnError: true,
    },
  });
}

module.exports = webpackConfig;
