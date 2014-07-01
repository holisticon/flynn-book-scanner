'use strict';

// http://127.0.0.1:9000/#/book?isbn=9783499606601
var app = angular.module('flynnBookScannerApp');

app.controller('BooksController', ['$rootScope', '$scope', 'blockUI', '$http', 'LogService', '$modal', 'InventoryService',
    function($rootScope, $scope, blockUI, $http, $log, $modal, $inventory) {
        /**
         * Reduces multiple db entries to set without duplicates. This method also counts the records
         * to get the amount of book entries
         */
        function enrichDbData(pDbEntries) {
            var result = null,
                bookEntries = {},
                resultsFound = false;
            if (pDbEntries) {
                for (var itemIndex in pDbEntries) {
                    var itemInfo = pDbEntries[itemIndex];
                    var isbn = itemInfo.value.volumeInfo.industryIdentifiers[1].identifier;
                    if (bookEntries[isbn]) {

                        bookEntries[isbn].count += 1;
                        bookEntries[isbn].docs.push(itemInfo);
                    } else {
                        bookEntries[isbn] = {};
                        bookEntries[isbn].value = itemInfo.value;
                        bookEntries[isbn].count = 1;
                        bookEntries[isbn].docs = [];
                        bookEntries[isbn].docs.push(itemInfo);
                        var authorInfo;
                        if (itemInfo.value.volumeInfo.authors) {
                            authorInfo = '';
                            var authorCount = itemInfo.value.volumeInfo.authors.length;
                            for (var itemIndex in itemInfo.value.volumeInfo.authors) {
                                authorInfo += itemInfo.value.volumeInfo.authors[itemIndex];
                                if (itemIndex < authorCount - 1) {
                                    authorInfo += ', ';
                                }
                            }
                        }
                        bookEntries[isbn].authorInfo = authorInfo;
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

        /**
         * load data via inventory service
         *
         */
        function load() {
            blockUI.start();
            $scope.searchQuery = {};
            $inventory.read().then(onSuccess, onError);

            function onSuccess(response) {
                $scope.books = enrichDbData(response.books);
                blockUI.stop();
            }

            function onError(response) {
                $rootScope.$broadcast("server.error");
                blockUI.stop();
            }
        }

        /**
         * Perform search within the all books view.
         * Currently only fulltext search is supported
         *
         */
        function search() {
            var searchQuery = $scope.searchQuery;
            $scope.searching = true;
            if ($scope.searchQuery.fullTextSearch) {
                $inventory.search(searchQuery).then(onSuccess, onError);
            } else {
                $inventory.read().then(onSuccess, onError);
            }

            function onSuccess(response) {
                $scope.books = enrichDbData(response.books);
                $scope.searching = false;
            }

            function onError(response) {
                $scope.books = null;
                $scope.searching = false;
            }
        }

        /**
         * On select show book details in popup
         *
         */
        function showBookDetails(pSelectedBookValue) {
            blockUI.start();
            var book = pSelectedBookValue;
            $log.debug('Showing details for book: ' + book.value.volumeInfo.title);
            $scope.selectedBook = book;
            $scope.toggle('overlaySearchEntry');
            blockUI.stop();
        }

        function openActionsModal(book) {
            $scope.book = book;

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
            });
        }


        // public methods
        $scope.load = load;
        $scope.search = search;
        $scope.showBookDetails = showBookDetails;
        $scope.open = openActionsModal;
    }
]);

// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.
var ModalInstanceCtrl = function($rootScope, $scope, $modalInstance, inventory, book) {

    $scope.book = book;

    function cancel() {
        $modalInstance.dismiss('cancel');
    }
    /**
     * remove book from inventory
     *
     */
    function remove() {
        var self = this;
        $scope.searchQuery = {};
        var bookToRemove = $scope.book;
        inventory.remove(bookToRemove).then(onSuccess, onError);

        function onSuccess(response) {
            $modalInstance.close(bookToRemove);
        }

        function onError(response) {
            $rootScope.$broadcast("server.error");
            cancel();
        }
    }

    $scope.remove = remove;
    $scope.cancel = cancel;
};
/**
 * Controller to add new book entries to inventory
 *
 */
app.controller('BookController', ['$rootScope', '$scope', 'blockUI', '$http', '$q', '$location', '$resource', 'LogService', 'SettingsService', 'InventoryService', 'GoogleBookService',
    function($rootScope, $scope, blockUI, $http, $q, $location, $resource, $log, $settings, $inventory, $books) {
        var booksInventory,
            credentials = $settings.load().activeProfile();

        /**
         * Scan book via ISBN barcode
         */
        function scan() {
            blockUI.start();
            cordova.plugins.barcodeScanner.scan(
                function(result) {
                    if (!result.cancelled) {
                        $log.debug('We got a barcode\n' +
                            'Result: ' + result.text + '\n' + 'Format: ' + result.format + '\n');
                        $scope.searchQuery.isbn = result.text;
                        search();
                        blockUI.stop();
                    }
                },
                function(error) {
                    $log.error("Scanning failed.");
                    $rootScope.$broadcast("barcode.error");
                    blockUI.stop();
                }
            );
        }

        /**
         * Search a book to add via Google Book Search.
         * Currently only isbn search is implemented.
         *
         */
        function search() {
            blockUI.start();
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
                blockUI.stop();
            }

            function onError(response) {
                blockUI.stop();
            }
        }

        /**
         * Perform Google Book Search
         *
         */
        function retrieve(pSearchQuery) {
            $books.search(pSearchQuery).then(onSuccess, onError);

            function onSuccess(response) {
                $log.info("Got valid service response");
                $scope.books = response.books;
            }

            function onError(response) {
                $rootScope.$broadcast("booksearch.invalid");
            }
        }

        function reset() {
            blockUI.start();
            $scope.books = null;
            $scope.infoMsg = null;
            $scope.searchQuery = null;
            $scope.selectedBook = null;
            $scope.searchQuery = {};
            blockUI.stop();
            $location.path("/book");
        }

        /**
         * Triggered from the UI if user selects a book which he wants to add.
         *
         */
        function selectBook(pSelectedBookValue) {
            blockUI.start();
            var newEntry = true,
                book = pSelectedBookValue,
                isbn = pSelectedBookValue.value.volumeInfo.industryIdentifiers[1].identifier,
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
                for (var id in books) {
                    var bookEntry = books[id],
                        currentISBN = bookEntry.value.volumeInfo.industryIdentifiers[1].identifier;
                    // only add complet entries to results
                    if (currentISBN == isbn) {
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
            $scope.toggle("overlaySelectedBookEntry");
            blockUI.stop();
        }

        function save(book) {
            blockUI.start();
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
                blockUI.stop();
                if (response.noUpdate) {
                    navigator.notification.alert("Book already added. Please increase amount.");
                } else  {
                    $scope.toggle("overlaySelectedBookEntry");
                    navigator.notification.alert("Book successfully added.", reset(), "Book");
                }
            }

            function onError(response) {
                $rootScope.$broadcast("booksave.error");
                $log.debug("Error during book saving: ");
                $scope.infoMsg = null;
                blockUI.stop();
            }
        }

        $scope.searchQuery = {};
        $scope.infoMsg = null;

        // public methods
        $scope.scan = scan;
        $scope.save = save;
        $scope.selectBook = selectBook;
        $scope.search = search;
    }
]);

app.controller('SettingsController', ['$rootScope', '$scope', '$location', 'LogService', 'SettingsService', 'InventoryService',
    function($rootScope, $scope, $location, $log, $settings, $inventory) {

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
            $scope.flynn.activeProfile.dbName = config.activeProfile().dbName || 'flynnDB_' + config.activeProfile().name;
            $scope.flynn.activeProfile.remotesync = config.activeProfile().remotesync || false;
            $scope.flynn.activeProfile.couchdb = config.activeProfile().couchdb || defaultCouch;
            $scope.flynn.activeProfile.user = config.activeProfile().user || defaultUser;
            $scope.flynn.activeProfile.password = config.activeProfile().password || defaultPassword;
        }

        function saveSettings() {
            $log.debug("Saving settings to local storage");
            var profile = $scope.flynn.activeProfile;

            // adding default profile
            var config = {},
                profiles = [];
            profiles.push(profile);
            config.activeProfileID = 0;
            config.profiles = profiles;
            // save config
            $settings.save(config);
            $inventory.read().then(onSuccess, onError);

            function onSuccess(response) {
                $log.debug("Got valid server response. Settings seeem to be valid.");
                $location.path("/books");
            }

            function onError(response) {
                $settings.valid = false;
                $rootScope.$broadcast("settings.invalid");
            }
        }

        function syncWithServer() {
            $inventory.syncRemote();
        }

        function readSyncLogs() {
            var logs = $inventory.readLogs();
            if (logs) {
                $scope.syncLogs = logs.sync;
            }
        }

        // public methods
        $scope.load = loadSettings;
        $scope.save = saveSettings;
        $scope.sync = syncWithServer;
        $scope.showLogs = readSyncLogs;
    }
]);