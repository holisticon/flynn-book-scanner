'use strict';

// http://127.0.0.1:9000/#/book?isbn=9783499606601
var app = angular.module('flynnBookScannerApp');

app.controller('BooksController', ['$rootScope', '$scope', 'blockUI', '$http', 'LogService', 'SettingsService', 'InventoryService',
    function($rootScope, $scope, blockUI, $http, $log, $settings, $inventory) {
        // https://host:port/flynn/_design/books/_view/all
        var credentials = $settings.load();

        // autoload
        load();

        function load() {
            blockUI.start();
            $inventory.read().then(onSuccess, onError);

            function onSuccess(response) {
                $scope.books = response.books;
                blockUI.stop();
            }

            function onError(response) {
                $rootScope.$broadcast("server.error");
                blockUI.stop();
            }
        }

        function showBookDetails(pSelectedBookValue) {
            blockUI.start();
            var book = pSelectedBookValue.value;
            $log.debug('Showing details for book: ' + book.volumeInfo.title);
            var authorInfo = "";
            var authorCount = book.volumeInfo.authors.length;
            for (var itemIndex in book.volumeInfo.authors) {
                authorInfo += book.volumeInfo.authors[itemIndex];
                if (itemIndex < authorCount - 1) {
                    authorInfo += ", ";
                }
            }
            book.authorInfo = authorInfo;
            $scope.selectedBook = book;
            $scope.toggle('overlaySearchEntry');
            blockUI.stop();
        }

        $scope.books = null;

        // public methods
        $scope.load = load;
        $scope.showBookDetails = showBookDetails;

    }
]);

app.controller('BookController', ['$rootScope', '$scope', 'blockUI', '$http', '$q', '$location', '$resource', 'LogService', 'SettingsService', 'InventoryService', 'GoogleBookService',
    function($rootScope, $scope, blockUI, $http, $q, $location, $resource, $log, $settings, $inventory, $books) {
        var saveSuccess,
            booksInventory,
            credentials = $settings.load();

        function scan() {
            blockUI.start();
            cordova.plugins.barcodeScanner.scan(
                function(result) {
                    if (!result.cancelled) {
                        $log.debug('We got a barcode\n' +
                            'Result: ' + result.text + '\n' + 'Format: ' + result.format + '\n');
                        $scope.searchQuery.isbn = result.text;
                        search();
                    }
                },
                function(error) {
                    $log.error("Scanning failed.");
                    $rootScope.$broadcast("barcode.error");
                }
            );
            blockUI.stop();
        }


        function search() {
            var searchQuery = $scope.searchQuery;

            $inventory.read().then(onSuccess, onError);

            function onSuccess(response) {
                booksInventory = response.books;
            }

            function onError(response) {
                booksInventory = {};
            }

            if (searchQuery) {
                $log.debug("Start searching with criteria: " + JSON.stringify(searchQuery));
                blockUI.start();
                retrieve(searchQuery);
                blockUI.stop();
            }
        }

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

        function selectBook(pSelectedBookValue) {
            blockUI.start();
            var newEntry = true,
                book = pSelectedBookValue,
                isbn = pSelectedBookValue.volumeInfo.industryIdentifiers[1].identifier,
                books = booksInventory,
                authorInfo = "";
            $log.debug('Showing details for book: ' + book.volumeInfo.title);
            for (var itemIndex in book.volumeInfo.authors) {
                if (pSelectedBookValue.volumeInfo.authors) {
                    var authorCount = pSelectedBookValue.volumeInfo.authors.length;
                    authorInfo += book.volumeInfo.authors[itemIndex];
                    if (itemIndex < authorCount - 1) {
                        authorInfo += ", ";
                    }
                }
            }
            if (books) {
                for (var id in books) {
                    var bookEntry = books[id],
                        currentISBN = bookEntry.value.volumeInfo.industryIdentifiers[1].identifier;
                    // only add complet entries to results
                    if (currentISBN == isbn) {
                        $log.debug("Already found a saved book entry: " + JSON.stringify(bookEntry));
                        book = bookEntry.value;
                        newEntry = false;
                    }
                }
            }
            if (!newEntry) {
                $log.debug("Found already entry in couchdb");
                $scope.infoMsg = "Book is already added to library. Please update amount.";
            } else {
                $log.debug("Found no existing entry in couchdb");
                $scope.infoMsg = null;
            }
            book.authorInfo = authorInfo;
            $scope.selectedBook = book;

            $scope.toggle("overlaySelectedBookEntry");
            blockUI.stop();
        }

        function save(book) {
            blockUI.start();
            $log.debug("Starting save for book: ");
            $inventory.save(book).then(onSuccess, onError);

            function onSuccess(response) {
                // TODO add confirm
                $log.info("Successfully added book");
                $scope.infoMsg = "Book successfully added.";
                $scope.searchQuery = null;
                $scope.books = {};
                saveSuccess = true;
                blockUI.stop();
                $location.path("/book");
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
            defaultUser = 'flynn_user',
            defaultPassword = 'Passw0rd!',
            defaultApiKey = 'AIzaSyC8qspKiGBqhXNqkeF6v-D72SrKO-SzCNY';

        function load() {
            console.debug("Loading settings from local storage");
            var credentials = $settings.load();
            $scope.flynn.user = credentials.user || defaultUser;
            $scope.flynn.password = credentials.password || defaultPassword;
            $scope.flynn.couchdb = credentials.couchdb || defaultCouch;
        }

        function save() {
            $log.debug("Saving settings to local storage");
            $settings.save($scope.flynn.user, $scope.flynn.password, $scope.flynn.couchdb, defaultApiKey);
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

        function sync() {
            $inventory.syncRemote();
        }

        $scope.flynn = {};

        // public methods
        $scope.load = load;
        $scope.save = save;
        $scope.sync = sync;
    }
]);