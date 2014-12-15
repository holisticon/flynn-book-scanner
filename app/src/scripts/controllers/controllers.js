function enrichSingleDbEntry(pDbEntry) {
    var authorInfo;
    if (pDbEntry.value.volumeInfo.authors) {
        authorInfo = '';
        var authorCount = pDbEntry.value.volumeInfo.authors.length;
        for (var itemIndex in pDbEntry.value.volumeInfo.authors) {
            authorInfo += pDbEntry.value.volumeInfo.authors[itemIndex];
            if (itemIndex < authorCount - 1) {
                authorInfo += ', ';
            }
        }
    }
    pDbEntry.authorInfo = authorInfo;

}

/**
 * Reduces multiple db entries to set without duplicates. This method also counts the records
 * to get the amount of book entries
 */
function enrichDbData(pDbEntries) {
    var result = false,
        bookEntries = {},
        resultsFound = false;
    if (pDbEntries) {
        for (var itemIndex in pDbEntries) {
            var itemInfo = pDbEntries[itemIndex];
            var isbn = itemInfo.value.volumeInfo.industryIdentifiers[0].identifier;
            if (bookEntries[isbn]) {

                bookEntries[isbn].count += 1;
                bookEntries[isbn].docs.push(itemInfo);
            } else {
                bookEntries[isbn] = {};
                bookEntries[isbn].value = itemInfo.value;
                bookEntries[isbn].count = 1;
                bookEntries[isbn].docs = [];
                bookEntries[isbn].docs.push(itemInfo);
                enrichSingleDbEntry(bookEntries[isbn]);
                //expose id
                bookEntries[isbn]._id = itemInfo._id;
                resultsFound = true;
            }
        }
        if (resultsFound) {
            // transfer to array
            result = [];
            for (var isbn in bookEntries) {
                result.push(bookEntries[isbn]);
            }
        }
    }
    return result;
};


app.controller('BooksController', ['$rootScope', '$scope', '$state', '$ionicLoading', '$ionicListDelegate', '$http', '$ionicActionSheet', 'LogService', 'InventoryService',
    function($rootScope, $scope, $state, $ionicLoading, $ionicListDelegate, $http, $ionicActionSheet, $log, $inventory) {

        var listDelegate = $ionicListDelegate.$getByHandle('booksListing');

        listDelegate.more = function() {
                alert('abc')
            }
            /**
             * load data via inventory service
             *
             */
        function load() {
            $ionicLoading.show();
            $scope.searchQuery = {};
            $inventory.read().then(onSuccess, onError);

            function onSuccess(response) {
                $scope.books = enrichDbData(response.books);
                $ionicLoading.hide();
            }

            function onError(response) {
                $rootScope.$broadcast("server.error");
                $ionicLoading.hide();
            }
        }

        function resetSearch() {
            $scope.searchQuery = {};
            search();
        }

        /**
         * Perform search within the all books view.
         * Currently only fulltext search is supported
         *
         */
        function search() {
            var searchQuery = $scope.searchQuery;
            $scope.searching = true;
            if (searchQuery.fullTextSearch) {
                $inventory.search(searchQuery).then(onSuccess, onError);
            } else {
                $inventory.read().then(onSuccess, onError);
            }

            function onSuccess(response) {
                $scope.books = enrichDbData(response.books);
                $scope.searching = false;
            }

            function onError(response) {
                $scope.books = false;
                $scope.searching = false;
            }
        }

        function removeBook(pBookToRemove) {
            $inventory.remove(pBookToRemove).then(onSuccess, onError);

            function onSuccess(response) {
                $ionicLoading.show();
                load();
            }

            function onError(response) {
                $ionicLoading.hide();
                $rootScope.$broadcast("server.error");
            }
        }

        function showBookDetails(pBook) {
            var book = pBook;
            $log.debug('Showing details for book: ' + book.value.volumeInfo.title);
            $state.go('app.book_show', {
                'bookId': book._id
            });
        }

        function showActionMenu(book) {
            $scope.book = book;


            // Show the action sheet
            var hideSheet = $ionicActionSheet.show({
                // TODO_edit book
                /*buttons: [{
                    text: '<b>Edit</b>'
                }],*/
                destructiveText: 'Delete',
                titleText: 'Modify book entry',
                cancelText: 'Cancel',
                cancel: function() {
                    // hideSheet();
                },
                buttonClicked: function(index) {
                    //return true;
                },
                destructiveButtonClicked: function() {
                    var bookToRemove = $scope.book;
                    removeBook(bookToRemove);
                    return true;
                }
            });

            /*
            
            var modalInstance = $modal.open({
                templateUrl: 'bookActions.html',
                controller: ModalInstanceCtrl,
                resolve: {
                    book: function() {
                        return $scope.book;
                    },
                    inventory: function() {
                        return $inventory;
                    }
                }
            });
            modalInstance.result.then(function(pRemovedBook) {
                load();
            }, function() {
                $log.info('Modal dismissed at: ' + new Date());
            });*/
        }

        load();

        // public methods
        $scope.load = load;
        $scope.search = search;
        $scope.showBookDetails = showBookDetails;
        $scope.showActionMenu = showActionMenu;
        $scope.resetSearch = resetSearch;

    }
]);


