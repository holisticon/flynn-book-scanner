/**
 * @ngdoc service
 * @name googleBookService
 * @module flynnBookScannerApp
 * @description Provides access to the book search. Used Google Book Search as backend.
 */
app.service('googleBookService', ['$rootScope', '$http', '$q', '$log', 'settingsService', 'base64','APP_CONFIG',
    function($rootScope, $http, $q, $log, settingsService, base64,APP_CONFIG) {
        'use strict';
        var config = settingsService.load();

        function convertCodeToIsbn(number) {
            $log.debug('Converting convertCodeToIsbn: ' + number);
            if (number && number.indexOf("978") == 0) {
                number = number.substr(3, 9);
                var xsum = 0,
                    add = 0,
                    i = 0;
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
            $log.debug('Converted convertCodeToIsbn: ' + number);
            return number;
        }

        function buildBookResult(pData, pUsedCode) {
            var books = [];
            for (var itemIndex in pData.items) {
                var book = {};
                book.value = pData.items[itemIndex];
                if (pUsedCode) {
                    var usedISBN = convertCodeToIsbn(pUsedCode);

                    var bookIDs = book.value.volumeInfo.industryIdentifiers;
                    for (var bookIdIndex in bookIDs) {
                        var bookIdDtls = bookIDs[bookIdIndex];
                        if (bookIdDtls) {
                            if (bookIdDtls.identifier === usedISBN) {
                                books.push(book);
                                $log.info('Found matching result.');
                            }
                        }
                    }
                } else {
                    books.push(book);
                }
            }
            return books;
        }



        function onSuccess(pDeferred, pResponse, pUsedCode) {
            $log.debug("Got valid book data.");
            var valid = false;
            var data = pResponse.data;
            if (data) {
                $log.debug('Received book RAW data: ' + JSON.stringify(data));
                var books = buildBookResult(data, pUsedCode);
                if (books.length > 0) {
                    pResponse.books = books;
                    pDeferred.resolve(pResponse);
                } else {
                    $log.info('Received no results.');
                    pDeferred.resolve(pResponse);
                }
            } else {
                $log.info('Received no data.');
                response.books = null;
                pDeferred.resolve(response);
            }
        }

        function onError(pDeferred, pResponse) {
            $log.error('Got HTTP error ' + pResponse.status + ' (' + pResponse.statusText + ')');
            pDeferred.reject(pResponse);
        }

        function searchGoogleBookService(pSearchCriteria) {
            var usedCode = pSearchCriteria.isbn,
                deferred = $q.defer(),
                searchQuery;
            if (usedCode) {
                var code = convertCodeToIsbn(usedCode);
                $log.debug('Reading book data for ISBN ' + code);
                searchQuery = ':isbn=' + code;
            } else {
                searchQuery = pSearchCriteria.keyword;
            }
            if (searchQuery) {
                $log.debug('Reading book data with google books url');
                $http({
                    method: 'GET',
                    url: 'https://www.googleapis.com/books/v1/volumes/?q=' + searchQuery + '&projection=full&key=' + APP_CONFIG.googleApiKey,
                    timeout: APP_CONFIG.timeout,
                    headers: {
                        'Access-Control-Allow-Origin': 'localhost',
                        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                    }
                }).then(function(response) {
                    onSuccess(deferred, response, usedCode);
                }, function(response) {
                    if (pUsedCode) {
                        $log.info('Retry with fulltext search once again.');
                        searchCriteria.keyword = usedCode;
                        $log.debug('Reading book data with google books url');
                        $http({
                            method: 'GET',
                            url: 'https://www.googleapis.com/books/v1/volumes/?q=' + searchQuery + '&projection=full&key=' + APP_CONFIG.googleApiKey,
                            timeout: APP_CONFIG.timeout,
                            headers: {
                                'Access-Control-Allow-Origin': 'localhost',
                                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                            }
                        }).then(function(response) {
                            onSuccess(deferred, response, usedCode);
                        }, function(response) {
                            onError(deferred, response);
                        });
                    } else {
                        onError(deferred, response);
                    }
                });
            } else  {
                $log.info('Empty or unkown search criteria.');
                onError(deferred, response);
            }
            return deferred.promise;
        }
        return {
            search: searchGoogleBookService
        };

    }
]);