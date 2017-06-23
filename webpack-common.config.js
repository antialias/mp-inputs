var {sync: glob} = require('glob');
var path = require('path');
var {buildMakeTagName} = require('register-unique-tagname');
var localModuleRegex = require('local-module-regex');
var {DefinePlugin} = require('webpack');
var {
  addRule,
  addPlugin,
} = require('@antialias/webpack-config-builders');
var {flow} = require('lodash');
var gitRev = require('git-rev-sync');
const makeTagName = buildMakeTagName({commitHash: gitRev.long()});
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
        {
          loader: 'stylus-loader',
          options: {
            use: [style => glob(`./src/*.jade`).reduce( // ad-hoc stylus plugin that sets variables for global tagnames
              (style, pathToJadeFile) => {
                const {dir, name:tagName} = path.parse(pathToJadeFile);
                const jsFilePath = path.join(__dirname, dir, tagName.concat('.js'));
                return style.define(tagName, makeTagName({tagName, absolutePath: jsFilePath}));
              },
              style
            )],
          },
        },
      ],
      include: localModuleRegex(__dirname),
    }, {
      test: /\.js$/,
      use: [
        {
          loader: 'string-replace-loader',
          options: {
            search: 'COMMITHASH',
            replace: JSON.stringify(gitRev.long())
          },
        }
      ],
    },
  ].map(addRule),
  addPlugin(new DefinePlugin({
    COMMITHASH: JSON.stringify(gitRev.long()),
  })),
  addPlugin({
      apply: compiler => {
        function setModuleConstant(expressionName, fn) {
          compiler.parser.plugin('expression ' + expressionName, function() {
            this.state.current.addVariable(expressionName, JSON.stringify(fn(this.state.module)));
            return true;
          });
        }
        setModuleConstant('__filename', function (module) {
          return module.resource;
        });
        setModuleConstant('__dirname', function (module) {
          return module.context;
        });
     }
  })
);
