/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description show book details
 */
app.directive('bookViewDetails', function ($window, $log, $timeout, $ionicLoading) {
    'use strict';

    var selectedBook;

    function writeFile(fileEntry, dataObj, mimeType) {
      // Create a FileWriter object for our FileEntry
      fileEntry.createWriter(function (fileWriter) {
        fileWriter.onwriteend = function () {
          $log.debug('Successfully written file');
          SitewaertsDocumentViewer.viewDocument(fileEntry.nativeURL, mimeType,
            {
              /* show more options only on bigger screens */
              email: {enabled: $window.innerWidth > 400},
              print: {enabled: $window.innerWidth > 400},
              openWith: {enabled: true}
            }, function () {
              $log.debug('Viewer opened');
            }, function () {
              $log.debug('Viewer closed');
            }, function () {
              $log.error('App missing');
            }, function () {
              $log.error('Error occurred during opening document');
            });
        };
        fileWriter.onerror = function (e) {
          $log.debug('Failed file write', e);
        };

        fileWriter.write(dataObj);
      });
    }

    function saveFile(dirEntry, fileData, fileName, mimetype) {
      dirEntry.getFile(fileName, {create: true, exclusive: false}, function (fileEntry) {
        writeFile(fileEntry, fileData, mimetype);
      }, function () {
        $log.error('Error occurred writing file.');
      });
    }

    function openBook() {
      var book = selectedBook;
      // create byte array
      var pdfOutput = atob(book.ebook.data.replace(/\s/g, '')),
        length = pdfOutput.length,
        arrBuffer = new Uint8Array(new ArrayBuffer(length)),
        i = 0;
      // convert to byte array
      for (; i < length; i++) {
        arrBuffer[i] = pdfOutput.charCodeAt(i);
      }
      // create file object
      var file = new Blob([arrBuffer], {type: book.ebook.content_type});
      // on cordova platform use viewer
      if (window.requestFileSystem) {
        window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, function (fs) {
          $log.debug('file system open: ', fs.name);
          saveFile(fs.root, file, book.ebook.filename, book.ebook.content_type);
        }, function () {
          $log.error('Error occurred during file system access');
        });
      } else {
        // in browser fallback to createObjectURL
        var dataURL = URL.createObjectURL(file);
        window.open(dataURL, '_blank');
      }
    }

    return {
      restrict: 'E',
      scope: {
        selectedBook: '=book'
      },
      replace: true,
      templateUrl: 'templates/bookViewDetails.html',

      link: function (scope) {
        $ionicLoading.show();
        scope.$watch('selectedBook', function (value) {
          $timeout(function () {
            selectedBook = value;
            $ionicLoading.hide();
          }, 5);
        });
        scope.openBook = openBook;
      }
    };
  }
);
