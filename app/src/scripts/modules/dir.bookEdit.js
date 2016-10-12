/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description creates input formular for adding a book
 */
app.directive('bookEditDetails', function ($timeout, $ionicLoading, $ionicModal) {
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
      compile: function (element, attributes) {
        return {
          pre: function (scope) {
            scope.persons = [{name: 'Bob'}, {name: 'Sam'}];
            scope.searchPerson = function () {
              $ionicModal.fromTemplateUrl('templates/search-contact.html', {
                scope: scope
              }).then(function (modal) {
                scope.modal = modal;
              });
            }
          }
        }
      },
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
