var webpack = require("webpack");
var path = require('path')

module.exports = function (grunt) {

  var webpackConfig = require("./webpack.config.js");

  grunt.initConfig({
    "webpack-dev-server": {
      options: {
        webpack: webpackConfig,
        publicPath: "/" + webpackConfig.output.publicPath
      },
      start: {
        keepAlive: true,
        webpack: {
          devtool: '#inline-source-map',
          debug: true
        }
      }
    },
    watch: {
      app: {
        files: 'src/**/*',
        tasks: ['webpack:build-dev'],
        options: {
          spawn: false
        }
      }
    },
    copy: {
      main: {
        expand: true,
        cwd: 'src/',
        src: '**',
        dest: 'dist/'
      }
    },
    connect: {
      server: {
        options: {
          port: 9001,
          base: 'dist',
          debug: true
        }
      }
    },
    webpack: {
      options: webpackConfig,
      build: {
        plugins: webpackConfig.plugins.concat(
          new webpack.DefinePlugin({
            "process.env": {
              // This has effect on the react lib size
              "NODE_ENV": JSON.stringify("production")
            }
          }),
          new webpack.optimize.DedupePlugin(),
          new webpack.optimize.UglifyJsPlugin()
        )
      },
      "build-dev": {
        devtool: "sourcemap",
        debug: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-webpack');

  // The development server (the recommended option for development)
  grunt.registerTask("serve", ["webpack-dev-server:start", "watch"]);


  // Production build
  grunt.registerTask("build", ["webpack:build"]);
};
