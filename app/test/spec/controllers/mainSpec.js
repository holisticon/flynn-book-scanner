'use strict';

var cordova;

describe('Controller: MainCtrl', function() {

  // load the controller's module
  beforeEach(module('flynnBookScannerApp'));

  var MainCtrl,
      scope,
      settings;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope) {

    scope = $rootScope.$new();
    settings = {};
    settings.load = function(){};
    
    MainCtrl = $controller('BookController', {
      $scope: scope,
      $settings: settings
    });
  }));



  it('do sometihng', function() {
    expect(true).toBe(true);
  });
});