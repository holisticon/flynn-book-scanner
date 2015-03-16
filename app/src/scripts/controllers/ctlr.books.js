/**
 * @ngdoc controller
 * @name BooksController
 * @module flynnBookScannerApp
 *
 * @description
 * Interacts with inventory backend to show up book details
 */
app.controller('BooksController', ['$rootScope', '$scope', '$state', '$filter', '$log', '$ionicScrollDelegate', '$ionicListDelegate', '$ionicLoading', '$ionicHistory', '$http', '$ionicModal', '$ionicActionSheet', 'settingsService', 'inventoryService',
    function($rootScope, $scope, $state, $filter, $log, $ionicScrollDelegate, $ionicListDelegate, $ionicLoading, $ionicHistory, $http, $ionicModal, $ionicActionSheet, settings, inventoryService) {

        var config = settings.load(),
            allBooks;

        function init() {
            initModal();
            $scope.filter = {};
            $scope.filter.selectedOrder = $scope.filterModes[0].value;
            load(true);
            $rootScope.$on('inventory.refresh', function(event, args) {
                load(false);
            });            
        }

        function initModal() {
            $ionicModal.fromTemplateUrl('filter_modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.modal = modal;
            });
            $scope.openModal = function() {
                $scope.modal.show();
            };
            $scope.closeModal = function() {
                $scope.modal.hide();
            };
            //Cleanup the modal when we're done with it!
            $scope.$on('$destroy', function() {
                $scope.modal.remove();
            });
            $scope.filterModes = [{
                label: 'sort by title',
                value: 'value.volumeInfo.title'
            }, {
                label: 'sort by author',
                value: 'authorInfo'
            }];
        }

        function syncWithServer() {
            $ionicLoading.show({
                template: '<ion-spinner></ion-spinner> <br> Syncing books ...'
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
                $rootScope.$broadcast('server.error');
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
                $scope.books.splice($scope.books.indexOf(pBookToRemove), 1);
                $rootScope.$broadcast('inventory.refresh');
                $state.go('app.books', {}, { reload: true });
            }, function(error) {
                $ionicLoading.hide();
                $rootScope.$broadcast('server.error');
            });
        }

        function showFilterModal() {
            $scope.openModal();
        }

        function applyFilter() {
            $scope.closeModal();
        }

        function showBookDetails(pBook) {
            $log.debug('Showing details for book: ' + pBook.value.volumeInfo.title);
            $state.go('app.book_show', {
                'bookId': pBook.value.id
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
                        'bookId': book.value.id
                    });
                    return true;
                },
                destructiveButtonClicked: function() {
                    navigator.notification.confirm('Really remove book ' + $scope.book.value.volumeInfo.title + ' ?', function(buttonIndex) {
                        if (buttonIndex === 1) {
                            removeBook($scope.book);
                        }
                        $ionicListDelegate.closeOptionButtons();
                    });
                    return true;
                }
            });
        }

        init();

        // public methods
        $scope.load = load;
        $scope.showFilterModal = showFilterModal;
        $scope.applyFilter = applyFilter;
        $scope.showBookDetails = showBookDetails;
        $scope.showActionMenu = showActionMenu;
        $scope.resetSearch = resetSearch;
        $scope.doSearch = doSearch;

    }
]);