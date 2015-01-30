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