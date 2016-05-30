var port = 9000;
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
//var tvmlReload = require('tvml-kit-livereload');
var TvmlPlugin = require('tvml-webpack-plugin');


var io = null;
/*
 tvmlReload.start(port, function (ioRef) {
 io = ioRef;
 });*/
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
      },
      // socket.io-client requires the window object, and navigator.userAgent to be present.
      // use webpack to shim these into socket.io
      {
        test: /socket\.io\-client/,
        loader: "imports?window=>{location:{protocol:'http'}},global=>{location:{protocol:'http'}},navigator=>{userAgent: 'tvos'}"
      }
      //{ test: /page.js/, loader: "imports?document = {},history = {pushState: function() {}}", },
    ]
  },
  plugins: [new TvmlPlugin({appFile: './src/application.js', port: port})]
};
