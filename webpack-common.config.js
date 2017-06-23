var {sync: glob} = require('glob');
var path = require('path');
var localModuleRegex = require('local-module-regex');
var {DefinePlugin} = require('webpack');
var {
  addRule,
} = require('@antialias/webpack-config-builders');
var {flow} = require('lodash');
module.exports = flow(
  [
    {
      test: /\.js$/,
      use: 'babel-loader',
      include: localModuleRegex(__dirname),
    }, {
      test: /\.jade$/,
      use: [
        {
          loader: 'virtual-jade-loader',
          options: {
            vdom: 'snabbdom',
            runtime: 'var h = require("panel").h;',
            capitalConstructors: true,
          },
        },
      ],
      include: localModuleRegex(__dirname),
    }, {
      test: /\.styl$/,
      use: [
        'style-loader',
        'css-loader',
        'autoprefixer-loader',
        'stylus-loader',
      ],
      include: localModuleRegex(__dirname),
    },
  ].map(addRule)
);
