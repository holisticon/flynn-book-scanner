/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description show book details
 */
app.directive('bookViewDetails', function ($timeout, $ionicLoading) {
    'use strict';

    return {
      restrict: 'E',
      scope: {
        selectedBook: '=book'
      },
      replace: true,
      templateUrl: 'templates/bookViewDetails.html',

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
