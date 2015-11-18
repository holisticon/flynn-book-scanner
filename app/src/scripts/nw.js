if (typeof(require) != 'undefined') {
  var gui = require('nw.gui');
  var ngFlynnApp = ngFlynnApp || {};// jshint ignore:line
  var global = global || {};// jshint ignore:line

// new nw namespace
  ngFlynnApp.nw = {};

  ngFlynnApp.nw.init = function () {
    'use strict';

    // init defult mac menu
    if (process.platform === 'darwin') {
      var mb = new gui.Menu({type: 'menubar'});
      mb.createMacBuiltin('My App');
      gui.Window.get().menu = mb;
    }
  };

// only run if nw is detected
  if (gui) {
    global.window = window;
    global.gui = gui;
    console.log('Running in nw.js');
    ngFlynnApp.nw.init();
  }
}
