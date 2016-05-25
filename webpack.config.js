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
        include: path.join(__dirname, 'src'),
        loader: 'eslint',
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
        exclude: /node_modules|\.jql\.js$/,
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
      new webpack.DefinePlugin({
        API_LOCAL: JSON.stringify(true),
        MIXPANEL_TOKEN: JSON.stringify('9c4e9a6caf9f429a7e3821141fc769b7'), // Project 132990 Mixpanel Dev
      }),
      new ExtractTextPlugin('build/bundle.css'),
      new HtmlWebpackPlugin({
        template: 'index-dev.template.html',
        filename: 'index-dev.html',
      }),
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
      new HtmlWebpackPlugin({
        template: 'index.template.html',
        filename: 'index.html',
      }),
      //new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}}),
    ]),
    eslint: {
      failOnWarning: false,
      failOnError: true,
    },
  });
}

module.exports = webpackConfig;
