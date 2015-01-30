/**
 * @ngdoc controller
 * @name BookDetailsController
 * @module flynnBookScannerApp
 *
 * @description
 * Controller to show book details from inventory
 */
app.controller('BookDetailsController', ['$rootScope', '$scope', '$stateParams', '$ionicLoading', '$location', 'logService', 'settingsService', 'inventoryService', 'googleBookService',
    function($rootScope, $scope, $stateParams, $ionicLoading, $location, log, settingsService, inventoryService, googleBookService) {
        var credentials = settingsService.load(),
            bookID = $stateParams.bookId;

        function load() {
            if (bookID) {
                inventoryService.read().then(function(response) {
                    var allBooks = enrichDbData(response.books);
                    var selectedBook;

                    for (var index in allBooks) {
                        var book = allBooks[index];
                        if (book.hashCode == bookID) {
                            $scope.selectedBook = book;
                            break;
                        }
                    }
                }, function(errorResponse) {
                    log.error('Error during load book via hashCode');
                });
            }
        }

        load(bookID);

    }
]);