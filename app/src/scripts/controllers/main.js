'use strict';

// http://127.0.0.1:9000/#/book?isbn=9783499606601
var app = angular.module('flynnBookScannerApp');

app.factory('Base64', function() {
    var keyStr = 'ABCDEFGHIJKLMNOP' +
        'QRSTUVWXYZabcdef' +
        'ghijklmnopqrstuv' +
        'wxyz0123456789+/' +
        '=';
    return {
        encode: function(input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);

            return output;
        },

        decode: function(input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                alert("There were invalid base64 characters in the input text.\n" +
                    "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                    "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";

            } while (i < input.length);

            return output;
        }
    };
});

app.controller('BooksController', ['$rootScope', '$scope', 'blockUI', '$http', 'SettingsService', 'InventoryService', 'Base64',
    function($rootScope, $scope, blockUI, $http, $settings, $inventory, $base64) {
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
            console.log('Showing details for book: ' + book.volumeInfo.title);
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

app.controller('SearchController', ['$rootScope', '$scope', 'blockUI', '$http', '$q', '$location', '$resource', 'SettingsService', 'GoogleBookService',
    'Base64',
    function($rootScope, $scope, blockUI, $http, $q, $location, $resource, $settings, $books, $base64) {
        var saveSuccess,
            credentials = $settings.load(),
            credentialsComplete = $settings.verify();

        function scan() {
            blockUI.start();
            cordova.plugins.barcodeScanner.scan(
                function(result) {
                    if (!result.cancelled) {
                        console.debug('We got a barcode\n' +
                            'Result: ' + result.text + '\n' + 'Format: ' + result.format + '\n');
                    }
                    retrieve(result.text);
                    $scope.searchQuery.isbn = result.text;
                    blockUI.stop();
                },
                function(error) {
                    console.log('Scanning failed: ' + error);
                    $rootScope.$broadcast("barcode.error");
                    blockUI.stop();
                }
            );
        }


        function search() {
            var searchQuery = $scope.searchQuery;
            if (searchQuery) {
                console.log("Start searching with criteria: " + JSON.stringify(searchQuery));
                blockUI.start();
                retrieve(searchQuery);
                blockUI.stop();
            }
        }

        function retrieve(pSearchQuery) {
            $books.search(pSearchQuery).then(onSuccess, onError);

            function onSuccess(response) {
                console.log("Got valid service response");
                $scope.books = response.books;
            }

            function onError(response) {
                $rootScope.$broadcast("booksearch.invalid");
            }
        }

        function selectBook(pSelectedBookValue) {
            blockUI.start();
            var book = pSelectedBookValue;
            //TODO search in backend !!
            console.log('Showing details for book: ' + book.volumeInfo.title);
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
            $scope.toggle('overlaySelectedBookEntry');
            blockUI.stop();
        }

        function save(book) {
            console.log('Starting save for book: ' + JSON.stringify(book));
            //var bookResource = new BookResource(book);
            $http({
                method: 'POST',
                url: credentials.couchdb,
                data: book,
                timeout: $settings.timeout,
                xhrFields: {
                    withCredentials: true
                },
                headers: {
                    'Authorization': 'Basic ' + $base64.encode(credentials.user + ':' + credentials.password),
                    'Access-Control-Allow-Origin': 'localhost',
                    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                    'Content-Type': 'application/json'
                }
            }).then(onSuccess, onError);

            function onSuccess(response) {
                // TODO add confirm
                console.log("Successfully added book");
                saveSuccess = true;
            }

            function onError(response) {
                $rootScope.$broadcast("booksave.error");
                console.log(JSON.stringify(error));
                blockUI.stop();
            }
        }

        if (!credentialsComplete) {
            $location.path("/settings");
        }

        $scope.searchQuery = {};

        // public methods
        $scope.scan = scan;
        $scope.save = save;
        $scope.selectBook = selectBook;
        $scope.search = search;
    }
]);

app.controller('SettingsController', ['$rootScope', '$scope', '$location', 'SettingsService', 'InventoryService',
    function($rootScope, $scope, $location, $settings, $inventory) {

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
            console.debug("Saving settings to local storage");
            $settings.save($scope.flynn.user, $scope.flynn.password, $scope.flynn.couchdb, defaultApiKey);
            $inventory.read().then(onSuccess, onError);

            function onSuccess(response) {
                console.log("Got valid server response. Settings seeem to be valid.");
                $location.path("/books");
            }

            function onError(response) {
                $settings.valid = false;
                $rootScope.$broadcast("settings.invalid");
            }
        }

        $scope.flynn = {};

        // public methods
        $scope.load = load;
        $scope.save = save;
    }
]);
