// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'src/bower_components/angular/angular.js',
      'src/bower_components/angular-resource/angular-resource.js',
      'src/bower_components/angular-cookies/angular-cookies.js',
      'src/bower_components/angular-route/angular-route.js',
      'src/bower_components/angular-touch/angular-touch.js',
      'src/bower_components/angular-sanitize/angular-sanitize.js',
      'src/bower_components/angular-mocks/angular-mocks.js',
      'src/bower_components/mobile-angular-ui/dist/js/mobile-angular-ui.js',
      'src/bower_components/angular-local-storage/angular-local-storage.js',
      'src/bower_components/angular-block-ui/angular-block-ui.js',
      'src/bower_components/angular-bootstrap/ui-bootstrap.js',
      'src/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'src/scripts/*.js',
      'src/scripts/**/*.js',
      'test/spec/**/*.js'
    ],

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8080,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
