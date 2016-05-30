var baseConfig = require('./karma.conf.js');

module.exports = function (config) {
  // Load base config
  baseConfig(config);

  // Override base config
  config.set({
    // web server port
    port: 10080,
    junitReporter: {
      outputDir: 'target/surefire-reports', // results will be saved as $outputDir/$browserName.xml
      suite: 'frontend'
    },
    singleRun: true,
    autoWatch: false
  });

  config.proxies = {
    '/config.json': 'http://localhost:' + config.port + '/base/test/config.json',
    '/images/': 'http://localhost:' + config.port + '/base/src/main/frontend/images/',
    '/views/': 'http://localhost:' + config.port + '/base/src/main/frontend/views/'
  }
};
