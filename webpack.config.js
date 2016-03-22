var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');
var webpack = require('webpack');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var webpackConfig = {
  entry: './src/index.js',
  devtool: 'source-maps',
  output: {
    filename: 'build/bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.jade$/,
        exclude: /node_modules/,
        loader: 'virtual-jade',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
            presets: ['es2015'],
        },
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
    new ExtractTextPlugin('build/bundle.css'),
    new webpack.DefinePlugin({APP_ENV: JSON.stringify(process.env.NODE_ENV)}),
  ],
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
};

if (process.env.NODE_ENV === 'production') {
  webpackConfig.output.filename = 'dist/bundle.[hash].min.js';
  webpackConfig.plugins = [
    new ExtractTextPlugin('dist/bundle.[hash].min.css'),
    new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}}),
    new HtmlWebpackPlugin({template: 'index.template.html'}),
    new webpack.DefinePlugin({APP_ENV: JSON.stringify('production')}),
  ];
}

module.exports = webpackConfig;
