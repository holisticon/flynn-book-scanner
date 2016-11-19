/**
 * @ngdoc directive
 * @name fileread
 * @module flynnBookScannerApp
 * @description handle file upload
 */
app.directive('fileread', function ($parse) {
  'use strict';

  return {
    link: function (scope, element, attributes) {
      element.bind('change', function () {
        $parse(attributes.fileread).assign(scope, element[0].files);
        scope.$apply();
      });
    }
  };
});
