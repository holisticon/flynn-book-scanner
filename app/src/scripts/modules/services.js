'use strict';

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
                        var usedISBN = convertCodeToIsbn(usedCode),
                            book,
                            books = [];
                        if (data) {
                            $log.debug("Received book RAW data: " + JSON.stringify(data));
                            for (var itemIndex in data.items) {
                                book = data.items[itemIndex];
                                var bookIDs = book.volumeInfo.industryIdentifiers;
                                for (var bookIdIndex in bookIDs) {
                                    var bookIdDtls = bookIDs[bookIdIndex];
                                    if (bookIdDtls) {
                                        if (bookIdDtls.identifier === usedISBN) {
                                            books.push(book);
                                            $log.info("Found matching result.");
                                        }
                                    }

                                }
                            }
                            response.books = books;
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
        var flynnDB;
        return {
            sync: function(pSearchQuery) {
                log.debug('Startin');


                /*
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
*/
            },
            saveRemote: function(pBookToSave) {
                var deferred = $q.defer(),
                    credentials = $settings.load();
                $log.debug('Starting save for book: ' + JSON.stringify(pBookToSave));
                //var bookResource = new BookResource(book);
                $http({
                    method: 'POST',
                    url: credentials.couchdb,
                    data: pBookToSave,
                    timeout: credentials.timeout,
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
                    $log.info("Successfully added book");
                    response.saveSuccess = true;
                    deferred.resolve(response);
                }

                function onError(response) {
                    var errorCode = response.status;
                    $log.error("Error during saving data to couchdb: " + errorCode);
                    if (errorCode == 0) {
                        $log.error("Network error!");
                    }
                    deferred.reject(response);
                }
                return deferred.promise;
            },
            read: function() {
                var deferred = $q.defer(),
                    books = null,
                    local = {};
                flynnDB = new PouchDB('flynn');
                if (flynnDB) {
                    $log.debug(flynnDB.adapter);
                    flynnDB.allDocs({
                        include_docs: true,
                        descending: true
                    }, function(err, doc) {
                        if (!err) {
                            var books = null,
                                rows = doc.rows;
                            if (rows && rows.length > 0) {
                                books = [];
                                for (var id in rows) {
                                    var bookEntry = rows[id].doc;
                                    // only add complet entries to results
                                    if (bookEntry.value.volumeInfo) {
                                        $log.debug("Read following valid book entry: " + JSON.stringify(bookEntry));
                                        books.push(bookEntry);
                                    }
                                }
                            }
                            local.books = books;
                            deferred.resolve(local);
                        } else  {
                            $log.error("Reading from local db not working");
                            deferred.reject(local);
                        }
                    });
                    // TODO Sync with remote db
                } else  {
                    deferred.reject(local);
                }
                return deferred.promise;

            },
            search: function(pSearchQuery) {
                log.debug('Startin');
            },
            save: function(pBookToSave) {
                var deferred = $q.defer(),
                    credentials = $settings.load();
                $log.debug('Starting save for book: ' + JSON.stringify(pBookToSave));
                if (flynnDB) {
                    var book = {};
                    if (!book._id) {
                        book._id = 'bookid_' + (new Date()).getTime();
                    }
                    book.value = pBookToSave;
                    flynnDB.put(book, function callback(err, result) {
                        var response = {};
                        if (!err) {
                            console.log('Successfully posted a todo!');
                            $log.info("Successfully added book");
                            $log.debug("Saved book: " + JSON.stringify(result));
                            response.saveSuccess = true;
                            deferred.resolve(response);
                        } else {
                            deferred.reject(response);
                        }
                    });
                }
                // TODO error handling
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
                    settings.timeout = 20000;
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