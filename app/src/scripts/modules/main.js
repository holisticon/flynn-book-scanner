'use strict';

app.service('LogService', ['$rootScope', '$log',
    function($rootScope, $log) {
        return {
            info: function(pMsg) {
                console.log(pMsg);
            },
            error: function(pMsg) {
                console.log(pMsg);
            },
            debug: function(pMsg) {
                console.log(pMsg);
            },
            trace: function(pMsg) {
                console.log(pMsg);
            }
        }
    }
]);


app.service('GoogleBookService', ['$rootScope', 'LogService', '$http', '$q', 'SettingsService', 'Base64',
    function($rootScope, $log, $http, $q, $settings, $base64) {
        var usedCode;
        return {
            search: function(pSearchCriteria) {
                var config = $settings.load();
                usedCode = pSearchCriteria.isbn;

                function convertCodeToIsbn(number) {
                    $log.debug('Converting convertCodeToIsbn: ' + number);
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
                    $log.debug("Converted convertCodeToIsbn: " + number);
                    return number;
                }
                var code = convertCodeToIsbn(usedCode);
                // save code for later usage
                $log.debug("Reading book data for ISBN " + code);

                var deferred = $q.defer();
                var gbooksUrl = 'https://www.googleapis.com/books/v1/volumes/?q=:isbn=' + code + '&projection=full&key=' + config.googleApiKey;
                //var deferred = $q.defer();
                $log.debug("Reading book data with google books url: " + gbooksUrl);
                $http({
                    method: 'GET',
                    url: gbooksUrl,
                    timeout: config.timeout,
                    headers: {
                        'Access-Control-Allow-Origin': 'localhost',
                        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                    }
                }).then(onSuccess, onError);

                function onSuccess(response) {
                    console.log("Got valid book data.");
                    var valid = false;
                    var data = response.data;
                    if (usedCode) {
                        var usedISBN = convertCodeToIsbn(usedCode);
                        var book;
                        if (data) {
                            $log.debug("Received book RAW data: " + JSON.stringify(data));
                            for (var itemIndex in data.items) {
                                book = data.items[itemIndex];
                                var bookIDs = book.volumeInfo.industryIdentifiers;
                                for (var bookIdIndex in bookIDs) {
                                    var bookIdDtls = bookIDs[bookIdIndex];
                                    if (bookIdDtls) {
                                        if (bookIdDtls.identifier === usedISBN) {
                                            valid = true;
                                        }
                                    }

                                }
                            }
                            if (valid) {
                                var books = [];
                                books.push(book);
                                response.books = books;
                                $log.info("Found matching result.");
                            } else  {
                                $log.info("Found no matching result.");
                                response.books = null;
                            }
                        } else {
                            $log.error("Received no data.");
                            response.books = null;
                        }
                    }
                    deferred.resolve(response);
                }

                function onError(response) {
                    $log.error("Got HTTP error " + response.status + " (" + response.statusText + ")");
                    deferred.reject(response);
                }
                return deferred.promise;
            }

        };

    }
]);

app.service('InventoryService', ['$rootScope', 'LogService', '$http', '$q', 'SettingsService', 'Base64',
    function($rootScope, $log, $http, $q, $settings, $base64) {
        return {
            read: function() {
                var deferred = $q.defer(),
                    credentials = $settings.load();
                $http({
                    method: 'GET',
                    url: credentials.couchdb + '/_design/books/_view/all',
                    timeout: credentials.timeout,
                    headers: {
                        'Authorization': 'Basic ' + $base64.encode(credentials.user + ':' + credentials.password),
                        'Content-Type': 'application/json'
                    }
                }).then(onSuccess, onError);

                function onSuccess(response) {
                    var books = [];
                    var rows = response.data.rows;
                    if (rows) {
                        for (var id in rows) {
                            var bookEntry = rows[id];
                            // only add complet entries to results
                            if (bookEntry.value.volumeInfo) {
                                $log.debug("Adding following valid book entry: " + JSON.stringify(bookEntry));
                                books.push(bookEntry);
                            }
                        }
                    }
                    response.books = books;
                    deferred.resolve(response);
                }

                function onError(response) {
                    var errorCode = response.status;
                    $log.error("Error during reading data from couchdb: " + errorCode);
                    if (errorCode == 0) {
                        $log.error("Network error!");
                    }
                    deferred.reject(response);
                }
                return deferred.promise;
            }

        };

    }
]);



app.service('SettingsService', ['$rootScope', 'localStorageService',
    function($rootScope, localStorage) {
        return {
            save: function(user, password, couchdb, googleApiKey) {
                localStorage.clearAll();
                localStorage.add('flynn.settings', {
                    'user': user,
                    'password': password,
                    'couchdb': couchdb,
                    'googleApiKey': googleApiKey
                });
            },
            load: function() {
                console.log("Loading settings from local storage");
                var settings = localStorage.get('flynn.settings');
                // TODO check settings
                if (settings) {
                    settings.valid = true;
                } else {
                    settings = {};
                    settings.valid = false;
                }
                $rootScope.settings = settings;
                return settings;
            },
            verify: function() {
                console.log("Verifying flynn settings");
                var credentials = this.load();
                return (credentials && credentials.user && credentials.password && credentials.couchdb);
            }

        };

    }
]);