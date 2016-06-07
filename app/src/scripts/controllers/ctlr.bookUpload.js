/**
 * @ngdoc controller
 * @name BookUploadController
 * @module flynnBookScannerApp
 *
 * @description
 * Controller to edit book details with new uploads from inventory
 */
app.controller('BookUploadController', function ($rootScope, $scope, $state, $stateParams, $ionicLoading, $location, $log, settingsService, inventoryService, Upload) {
  'use strict';

  function save() {

    function onSuccess(response) {
      $log.info('Successfully added book');
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
      $log.debug('Error during book saving.');
      $ionicLoading.hide();
    }

    var book = $scope.selectedBook,
      config = settingsService.load();
    $ionicLoading.show();
    $log.debug('Starting save for book.');

    // TODO_#65
    // move to service
    // Author info
    if (book.authorInfo) {
      var authors = book.authorInfo.split(',');
      if (authors.length > 0) {
        book.value.volumeInfo.authors = [];
        for (var index in authors) {
          var author = authors[index];
          book.value.volumeInfo.authors.push(author);
        }
      }
    }
    // TODO_#65
    // move to service
    if (book.isbnInfo) {
      var isbns = book.isbnInfo.split(',');
      if (isbns.length > 0) {
        book.value.volumeInfo.industryIdentifiers = [];
        for (var isbnIndex in isbns) {
          var isbn = isbns[isbnIndex];
          book.value.volumeInfo.industryIdentifiers.push({identifier: isbn});
        }
      }
    }

    var imgElement = document.getElementById(book.value.id).getElementsByClassName('img-thumbnail');
    if (imgElement && imgElement[0].src && !book.image) {
      // extract image info
      blobUtil.imgSrcToBlob(imgElement[0].src).then(function (blob) {// jshint ignore:line
        var reader = new window.FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
          var image = {};
          image.name = 'thumbnail_' + book.value.id;
          image.content_type = blob.type;
          image.data = reader.result.replace('data:image/jpeg;base64,', '');
          book.image = image;
          inventoryService.save(book).then(onSuccess, onError);
        };
      });
    } else {
      inventoryService.save(book).then(onSuccess, onError);

    }
  }

  function addFiles(files) {
    // TODO real impl
    Upload.upload({
      url: 'https://angular-file-upload.s3.amazonaws.com/', //S3 upload url including bucket name
      method: 'POST',
      data: files
    });
  }

  function load() {
    $scope.selectedBook = $stateParams.book;
  }

  load();


// public methods
  $scope.save = save;
  $scope.addFiles = addFiles;

});
