// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2015-06-18 using
// generator-karma 1.0.0

module.exports = function (config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // base path, that will be used to resolve files and exclude
    basePath: '.',

    // testing framework to use (jasmine/mocha/qunit/...)
    // as well as any additional frameworks (requirejs/chai/sinon/...)
    frameworks: [
      'jasmine'
    ],

    // list of files / patterns to load in the browser
    files: [
      // bower:js
      'bower_components/angular/angular.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-resource/angular-resource.js',
      'bower_components/angular-route/angular-route.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-touch/angular-touch.js',
      'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'bower_components/angular-cache/dist/angular-cache.js',
      'bower_components/angular-local-storage/dist/angular-local-storage.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/ionic/release/js/ionic.js',
      'bower_components/ionic/release/js/ionic-angular.js',
      'bower_components/pouchdb/dist/pouchdb.js',
      'bower_components/pouchdb-find/dist/pouchdb.find.min.js',
      'bower_components/ng-file-upload/ng-file-upload.js',
      'bower_components/es5-shim/es5-shim.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/angular-scenario/angular-scenario.js',
      // endbower
      "src/scripts/**/*.js",
      "test/mocks/**/*.js",
      "test/spec/**/*.js"
    ],

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 9080,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      'PhantomJS2'
    ],

    reporters: [
      'progress',
      'junit',
      'html'
    ],

    junitReporter: {
      outputDir: 'target/reports/', // results will be saved as $outputDir/$browserName.xml
      suite: 'flynnApp'
    },

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
  // use safari on travis CI
  if (process.env.TRAVIS) {
    config.browsers = ['Safari'];
  }
};
