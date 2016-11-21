/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description show book details
 */
app.directive('bookViewDetails', function ($window, $log, $timeout, $ionicLoading) {
    'use strict';

    var selectedBook;

    function writeFile(fileEntry, data, mimeType) {
      // Create a FileWriter object for our FileEntry
      fileEntry.createWriter(function (fileWriter) {

        var written = 0;
        var BLOCK_SIZE = 1 * 1024 * 1024; // write 1M every time of write

        function writeFinish() {
          $log.debug('Successfully written file');
          SitewaertsDocumentViewer.viewDocument(fileEntry.nativeURL, mimeType,
            {
              /* show more options only on bigger screens */
              email: {enabled: $window.innerWidth > 400},
              print: {enabled: $window.innerWidth > 400},
              openWith: {enabled: true}
            }, function () {
              $log.debug('Viewer opened');
              $ionicLoading.hide();
            }, function () {
              $log.debug('Viewer closed');
            }, function (appId, installer) {
              $log.error('App missing');
              navigator.notification.confirm('Do you want to install the free PDF Viewer App ' + appId + ' for Android?', function (index) {
                if (index === 1) {
                  installer();
                }
              });
              $ionicLoading.hide();
            }, function () {
              $log.error('Error occurred during opening document');
              $ionicLoading.hide();
            });
        }

        // PhoneGap FileWrite.write cannot handle too big buffer, do not know exact size,
        // I think this issue is due to PG transfer data to iOS through URL Scheme, somehow it crash when "URL" is too long.
        //
        // So write small block every time:

        function writeNext(cbFinish) {
          fileWriter.onwrite = function () {
            if (written < data.size) {
              writeNext(cbFinish);
            } else {
              cbFinish();
            }
          };
          if (written) {
            fileWriter.seek(fileWriter.length);
          }
          fileWriter.write(data.slice(written, written + Math.min(BLOCK_SIZE, data.size - written)));
          written += Math.min(BLOCK_SIZE, data.size - written);
        }

        writeNext(writeFinish);

        fileWriter.onerror = function (e) {
          $log.debug('Failed file write', e);
          $ionicLoading.hide();
        };

      });
    }

    function saveFile(dirEntry, fileData, fileName, mimetype) {
      dirEntry.getFile(fileName, {create: true, exclusive: false}, function (fileEntry) {
        writeFile(fileEntry, fileData, mimetype);
      }, function () {
        $log.error('Error occurred writing file.');
        $ionicLoading.hide();
      });
    }

    function openBook() {
      $ionicLoading.show({
        template: '<ion-spinner></ion-spinner> <br> Opening  ...'
      });
      var book = selectedBook;
      try {
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
          window.requestFileSystem(window.TEMPORARY, 50 * 1024 * 1024, function (fs) {
            $log.debug('file system open: ', fs.name);
            saveFile(fs.root, file, book.ebook.filename, book.ebook.content_type);
          }, function () {
            $log.error('Error occurred during file system access');
            $ionicLoading.hide();
          });
        } else {
          // in browser fallback to createObjectURL
          var dataURL = URL.createObjectURL(file);
          window.open(dataURL, '_blank');
          $ionicLoading.hide();
        }
      } catch (e) {
        $log.error('Error during file open occurred', e);
        $ionicLoading.hide();
        navigator.notification.alert('Error during file open');
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
