/**
 * @ngdoc controller
 * @name BookDetailsController
 * @module flynnBookScannerApp
 *
 * @description
 * Controller to show book details from inventory
 */
app.controller('BookDetailsController', function ($scope, $state, $stateParams, $log) {
    'use strict';

    function editBookDetails(pBook) {
      $log.debug('Editing details for book: ' + pBook.value.volumeInfo.title);
      $state.go('app.book_edit', {'book': pBook});
    }

    function uploadBookAttachments(pBook) {
      $log.debug('Uploading attachements for book: ' + pBook.value.volumeInfo.title);
      $state.go('app.book_upload', {'book': pBook});
    }

    function load() {
      $scope.selectedBook = $stateParams.book;
    }

    load();

    // public methods
    $scope.edit = editBookDetails;
    $scope.upload = uploadBookAttachments;
  }
);
