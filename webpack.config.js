'use strict';

var webpack = require('webpack');
var rxPaths = require('rxjs/_esm5/path-mapping');
var babelOptions = require('./babel.config');

var env = process.env.NODE_ENV || 'production';

var config = {
  mode: env,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          { loader: 'babel-loader', options: babelOptions }
        ]
      }
    ]
  },
  resolve: {
    alias: rxPaths()
  },
  output: {
    library: 'ReduxLogic',
    libraryTarget: 'umd'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env)
    }),
    new webpack.optimize.ModuleConcatenationPlugin()
  ]
};

module.exports = config;
