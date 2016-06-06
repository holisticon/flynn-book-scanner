var port = 9000;
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var TvmlPlugin = require('tvml-webpack-plugin');

module.exports = {
  entry: ['./src/application.js'],
  output: {
    path: path.join(__dirname, "dist", "scripts"),
    filename: "application.js",
    publicPath: "dist/scripts/"
  },
  module: {
    loaders: [
      {test: /\.jade$/, loader: "jade"},
      {test: /mocha\.js/, loader: "imports?window=>{},navigator=>{userAgent: 'tvos'}"},
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {presets: ['es2015'], "plugins": [['transform-remove-strict-mode']]}
      }
    ]
  },
  plugins: [new TvmlPlugin({appFile: './src/application.js', port: port})]
};
