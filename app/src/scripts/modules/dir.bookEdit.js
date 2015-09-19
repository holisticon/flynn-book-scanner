/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description creates input formular for adding a book
 */
app.directive('bookEditDetails', function ($timeout, $ionicLoading) {
    'use strict';

    return {
      restrict: 'E',
      scope: {
        selectedBook: '=book',
        editEntry: '=editEntry',
        newEntry: '=newEntry'
      },
      replace: true,
      templateUrl: 'templates/bookEditDetails.html',

      link: function (scope) {
        $ionicLoading.show();
        scope.$watch('selectedBook', function () {
          $timeout(function () {
            $ionicLoading.hide();
          }, 5);
        });
      }
    };
  }
);
