/**
 * @ngdoc controller
 * @name BooksController
 * @module flynnBookScannerApp
 *
 * @description
 * Interacts with inventory backend to show up book details
 */
app.controller('BooksController', ['$rootScope', '$scope', '$state', '$filter', '$ionicScrollDelegate', '$ionicLoading', '$http', '$ionicActionSheet', 'settingsService', 'logService', 'inventoryService',
    function($rootScope, $scope, $state, $filter, $ionicScrollDelegate, $ionicLoading, $http, $ionicActionSheet, settings, logService, inventoryService) {

        var config = settings.load(),
            allBooks;

        function syncWithServer() {
            $ionicLoading.show({
                template: '<i class="icon ion-looping loading-icon"></i>&nbsp;&nbsp;Syncing books ...'
            });
            inventoryService.syncRemote().then(function(response) {
                $ionicLoading.hide();
            }, function(error) {
                if (error.status === 401) {
                    $rootScope.$broadcast("login.failed");
                } else {
                    $rootScope.$broadcast("settings.invalid");
                }
                $ionicLoading.hide();
            });
        }

        /**
         * load data via inventory service
         *
         */
        function load(pDontSync) {
            $ionicLoading.show();
            $scope.searchQuery = {};
            inventoryService.read().then(function(response) {
                if (response.books) {
                    allBooks = enrichDbData(response.books);
                    $scope.books = enrichDbData(response.books);
                    // sync if server was added
                    if (config.activeProfile().remotesync && !pDontSync) {
                        syncWithServer();
                    }
                    $ionicScrollDelegate.scrollTop();
                }
                $ionicLoading.hide();
            }, function(error) {
                $rootScope.$broadcast("server.error");
                $scope.searchQuery = {};
                $ionicLoading.hide();
            });
        }

        function doSearch() {
            $scope.books = $filter('bookFilter')(allBooks, $scope.searchQuery.fullTextSearch);
        }

        function resetSearch() {
            $scope.searchQuery = {};
            $scope.books = allBooks;
        }

        function removeBook(pBookToRemove) {
            inventoryService.remove(pBookToRemove).then(function(response) {
                $ionicLoading.show();
                load();
            }, function(error) {
                $ionicLoading.hide();
                $rootScope.$broadcast("server.error");
            });
        }

        function showBookDetails(pBook) {
            logService.debug('Showing details for book: ' + pBook.value.volumeInfo.title);
            $state.go('app.book_show', {
                'bookId': pBook.hashCode
            });
        }

        function showActionMenu(book) {
            $scope.book = book;
            // Show the action sheet
            var hideSheet = $ionicActionSheet.show({
                buttons: [{
                    text: '<b>Edit</b>'
                }],
                destructiveText: 'Delete',
                titleText: 'Modify book entry',
                cancelText: 'Cancel',
                cancel: function() {},
                buttonClicked: function(index) {
                    $state.go('app.book_edit', {
                        'bookId': book.hashCode
                    });
                },
                destructiveButtonClicked: function() {
                    var bookToRemove = $scope.book;
                    removeBook(bookToRemove);
                    return true;
                }
            });
        }

        load(true);

        // public methods
        $scope.load = load;
        $scope.showBookDetails = showBookDetails;
        $scope.showActionMenu = showActionMenu;
        $scope.resetSearch = resetSearch;
        $scope.doSearch = doSearch;

    }
]);