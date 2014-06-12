'use strict';

// http://127.0.0.1:9000/#/book?isbn=9783499606601
var app = angular.module('controllers', []);

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

app.controller('BooksController', ['$scope', '$log', '$http', 'SettingsService', 'Base64',
    function($scope, $log, $http, $settings, $base64) {
        // https://host:port/flynn/_design/books/_view/all
        var credentials = $settings.load();
        $http.defaults.headers.get = {
            'Authorization': 'Basic ' + $base64.encode(credentials.user + ':' + credentials.password),
            'Content-Type': 'application/json'
        };

        // autoload
        load();

        function load() {
            $http.get(credentials.couchdb + '/_design/books/_view/all').success(function(data) {
                var books = [];
                var rows = data.rows;
                if (rows) {
                    for (var id in rows) {
                        var bookEntry = rows[id];
                        //only add complet entries to results
                        if (bookEntry.value.volumeInfo) {
                            books.push(bookEntry);
                        }
                    }
                }
                $scope.books = books;
            }, function(error) {
                alert(JSON.stringify(error));
            });
        }

        $scope.books = null;
        $scope.load = load;

    }
]);

app.controller('BookController', ['$scope', '$http', '$location', '$resource', 'SettingsService', 'Base64',
    function($scope, $http, $location, $resource, $settings, $base64) {
        var isbn = $location.search().isbn || '9783898646123',
            BookResource,
            credentials = $settings.load(),
            credentialsComplete = $settings.verify();


        function scan() {
            cordova.plugins.barcodeScanner.scan(
                function(result) {
                    if (!result.cancelled) {
                        console.debug('We got a barcode\n' +
                            'Result: ' + result.text + '\n' + 'Format: ' + result.format + '\n');
                    }
                    retrieve(result.text);
                    $scope.isbn = result.text;
                },
                function(error) {
                    console.error('Scanning failed: ' + error);
                }
            );
        }

        function search() {
            retrieve($scope.isbn);
        }

        function retrieve(code) {
            function convertCodeToIsbn(number) {
                if (number.indexOf("978") == 0) {
                    number = number.substr(3, 9);
                    var xsum = 0;
                    var add = 0;
                    var i = 0;
                    for (i = 0; i < 9; i++) {
                        add = number.substr(i, 1);
                        xsum += (10 - i) * add;
                    }
                    xsum %= 11;
                    xsum = 11 - xsum;
                    if (xsum == 10) {
                        xsum = "X";
                    }
                    if (xsum == 11) {
                        xsum = "0";
                    }
                    number += xsum;
                }
                return number;
            }
            code = convertCodeToIsbn(code);
            $http.get('https://www.googleapis.com/books/v1/volumes/?q=:isbn=' + code + '&projection=full&maxResults=1').success(function(data) {
                for (var itemIndex in data.items) {
                    data.items[itemIndex].count = 1;
                }
                $scope.books = data.items;

            }, function(error) {
                alert(JSON.stringify(error));
            });
        }

        function save(book) {
            var bookResource = new BookResource(book);
            bookResource.$save({}, function(data) {
                alert('OK');
            }, function(data) {
                alert('Failed: ' + JSON.stringify(data));
            });
        }

        $scope.isbn = isbn;

        if (!credentialsComplete) {
            $location.path("/settings");
        }

        $http.defaults.headers.post = {
            'Authorization': 'Basic ' + $base64.encode(credentials.user + ':' + credentials.password),
            'Content-Type': 'application/json'
        };

        BookResource = $resource(credentials.couchdb);
        console.debug("Reading book data for ISBN " + isbn);
        retrieve(isbn);

        $scope.isbn = isbn;
        $scope.scan = scan;
        $scope.save = save;
        $scope.search = search;
        $scope.device = typeof cordova !== 'undefined';

    }
]);

app.controller('SettingsController', ['$scope', '$location', 'SettingsService',
    function($scope, $location, $settings) {

        var credentials = $settings.load(),
            defaultCouch = 'https://server.holisticon.de/couchdb/flynn/',
            defaultUser = 'flynn_user',
            defaultPassword = 'Passw0rd!';

        function save() {
            console.debug("Saving settings to local storage");
            $settings.save($scope.user, $scope.password, $scope.couchdb);
            $location.path("/book");
        }
        $scope.user = credentials.user || defaultUser;
        $scope.password = credentials.password || defaultPassword;
        $scope.couchdb = credentials.couchdb || defaultCouch;
        $scope.save = save;
    }
]);

app.service('SettingsService', ['localStorageService',
    function(localStorage) {
        return {
            save: function(user, password, couchdb) {
                localStorage.clearAll();
                localStorage.add('flynn.settings', {
                    'user': user,
                    'password': password,
                    'couchdb': couchdb
                });
            },
            load: function() {
                console.log("Loading settings from local storage");
                var settings = localStorage.get('flynn.settings');
                if (settings) {
                    return settings;
                } else {
                    return {}
                }
            },
            verify: function() {
                console.log("Verifying flynn settings");
                var credentials = this.load();
                return (credentials && credentials.user && credentials.password && credentials.couchdb);
            }
        };

    }
]);