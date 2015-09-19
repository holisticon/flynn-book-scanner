/**
 * @ngdoc controller
 * @name BookDetailsController
 * @module flynnBookScannerApp
 *
 * @description
 * Controller to show book details from inventory
 */
app.controller('BookDetailsController', function ($scope, $stateParams, $log, settingsService, inventoryService) {
    'use strict';

    var bookID = $stateParams.bookId;

    function load() {
      if (bookID) {
        inventoryService.getBook(bookID).then(function (response) {
          $scope.selectedBook = ngFlynnApp.enrichSingleDbEntry(response.book);
        }, function () {
          $log.error('Error during load book via hashCode');
        });
      }
    }

    load(bookID);

  }
);
