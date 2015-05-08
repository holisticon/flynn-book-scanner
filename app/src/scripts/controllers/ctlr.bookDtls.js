/**
 * @ngdoc controller
 * @name BookDetailsController
 * @module flynnBookScannerApp
 *
 * @description
 * Controller to show book details from inventory
 */
app.controller('BookDetailsController', ['$rootScope', '$scope', '$stateParams', '$ionicLoading', '$location', '$log', 'settingsService', 'inventoryService', 'googleBookService',
    function($rootScope, $scope, $stateParams, $ionicLoading, $location, $log, settingsService, inventoryService, googleBookService) {
        var credentials = settingsService.load(),
            bookID = $stateParams.bookId;

        function load() {
            if (bookID) {
                inventoryService.getBook(bookID).then(function(response) {
                    $scope.selectedBook = enrichSingleDbEntry(response.book);
                }, function(errorResponse) {
                    $log.error('Error during load book via hashCode');
                });
            }
        }

        load(bookID);

    }
]);