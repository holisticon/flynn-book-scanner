app.factory('base64', function() {
    'use strict';

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

/**
 * @ngdoc service
 * @name googleBookService
 * @module flynnBookScannerApp
 * @description Provides access to the book search. Used Google Book Search as backend.
 */
app.service('googleBookService', ['$rootScope', '$http', '$q', 'settingsService', 'base64', 'logService',

    function($rootScope, $http, $q, settingsService, base64, logService) {
        'use strict';
        var usedCode;
        return {

            convertCodeToIsbn: function(number) {
                logService.debug('Converting convertCodeToIsbn: ' + number);
                if (number && number.indexOf("978") == 0) {
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
                logService.debug("Converted convertCodeToIsbn: " + number);
                return number;
            },
            search: function(pSearchCriteria) {
                var config = settingsService.load();
                self = this,
                    usedCode = pSearchCriteria.isbn;

                var deferred = $q.defer();
                var searchQuery;
                if (usedCode) {
                    var code = self.convertCodeToIsbn(usedCode);
                    logService.debug("Reading book data for ISBN " + code);
                    searchQuery = ':isbn=' + code;
                } else {
                    searchQuery = pSearchCriteria.keyword;
                }
                if (searchQuery) {
                    var gbooksUrl = 'https://www.googleapis.com/books/v1/volumes/?q=' + searchQuery + '&projection=full&key=' + config.googleApiKey;
                    //var deferred = $q.defer();
                    logService.debug("Reading book data with google books url: " + gbooksUrl);
                    $http({
                        method: 'GET',
                        url: gbooksUrl,
                        timeout: config.timeout,
                        headers: {
                            'Access-Control-Allow-Origin': 'localhost',
                            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                        }
                    }).then(onSuccess, onError);
                }

                function onSuccess(response) {
                    logService.debug("Got valid book data.");
                    var valid = false;
                    var data = response.data;
                    var usedISBN,
                        book,
                        books = [];
                    if (usedCode) {
                        usedISBN = self.convertCodeToIsbn(usedCode);
                    }
                    if (data) {
                        logService.debug('Received book RAW data: ' + JSON.stringify(data));
                        var count = 0;
                        for (var itemIndex in data.items) {
                            book = {};
                            book.value = data.items[itemIndex];
                            if (usedCode) {
                                var bookIDs = book.value.volumeInfo.industryIdentifiers;
                                for (var bookIdIndex in bookIDs) {
                                    var bookIdDtls = bookIDs[bookIdIndex];
                                    if (bookIdDtls) {
                                        if (bookIdDtls.identifier === usedISBN) {
                                            books.push(book);
                                            logService.info('Found matching result.');
                                            count++;
                                        }
                                    }
                                }
                            } else {
                                books.push(book);
                                count++;
                            }
                        }
                        if (count > 0) {
                            response.books = books;
                            deferred.resolve(response);
                        } else {
                            logService.info('Received no results.');

                            if (usedCode) {
                                logService.info('Retry with fulltext search once againg.');
                                response.books = null;
                                var searchCriteria = {};
                                searchCriteria.keyword = usedCode;
                                self.search(searchCriteria).then(onSuccess, onError);
                            } else {
                                deferred.resolve(response);
                            }
                        }
                    } else {
                        logService.info('Received no data.');
                        response.books = null;
                        deferred.resolve(response);
                    }
                }

                function onError(response) {
                    logService.error('Got HTTP error ' + response.status + ' (' + response.statusText + ')');
                    deferred.reject(response);
                }

                return deferred.promise;
            }

        };

    }
]);