/**
 * Controller to add new book entries to inventory
 *
 */
app.controller('BookDetailsController', ['$rootScope', '$scope', '$stateParams', '$ionicLoading', '$location', 'LogService', 'SettingsService', 'InventoryService', 'GoogleBookService',
    function($rootScope, $scope, $stateParams, $ionicLoading, $location, $log, $settings, $inventory, $books) {
        var booksInventory, credentials = $settings.load();
        var bookID = $stateParams.bookId;

        function load() {
            if (bookID) {
                $inventory.read().then(onSuccess, onError);
            }

            function onSuccess(response) {
                var allBooks = response.books;
                var selectedBook;
                for (var index in allBooks) {
                    var book = allBooks[index];
                    if (book._id == bookID) {
                        selectedBook = book;
                        break;
                    }
                }
                $scope.selectedBook = enrichSingleDbEntry(selectedBook)
                $scope.selectedBook = selectedBook;
                $scope.searching = false;
            }

            function onError(response) {
                $scope.selectedBook = null;
                $scope.searching = false;
            }
        }

        load(bookID);

    }
]);

/**
 * Controller to add new book entries to inventory
 *
 */
app.controller('BookController', ['$rootScope', '$scope', '$ionicLoading', '$http', '$q', '$state', '$resource', '$ionicModal', 'LogService', 'SettingsService', 'InventoryService', 'GoogleBookService',
    function($rootScope, $scope, $ionicLoading, $http, $q, $state, $resource, $ionicModal, $log, $settings, $inventory, $books) {
        var booksInventory,
            credentials = $settings.load().activeProfile();

        function init() {
            $ionicModal.fromTemplateUrl('book_modal.html', {
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
        }

        /**
         * Scan book via ISBN barcode
         */
        function scan() {
            $ionicLoading.show();
            cordova.plugins.barcodeScanner.scan(
                function(result) {
                    if (!result.cancelled) {
                        $log.debug('We got a barcode\n' +
                            'Result: ' + result.text + '\n' + 'Format: ' + result.format + '\n');
                        $scope.searchQuery.isbn = result.text;
                        search();
                        $ionicLoading.hide();
                    }
                },
                function(error) {
                    $log.error("Scanning failed.");
                    $rootScope.$broadcast("barcode.error");
                    $ionicLoading.hide();
                }
            );
        }

        /**
         * Search a book to add via Google Book Search.
         * Currently only isbn search is implemented.
         *
         */
        function search() {
            $scope.books = null;
            var searchQuery = $scope.searchQuery;

            if (searchQuery) {
                // reset search
                booksInventory = {};
                $inventory.read().then(onSuccess, onError);
            }

            function onSuccess(response) {
                booksInventory = response.books;
                $log.debug("Start searching with criteria: " + JSON.stringify(searchQuery));
                retrieve(searchQuery);
            }

            function onError(response) {
                $log.error('Error during reading inventory for search with critera ' + JSON.stringify(searchQuery) + ':' + JSON.stringify(response));
            }
        }

        /**
         * Perform Google Book Search
         *
         */
        function retrieve(pSearchQuery) {
            $ionicLoading.show();
            $books.search(pSearchQuery).then(onSuccess, onError);

            function onSuccess(response) {
                $log.info("Got valid service response");
                $scope.books = response.books;
                $ionicLoading.hide();
            }

            function onError(response) {
                $rootScope.$broadcast("booksearch.invalid");
                $ionicLoading.hide();
            }
        }

        function reset() {
            $ionicLoading.show();
            $scope.books = null;
            $scope.infoMsg = null;
            $scope.searchQuery = null;
            $scope.selectedBook = null;
            $scope.searchQuery = {};
            $ionicLoading.hide();
            $state.go('app.books');
        }

        /**
         * Triggered from the UI if user selects a book which he wants to add.
         *
         */
        function selectBook(pSelectedBookValue) {
            $ionicLoading.show();
            var newEntry = true,
                book = pSelectedBookValue,
                books = booksInventory,
                authorInfo = "";
            $log.debug('Showing details for book: ' + JSON.stringify(book.value));
            for (var itemIndex in book.value.volumeInfo.authors) {
                var authorsInfo = book.value.volumeInfo.authors;
                if (authorsInfo) {
                    var authorCount = authorsInfo.length;
                    authorInfo += authorsInfo[itemIndex];
                    if (itemIndex < authorCount - 1) {
                        authorInfo += ", ";
                    }
                }
            }
            var count = 0;
            if (books) {
                var isbn0;
                if (pSelectedBookValue.value.volumeInfo.industryIdentifiers) {
                    var indIDs = pSelectedBookValue.value.volumeInfo.industryIdentifiers;
                    if (indIDs[0]) {
                        isbn0 = indIDs[0].identifier;
                    }
                }
                for (var id in books) {
                    var bookEntry = books[id],
                        currentISBN = bookEntry.value.volumeInfo.industryIdentifiers[0].identifier;
                    // only add complet entries to results
                    if (isbn0 && currentISBN == isbn0) {
                        $log.debug("Already found a saved book entry: " + JSON.stringify(bookEntry));
                        book = bookEntry;
                        count++;
                    }
                }
            }
            if (count > 0) {
                $log.debug("Found already entry in couchdb");
                $scope.infoMsg = "Book is already added to library. Please update amount.";
            } else {
                $log.debug("Found no existing entry in couchdb");
                $scope.infoMsg = null;
                // set default count to 1
                count = 1;
                book.value.bookshelf = credentials.lastBookshelf;
            }
            book.count = count;
            book.authorInfo = authorInfo;
            book.value.owner = book.value.owner || credentials.owner;
            $scope.selectedBook = book;
            $scope.openModal();
            //$scope.toggle("overlaySelectedBookEntry");
            $ionicLoading.hide();
        }

        function save(book) {
            $ionicLoading.show();
            $log.debug("Starting save for book: ");

            // remember last bookshelf
            var config = $settings.load();
            config.activeProfile().lastBookshelf = book.value.bookshelf;
            $settings.save(config);
            $inventory.read().then(onSettingsSuccess, onSettingsError);

            function onSettingsSuccess(response) {
                $log.debug("Settings saving successfull.");
            }

            function onSettingsError(response) {
                $log.error("Settings saving was not successfull.");
            }

            $inventory.save(book).then(onSuccess, onError);

            function onSuccess(response) {
                $log.info("Successfully added book");
                $ionicLoading.hide();
                if (response.noUpdate) {
                    navigator.notification.alert("Book already added. Please increase amount.");
                } else  {
                    // sync on save
                    if (config.activeProfile().remotesync) {
                        $inventory.syncRemote();
                    }
                    navigator.notification.alert("Book successfully added.", reset(), "Book");
                }
            }

            function onError(response) {
                $rootScope.$broadcast("booksave.error");
                $log.debug("Error during book saving: ");
                $scope.infoMsg = null;
                $ionicLoading.hide();
            }
        }

        init();

        $scope.searchQuery = {};
        $scope.infoMsg = null;

        // public methods
        $scope.scan = scan;
        $scope.save = save;
        $scope.selectBook = selectBook;
        $scope.search = search;
    }
]);

app.controller('SettingsController', ['$rootScope', '$scope', '$ionicLoading', '$state', 'LogService', 'SettingsService', 'InventoryService',
    function($rootScope, $scope, $ionicLoading, $state, $log, $settings, $inventory) {

        var defaultCouch = 'https://server.holisticon.de/couchdb/flynn/',
            defaultUser = '<LDAP-User>',
            defaultPassword,
            defaultOwner = 'Holisticon AG';

        // autoload
        loadSettings();
        readSyncLogs();

        function loadSettings() {
            console.debug("Loading settings from local storage");
            var config = $settings.load();
            $scope.flynn = {};
            $scope.flynn.activeProfile = {};
            $scope.flynn.activeProfile.name = config.activeProfile().name || 'default';
            $scope.flynn.activeProfile.owner = config.activeProfile().owner || defaultOwner;
            $scope.flynn.activeProfile.dbName = config.activeProfile().dbName || 'flynnDB_' + $scope.flynn.activeProfile.name;
            $scope.flynn.activeProfile.remotesync = config.activeProfile().remotesync || false;
            $scope.flynn.activeProfile.couchdb = config.activeProfile().couchdb || defaultCouch;
            $scope.flynn.activeProfile.user = config.activeProfile().user || defaultUser;
            $scope.flynn.activeProfile.password = config.activeProfile().password || defaultPassword;
        }

        function saveSettings() {
            $log.debug("Saving settings to local storage");
            $ionicLoading.show();
            var profile = $scope.flynn.activeProfile;

            // adding default profile
            var config = {},
                profiles = [];
            profiles.push(profile);
            config.activeProfileID = 0;
            config.profiles = profiles;
            // save config
            $settings.save(config);
            // sync if server was added
            if ($scope.flynn.activeProfile.remotesync) {
                syncWithServer();
            }
            $inventory.read().then(onSuccess, onError);

            function onSuccess(response) {
                $ionicLoading.hide();
                $log.debug("Got valid server response. Settings seeem to be valid.");
                $state.go('app.books');
            }

            function onError(response) {
                $ionicLoading.hide();
                $settings.valid = false;
                $rootScope.$broadcast("settings.invalid");
            }
        }

        function syncWithServer() {
            $inventory.syncRemote();
        }

        function readSyncLogs() {
            $ionicLoading.show();
            var logs = $inventory.readLogs();
            if (logs) {
                $scope.syncLogs = logs.sync;
            }
            $ionicLoading.hide();
        }

        // public methods
        $scope.load = loadSettings;
        $scope.save = saveSettings;
        $scope.sync = syncWithServer;
        $scope.showLogs = readSyncLogs;
    }
]);