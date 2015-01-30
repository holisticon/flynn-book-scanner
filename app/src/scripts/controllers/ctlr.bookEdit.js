/**
 * @ngdoc controller
 * @name BookEditController
 * @module flynnBookScannerApp
 *
 * @description
 * Controller to edit book details from inventory
 */
app.controller('BookEditController', ['$rootScope', '$scope', '$state', '$stateParams', '$ionicLoading', '$location', 'logService', 'settingsService', 'inventoryService',
    function($rootScope, $scope, $state, $stateParams, $ionicLoading, $location, logService, settingsService, inventoryService) {
        var booksInventory, credentials = settingsService.load();
        var bookID = $stateParams.bookId;

        function save() {
            var book = $scope.selectedBook,
                config = settingsService.load();
            $ionicLoading.show();
            logService.debug("Starting save for book.");
            var bookImage = document.getElementById(book.value.id).getElementsByClassName('img-thumbnail')[0];
            if (bookImage && bookImage.src && !book.image) {
                // extract image info
                blobUtil.imgSrcToBlob(bookImage.src).then(function(blob) {
                    var reader = new window.FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function() {
                        var image = {};
                        image.name = 'thumbnail_' + book.value.id;
                        image.content_type = blob.type;
                        image.data = reader.result.replace('data:image/jpeg;base64,', '');
                        book.image = image;
                        inventoryService.save(book).then(onSuccess, onError);
                    }
                });
            } else {
                inventoryService.save(book).then(onSuccess, onError);

            }

            function onSuccess(response) {
                logService.info("Successfully added book");
                if (response.noUpdate) {
                    navigator.notification.alert("Book already added. Please increase amount.");
                } else  {
                    // sync on save
                    if (config.activeProfile().remotesync) {
                        inventoryService.syncRemote().then(function(response) {}, function(error) {
                            $rootScope.$broadcast("settings.invalid");
                            $state.go('app.settings');
                        });
                    }
                    $ionicLoading.hide();
                    navigator.notification.alert('Book successfully updated.', $state.go('app.books', {}, {
                        reload: true
                    }), 'Book');
                }
            }

            function onError(response) {
                $rootScope.$broadcast('booksave.error');
                logService.debug('Error during book saving.');
                $ionicLoading.hide();
            }
        }

        function load() {
            if (bookID) {
                inventoryService.read().then(function(response) {
                    var allBooks = enrichDbData(response.books);
                    var selectedBook,
                        count = 0;
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

        load();


        // public methods
        $scope.save = save;

    }
]);