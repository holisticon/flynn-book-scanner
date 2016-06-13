/**
 * @ngdoc directive
 * @name isFocused
 * @module flynnBookScannerApp
 * @description gives focus the the element, can be used as attribute
 */
app.directive('isFocused', function ($timeout) {
    'use strict';
    return {
      restrict: 'A',
      scope: {
        trigger: '&isFocused'
      },
      link: function (scope, element) {
        if (scope.trigger()) {
          $timeout(function () {
            element[0].focus();
            if (window.cordova && window.cordova.plugins.Keyboard) {
              cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
            }
          });
        } else {
          $timeout(function () {
            if (window.cordova && window.cordova.plugins.Keyboard) {
              cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
            }
          });
        }
      }
    };
  }
);
