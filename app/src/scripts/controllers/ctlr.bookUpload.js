/**
 * @ngdoc controller
 * @name BookUploadController
 * @module flynnBookScannerApp
 *
 * @description
 * Controller to edit book details with new uploads from inventory
 */
app.controller('BookUploadController', function ($rootScope, $scope, $state, $stateParams, $location, $log,
                                                 $ionicLoading,
                                                 settingsService, inventoryService) {
  'use strict';

  var config = settingsService.load();

  function onSaveSuccess(response) {
    $log.info('Successfully added ebook');
    if (response.noUpdate) {
      navigator.notification.alert('Book already added. Please increase amount.');
    } else {
      // sync on save
      if (config.activeProfile().remotesync) {
        inventoryService.syncRemote().then(function () {
        }, function () {
          $rootScope.$broadcast('settings.invalid');
          $state.go('app.settings');
        });
      }
      $ionicLoading.hide();
      navigator.notification.alert('Book successfully updated.', $state.go('app.books'), 'Book');
    }
  }

  function onError() {
    $rootScope.$broadcast('booksave.error');
    $log.debug('Error during ebook saving.');
    $ionicLoading.hide();
  }

  function uploadFile() {
    $ionicLoading.show({
      template: '<ion-spinner></ion-spinner> <br> Uploading  ...'
    });
    var file = $scope.upload.src[0],
      book = $scope.selectedBook;
    if (file.type === 'application/pdf') {
      var reader = new window.FileReader();
      reader.onloadend = function () {
        var ebook = {};
        ebook.name = 'ebook_' + book.value.id;
        $log.debug('Saving ebook', file.name);
        ebook.content_type = file.type;
        ebook.data = file;
        book.ebook = ebook;
        inventoryService.save(book).then(onSaveSuccess, onError);
      };
      reader.onerror = function (e) {
        $log.debug('Error during ebook reading.', e);
        $ionicLoading.hide();
        navigator.notification.alert('Book could not be uploaded');
      };
      reader.readAsDataURL(file);
    } else {
      navigator.notification.alert('Only PDF files are supoorted.');
    }
  }

  function load() {
    $scope.upload = {src: ''};
    $scope.selectedBook = $stateParams.book;
  }

  load();


  // public methods
  $scope.uploadFile = uploadFile;

});
