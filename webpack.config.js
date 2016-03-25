var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');
var webpack = require('webpack');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var webpackConfig = {
  entry: './src/index.js',
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
    new webpack.DefinePlugin({APP_ENV: JSON.stringify(process.env.NODE_ENV)}),
    new HtmlWebpackPlugin({template: 'index.template.html'}),
  ],
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
};

if (process.env.NODE_ENV === 'development') {
  webpackConfig = Object.assign({}, webpackConfig, {
    debug: true,
    devtool: 'sourcemap',
    output: {
      filename: 'build/bundle.js',
      pathinfo: true,
    },
    plugins: webpackConfig.plugins.concat([
      new ExtractTextPlugin('build/bundle.css'),
    ]),
  });
} else if (process.env.NODE_ENV === 'production') {
  webpackConfig = Object.assign({}, webpackConfig, {
    output: {
      filename: 'dist/bundle.[hash].min.js',
    },
    plugins: webpackConfig.plugins.concat([
      new ExtractTextPlugin('dist/bundle.[hash].min.css'),
      new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}}),
    ]),
  });
}

module.exports = webpackConfig;
