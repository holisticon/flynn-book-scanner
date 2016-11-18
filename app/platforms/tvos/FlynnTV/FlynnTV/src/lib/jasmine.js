var io= require('socket.io-client');

var origConsole = console.log

localStorage.debug = 'socket.io:*'

var jasmineRequire = require('../vendor/jasmine-2.4.0/jasmine.js')

function extend(destination, source) {
  for (var property in source) {
    console.log(property)
    destination[property] = source[property];
  }
  return destination;
}

var socket;
const ChannelName = 'jasmine'

var remoteLog = function(data) {
  socket.emit(ChannelName,data)
}
//https://www.snip2code.com/Snippet/351080/Jasmine-working-custom-reporter
var myReporter = {
  jasmineStarted: function(suiteInfo) {
    console.log('Running suite with ' + suiteInfo.totalSpecsDefined);
    remoteLog('Running suite with ' + suiteInfo.totalSpecsDefined);
  },
  suiteStarted: function(result) {
    console.log('Suite started: ' + result.description + ' whose full description is: ' + result.fullName);
    remoteLog('Suite started: ' + result.description + ' whose full description is: ' + result.fullName);
  },
  specStarted: function(result) {
    console.log('Spec started: ' + result.description + ' whose full description is: ' + result.fullName);
    remoteLog('Spec started: ' + result.description + ' whose full description is: ' + result.fullName);
  },
  specDone: function(result) {
    console.log('Spec: ' + result.description + ' was ' + result.status);
    remoteLog('Spec: ' + result.description + ' was ' + result.status);
    for(var i = 0; i < result.failedExpectations.length; i++) {
      console.log('%c Failure: ' + result.failedExpectations[i].message, 'background: #222; color: #bada55');
      remoteLog('Failure: ' + result.failedExpectations[i].message);
      //console.log(result.failedExpectations[i].stack);
    }
  },
  suiteDone: function(result) {
    console.log('Suite: ' + result.description + ' was ' + result.status);
    remoteLog('Suite: ' + result.description + ' was ' + result.status);
    for(var i = 0; i < result.failedExpectations.length; i++) {
      console.log('AfterAll ' + result.failedExpectations[i].message);
      remoteLog('AfterAll ' + result.failedExpectations[i].message);
      console.log(result.failedExpectations[i].stack);
      remoteLog(result.failedExpectations[i].stack);
    }
  },
  jasmineDone: function() {
    console.log('Finished suite');
    remoteLog('Finished suite');
  }
};

// Initialize jasmine core
var jasmine = jasmineRequire.core(jasmineRequire)
// Add reporter over socketIO
jasmine.getEnv().addReporter(myReporter)

var jasmineInterface = jasmineRequire.interface(jasmine, jasmine.getEnv());


var runTests = function() {
  jasmine.getEnv().execute();
}

var connectToSocketIO = function(callback) {

  socket = io('http://localhost:8002')
  socket.on('connect', () => {
    console.debug('Jasmine Tester:  connected')
    callback(null)
  });

}

module.exports = {
  connect: connectToSocketIO,
  run: runTests,
  testInterface: jasmineInterface
}
