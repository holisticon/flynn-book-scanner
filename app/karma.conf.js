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
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/angular-cache/dist/angular-cache.min.js',
      'bower_components/angular-resource/angular-resource.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-route/angular-route.js',
      'bower_components/angular-touch/angular-touch.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-local-storage/angular-local-storage.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/ionic/release/js/ionic.js',
      'bower_components/ionic/release/js/ionic-angular.js',
      'bower_components/angular-bootstrap/ui-bootstrap.js',
      'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'bower_components/es5-shim/es5-shim.js',
      'bower_components/pouchdb/dist/pouchdb.js',
      'bower_components/pouchdb/dist/pouchdb.idb-alt.js',
      'bower_components/pouchdb/dist/pouchdb.localstorage.js',
      'bower_components/pouchdb/dist/pouchdb.memory.js',
      'src/scripts/*.js',
      'src/scripts/plugins/*.js',
      'src/scripts/modules/*.js',
      'src/scripts/controllers/*.js',
      'test/spec/**/*.js',
      // fixtures
      {
        pattern: 'test/*.json',
        watched: true,
        served: true,
        included: false
      },
      // html
      {
        pattern: 'src/views/*.html',
        watched: true,
        served: true,
        included: true
      }
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

    reporters: ['progress', 'junit'],

    // the default configuration
    junitReporter: {
      outputFile: 'test-results.xml',
      suite: ''
    },


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
  config.proxies = {
    '/config.json': 'http://localhost:' + config.port + '/base/test/config.json'
  }
};
