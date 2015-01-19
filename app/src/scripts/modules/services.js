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

/**
 * @ngdoc service
 * @name inventoryService
 *
 * @module flynnBookScannerApp
 *
 * @description
 * Provides access to the book inventory. Used PouchDB as backend.
 */
app.service('inventoryService', ['$rootScope', '$http', '$q', 'settingsService', 'base64', 'logService',

    function($rootScope, $http, $q, settingsService, base64, logService) {
        'use strict';
        var config = settingsService.load(),
            activeProfile = config.activeProfile();

        function getDB() {
            var NAME_OF_POUCHDB;
            config = settingsService.load();
            activeProfile = config.activeProfile();
            NAME_OF_POUCHDB = activeProfile.dbName;
            var db;
            if (!db) {
                if (typeof cordova != 'undefined' && cordova.platformId === 'android') {
                    // for performance use indexedDB on Android
                    db = new PouchDB(NAME_OF_POUCHDB, {
                        adapter: 'idb'
                    });
                } else {
                    // default use websql
                    db = new PouchDB(NAME_OF_POUCHDB, {
                        adapter: 'websql'
                    });
                }
            }
            return db;
        }

        return {
            syncRemote: function(reportNetworkError) {
                var deferred = $q.defer();
                // reload config
                config = settingsService.load();
                activeProfile = config.activeProfile();
                // Add authentication data
                var couchDbUrl = activeProfile.couchdb,
                    self = this,
                    localDB = getDB();
                if (localDB) {
                    if (activeProfile.user && activeProfile.password) {
                        var authorization = encodeURIComponent(activeProfile.user) + ':' + encodeURIComponent(activeProfile.password),
                            remoteCouch = couchDbUrl.replace("://", "://" + authorization + "@"),
                            opts = {
                                live: true
                            };
                        logService.info('Syncing with couchDB started: ' + couchDbUrl);

                        // check for network availability first
                        $http({
                            method: 'GET',
                            url: remoteCouch,
                            timeout: 900,
                        }).then(function(response) {
                            var syncPromise = localDB.sync(remoteCouch)
                                .on('change', function(info) {
                                    $rootScope.$apply(function() {
                                        logService.info('Updating documents with remote changes...');
                                        logService.debug('Updating documents with remote changes with following answer: ' + JSON.stringify(info));
                                    });
                                }).on('complete', function(info) {
                                    $rootScope.$apply(function() {
                                        logService.info('Completed sync.');
                                        logService.debug('Completed sync with following answer: ' + JSON.stringify(info));
                                        deferred.resolve(info);
                                    });
                                }).on('uptodate', function(info) {
                                    $rootScope.$apply(function() {
                                        logService.info('Already up-to-date.');
                                        logService.debug('Already up-to-date with following answer: ' + JSON.stringify(info));
                                        deferred.resolve(info);
                                    });
                                }).on('error', function(info) {
                                    $rootScope.$apply(function() {
                                        logService.error('Error during remote sync with following answer: ' + JSON.stringify(info));
                                        deferred.reject(info);
                                    });
                                }).catch(function(err) {
                                    $rootScope.$apply(function() {
                                        logService.error('Unkown error during remote sync: ' + JSON.stringify(err));
                                        deferred.resolve(err);
                                    });
                                });
                        }, function(err) {
                            if (err.status === 0) {
                                logService.info('Seems to run in offline mode.');
                                if (reportNetworkError) {
                                    deferred.reject(err);
                                } else {
                                    deferred.resolve(err);
                                }
                            } else {
                                if (err.status === 401) {
                                    logService.info('Seems to use invalid login data.');
                                    deferred.reject(err);
                                }
                                logService.error('Unkown error during connection check: ' + JSON.stringify(err));
                                deferred.resolve(err);
                            }
                        });
                    } else {
                        var response = {};
                        response.status = 401;
                        deferred.reject(response);
                    }
                    return deferred.promise;
                }
            },
            read: function() {
                var deferred = $q.defer(),
                    books = null,
                    response = {},
                    flynnDB = getDB();
                if (flynnDB) {
                    logService.debug('Using db-adapter: ' + flynnDB.adapter);
                    flynnDB.allDocs({
                        include_docs: true,
                        attachments: true,
                        descending: true
                    }, function(err, doc) {
                        $rootScope.$apply(function() {
                            if (!err) {
                                var books = null,
                                    rows = doc.rows;
                                if (rows && rows.length > 0) {
                                    books = [];
                                    for (var id in rows) {
                                        var bookEntry = rows[id].doc;
                                        // only add complet entries to results
                                        if (bookEntry.value && bookEntry.value.volumeInfo) {
                                            if (bookEntry._attachments) {
                                                var attachment = bookEntry._attachments['thumbnail_' + bookEntry.value.id];
                                                if (attachment) {
                                                    bookEntry.image = {};
                                                    bookEntry.image.content_type = attachment.content_type;
                                                    bookEntry.image.data = attachment.data;
                                                }
                                            }
                                            bookEntry._attachments = null;
                                            logService.debug('Read following valid book entry: ' + bookEntry.value.volumeInfo.title);
                                            books.push(bookEntry);
                                        }
                                    }
                                }
                                response.books = books;
                                if (books) {
                                    logService.debug('Found ' + books.length + ' books in inventory.');
                                }
                                deferred.resolve(response);
                            } else  {
                                logService.error('Reading from local db not working: ' + JSON.stringify(err));
                                deferred.reject(response);
                            }
                        });
                    });
                } else  {
                    deferred.reject(response);
                }
                return deferred.promise;

            },
            search: function(pSearchQuery) {
                var deferred = $q.defer(),
                    response = {},
                    flynnDB = getDB();
                logService.debug('Starting search: ' + JSON.stringify(pSearchQuery));
                if (pSearchQuery.isbn) {
                    var isbn = '' + pSearchQuery.isbn;
                    logService.debug("Starting isbn-search: " + isbn);
                    flynnDB.allDocs({
                        include_docs: true,
                        descending: true
                    }, function(err, res) {
                        $rootScope.$apply(function() {
                            if (!err) {
                                var rows = res.rows;
                                if (rows && rows.length > 0) {
                                    response.books = {};
                                    var count = 0;
                                    for (var id in rows) {
                                        var bookEntry = rows[id].doc;
                                        if (bookEntry.value && bookEntry.value.volumeInfo) {
                                            var idInfoDtls = bookEntry.value.volumeInfo.industryIdentifiers;
                                            if (idInfoDtls) {
                                                if (idInfoDtls[0].identifier == isbn) {
                                                    response.books[id] = bookEntry;
                                                    count++;
                                                } else {
                                                    if (idInfoDtls.length > 1 && idInfoDtls[1].identifier == isbn) {
                                                        response.books[id] = bookEntry;
                                                        count++;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    response.count = count;
                                    logService.info("Got " + count + " results.");
                                    deferred.resolve(response);
                                } else {
                                    logService.info("Got no results.");
                                    deferred.reject(response);
                                }
                            } else {
                                logService.error("Search error: " + err);
                                deferred.reject(response);
                            }
                        });
                    });
                } else {
                    if (pSearchQuery.id) {
                        var bookId = '' + pSearchQuery.id;
                        logService.debug("Starting id-search: " + bookId);
                        flynnDB.allDocs({
                            include_docs: true,
                            descending: true
                        }, function(err, res) {
                            $rootScope.$apply(function() {
                                if (!err) {
                                    var rows = res.rows;
                                    if (rows && rows.length > 0) {
                                        response.books = {};
                                        var count = 0;
                                        for (var id in rows) {
                                            var bookEntry = rows[id].doc;
                                            if (bookEntry.value && bookEntry.value.id == bookId) {
                                                response.books[id] = bookEntry;
                                                count++;
                                            }
                                        }
                                        response.count = count;
                                        logService.info("Got " + count + " results.");
                                        deferred.resolve(response);
                                    } else {
                                        logService.info("Got no results.");
                                        deferred.reject(response);
                                    }
                                } else {
                                    logService.error("Search error: " + err);
                                    deferred.reject(response);
                                }
                            });
                        });

                    } else {
                        logService.error("Search error");
                        deferred.reject(response);
                    }
                }

                return deferred.promise;
            },
            remove: function(pBookToRemove) {
                var deferred = $q.defer(),
                    self = this,
                    response = {},
                    credentials = settingsService.load(),
                    flynnDB = getDB();
                logService.debug('Starting delete of book: ' + pBookToRemove.value.volumeInfo.title);
                if (flynnDB) {
                    var searchQuery = {};
                    searchQuery.id = pBookToRemove.value.id;
                    self.search(searchQuery).then(function(searchResponse) {
                        var count = 0,
                            booksToBeRemoved = [];
                        if (searchResponse.books) {
                            count = searchResponse.count;
                        }
                        if (count > 0) {
                            for (var index in searchResponse.books) {
                                var bookToRemove = searchResponse.books[index];
                                bookToRemove._deleted = true;
                                booksToBeRemoved.push(bookToRemove);
                            }
                        } else {
                            logService.error('Error deleting entry. Book not found');
                            deferred.reject(response);
                        }
                        flynnDB.bulkDocs(booksToBeRemoved, function(err, result) {
                            $rootScope.$apply(function() {
                                if (!err) {
                                    logService.info("Delete of entry was successfull.");
                                    deferred.resolve(response);
                                } else {
                                    logService.error("Error deleting entry: " + err);
                                    deferred.reject(err);
                                }
                            });
                        }, function(response) {
                            logService.error('Error deleting entry.');
                            deferred.reject(response);
                        });
                    });
                }
                return deferred.promise;

            },
            saveUpdated: function(pBookToSave, pExistingEntries) {
                var deferred = $q.defer(),
                    flynnDB = getDB();
                logService.debug('Starting update for book: ' + pBookToSave.value.volumeInfo.title);
                if (flynnDB) {
                    var docs = [];
                    for (var index in pExistingEntries) {
                        var book = pExistingEntries[index];
                        book.value = pBookToSave.value;
                        if (book.image) {
                            book._attachments = {};
                            book._attachments[book.image.name] = {};
                            book._attachments[book.image.name].content_type = pBookToSave.image.content_type;
                            book._attachments[book.image.name].data = pBookToSave.image.data;
                        }
                        if (book._attachments) {
                            book._attachments = book._attachments;
                        }
                        docs.push(book);
                    }
                    flynnDB.bulkDocs(docs, function(err, result) {
                        $rootScope.$apply(function() {
                            if (!err) {
                                logService.info('Update successfull.');
                                deferred.resolve(result);
                            } else {
                                logService.error('Error updating book:' + err);
                                deferred.reject(err);
                            }
                        });
                    });
                } else {
                    logService.error('Error during db connection');
                    deferred.reject(response);
                }
                return deferred.promise;
            },
            save: function(pBookToSave) {
                var deferred = $q.defer(),
                    self = this,
                    response = {},
                    credentials = settingsService.load(),
                    saveSuccess = false,
                    errorOccurred = false,
                    flynnDB = getDB();
                // set to 1 if no amount was set
                if (!pBookToSave.count) {
                    pBookToSave.count = 1;
                }
                logService.debug('Starting save for book: ' + pBookToSave.value.volumeInfo.title);
                if (flynnDB) {
                    var bookEntriesToAdd = 0,
                        updateNeeded = true;
                    // update already saved entry, maybe changed amount?   
                    var isbn = pBookToSave.value.volumeInfo.industryIdentifiers[0].identifier;
                    var searchQuery = {};
                    searchQuery.isbn = isbn;
                    self.search(searchQuery).then(function(searchResponse) {
                        logService.info('Found already an db entry');
                        var count = 0
                        if (searchResponse.books) {
                            count = searchResponse.count;
                        }
                        if (count === pBookToSave.count) {
                            logService.info('Amount not changed');
                            self.saveUpdated(pBookToSave, searchResponse.books).then(function(saveResponse) {
                                logService.info('Update was successfull.');
                                deferred.resolve(saveResponse);
                            }, function(response) {
                                logService.error('Error updating entry.');
                                deferred.reject(response);
                            });
                        } else {
                            var booksToAdd = pBookToSave.count - count;
                            if (booksToAdd > 0) {
                                logService.info('Adding ' + booksToAdd + ' new entries.');
                                var docs = [];
                                for (var i = 1; i <= booksToAdd; i++) {
                                    var book = {};
                                    book.value = pBookToSave.value;
                                    if (pBookToSave.image) {
                                        book._attachments = {};
                                        book._attachments[pBookToSave.image.name] = {};
                                        book._attachments[pBookToSave.image.name].content_type = pBookToSave.image.content_type;
                                        book._attachments[pBookToSave.image.name].data = pBookToSave.image.data;
                                    }
                                    docs.push(book);
                                }
                                flynnDB.bulkDocs(docs, function(err, result) {

                                    $rootScope.$apply(function() {
                                        if (!err) {
                                            response.books = docs;
                                            logService.info('Saving successfull.');
                                            deferred.resolve(response);
                                        } else {
                                            logService.error('Error saving new entries: ' + err);
                                            deferred.reject(response);
                                        }
                                    });
                                });
                            } else {
                                var count = 0,
                                    booksToRemove = Math.abs(booksToAdd);
                                logService.info("Removing " + booksToRemove + " existing entries.");
                                var booksToBeRemoved = [],
                                    booksToBeUpdated = [];
                                for (var index in searchResponse.books) {
                                    var book = searchResponse.books[index];
                                    if (count < booksToRemove) {
                                        book._deleted = true;
                                        book._attachments = null;
                                        booksToBeRemoved.push(book);
                                        count++;
                                    } else {
                                        booksToBeUpdated.push(book);
                                    }
                                }
                                flynnDB.bulkDocs(booksToBeRemoved, function(err, result) {
                                    $rootScope.$apply(function() {
                                        if (!err) {
                                            logService.info('Delete was successfull.');
                                            self.saveUpdated(pBookToSave, booksToBeUpdated).then(function(saveResponse) {
                                                logService.info('Update was successfull.');
                                                deferred.resolve(saveResponse);
                                            }, function(response) {
                                                logService.error('Error updating entry.');
                                                deferred.reject(response);
                                            });
                                        } else {
                                            logService.error("Error during: " + err);
                                            deferred.reject(err);
                                        }
                                    });
                                }, function(response) {
                                    logService.error('Error deleting entry.');
                                    deferred.reject(response);
                                });

                            }
                        }
                    }, function(response) {
                        logService.info('Found no existing entries');
                        var docs = [];
                        for (var i = 1; i <= pBookToSave.count; i++) {
                            var book = {};
                            book.value = pBookToSave.value;
                            if (pBookToSave.image) {
                                book._attachments = {};
                                book._attachments[pBookToSave.image.name] = {};
                                book._attachments[pBookToSave.image.name].content_type = pBookToSave.image.content_type;
                                book._attachments[pBookToSave.image.name].data = pBookToSave.image.data;
                            }
                            docs.push(book);
                        }
                        flynnDB.bulkDocs(docs, function(err, result) {

                            $rootScope.$apply(function() {
                                if (!err) {
                                    response.books = docs;
                                    logService.info('Saving successfull.');
                                    deferred.resolve(response);
                                } else {
                                    logService.error('Error saving new entries: ' + err);
                                    deferred.reject(response);
                                }
                            });
                        });
                    });
                } else {
                    logService.error('Error during db connection');
                    deferred.reject(response);
                }
                return deferred.promise;
            }
        };

    }
]);


/**
 * @ngdoc service
 * @name settingsService
 *
 * @module flynnBookScannerApp
 *
 * @description
 * Provides access to the book inventory. Used PouchDB as backend.
 */
app.service('settingsService', ['$rootScope', 'localStorageService', 'logService',

    function($rootScope, localStorage, logService) {
        'use strict';
        return {
            save: function(pConfig) {
                localStorage.remove('flynn_app.settings');
                var config = pConfig;
                config.googleApiKey = 'AIzaSyC8qspKiGBqhXNqkeF6v-D72SrKO-SzCNY';
                config.timeout = 20000;
                localStorage.add('flynn_app.settings', config);
            },
            load: function() {
                logService.debug("Loading settings from local storage");
                var settings = localStorage.get('flynn_app.settings');
                // TODO check settings
                if (settings) {
                    settings.valid = true;
                } else {
                    settings = {};
                    settings.valid = false;
                    settings.activeProfileID = 0;
                    settings.profiles = [];
                    settings.profiles.push({});
                }
                settings.activeProfile = function() {
                    return settings.profiles[settings.activeProfileID];
                }
                $rootScope.settings = settings;
                return settings;
            },
            verify: function() {
                logService.debug("Verifying flynn settings");
                var config = this.load();
                var credentials = config.activeProfile();
                if (credentials.remotesync) {
                    return (credentials && credentials.owner && credentials.user && credentials.password && credentials.couchdb);
                } else {
                    return (credentials && credentials.owner);
                }

            }

        };

    }
]);