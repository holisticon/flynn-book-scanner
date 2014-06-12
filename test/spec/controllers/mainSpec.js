'use strict';

var cordova;

describe('Controller: MainCtrl', function() {

  // load the controller's module
  beforeEach(module('flynnBookScannerApp'));

  var MainCtrl,
      scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope) {

    scope = $rootScope.$new();
    ;
    MainCtrl = $controller('BookController', {
      $scope: scope
    });
  }));



  it('do sometihng', function() {
    expect(true).toBe(true);
  });
});