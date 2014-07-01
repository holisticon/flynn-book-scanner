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
                var config = $settings.load().activeProfile();
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
                                book = {};
                                book.value = data.items[itemIndex];
                                var bookIDs = book.value.volumeInfo.industryIdentifiers;
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

app.service('InventoryService', ['$rootScope', 'LogService', '$http', '$q', 'SettingsService', 'Base64', 'localStorageService',
    function($rootScope, $log, $http, $q, $settings, $base64, localStorage) {
        var config = $settings.load(),
            activeProfile = config.activeProfile(),
            NAME_OF_POUCHDB = activeProfile.dbName;

        return {
            readLogs: function() {
                var logger = localStorage.get('flynn_app.log');
                return logger;
            },
            logSync: function(pLogCategory, pLogEntry) {
                var now = new Date();
                var logger = localStorage.get('flynn_app.log'),
                    logEntry = {
                        date: new Date(),
                        category: pLogCategory,
                        entry: pLogEntry
                    };
                if (!logger) {
                    var sync = {}; // init
                    localStorage.add('flynn_app.log', {
                        sync: []
                    });
                    logger = localStorage.get('flynn_app.log');
                }
                logger.sync.push(logEntry);
                localStorage.set('flynn_app.log', logger);
            },
            syncRemote: function() {
                // TODO: Add authentical (rly, it's https already).
                var couchDbUrl = activeProfile.couchdb,
                    self = this,
                    localDB = new PouchDB(NAME_OF_POUCHDB, {
                        adapter: 'websql'
                    }),
                    authorization = activeProfile.user + ':' + activeProfile.password,
                    remoteCouch = couchDbUrl.replace("://", "://" + authorization + "@"), // FIXME: just to try it out
                    opts = {
                        live: true
                    }; // TODO: Move to Top, we only need one DB
                $log.debug("Using remote server: " + remoteCouch);
                if (localDB) {
                    self.logSync("Info", "Syncing with couchDB started: " + couchDbUrl);
                    localDB.sync(remoteCouch)
                        .on('change', function(info) {
                            $log.info(info);
                            self.logSync("Info", JSON.stringify(info));

                        })
                        .on('complete', function(info) {
                            $log.info(info);
                            self.logSync("Info", JSON.stringify(info));
                            self.read();
                        })
                        .on('info', function(info) {
                            $log.error(info);
                            self.logSync("Error", JSON.stringify(info));
                        });
                }
            },
            read: function() {
                if (!config.valid) {
                    config = $settings.load();
                    activeProfile = config.activeProfile();
                    NAME_OF_POUCHDB = activeProfile.dbName;
                }
                var deferred = $q.defer(),
                    books = null,
                    response = {},
                    flynnDB = new PouchDB(NAME_OF_POUCHDB, {
                        adapter: 'websql'
                    });
                if (flynnDB) {
                    $log.debug("Using db-adapter: " + flynnDB.adapter);
                    flynnDB.allDocs({
                        include_docs: true,
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
                                            $log.debug("Read following valid book entry: " + bookEntry.value.volumeInfo.title);
                                            books.push(bookEntry);
                                        }
                                    }
                                }
                                response.books = books;
                                if (books) {
                                    $log.debug("Found " + books.length + " books in inventory.");
                                }
                                deferred.resolve(response);
                            } else  {
                                $log.error("Reading from local db not working: " + JSON.stringify(err));
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
                    flynnDB = new PouchDB(NAME_OF_POUCHDB, {
                        adapter: 'websql'
                    });
                $log.debug("Starting search: " + JSON.stringify(pSearchQuery));
                // check if we have fulltext search
                if (pSearchQuery.fullTextSearch) {
                    var query = pSearchQuery.fullTextSearch;
                    $log.debug("Starting fulltext-search: " + query);
                    flynnDB.search({
                        query: query,
                        fields: [
                            'value.volumeInfo.title',
                            'value.volumeInfo.subtitle',
                            'value.volumeInfo.description',
                            'value.volumeInfo.publisher',
                            'value.volumeInfo.authors',
                            'value.volumeInfo.publishedDate'
                        ],
                        mm: '30%',
                        include_docs: true
                    }).then(function(res) {
                        var rows = res.rows;
                        if (rows && rows.length > 0) {
                            $log.debug("Got " + rows.length + " results.");
                            response.count = rows.length;
                            response.books = {};
                            for (var id in rows) {
                                var bookEntry = rows[id].doc;
                                response.books[id] = bookEntry;
                            }
                            deferred.resolve(response);
                        } else {
                            $log.debug("Got no results.");
                            deferred.reject(response);
                        }
                    }).catch(function(err) {
                        $log.error("Search error");
                        deferred.reject(response);
                    });
                } else  {
                    if (pSearchQuery.isbn) {
                        var isbn = '' + pSearchQuery.isbn;
                        $log.debug("Starting isbn-search: " + isbn);
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
                                            if (bookEntry.value && bookEntry.value.volumeInfo.industryIdentifiers[1].identifier == isbn) {
                                                response.books[id] = bookEntry;
                                                count++;
                                            }
                                        }
                                        response.count = count;
                                        $log.debug("Got " + count + " results.");
                                        deferred.resolve(response);
                                    } else {
                                        $log.debug("Got no results.");
                                        deferred.reject(response);
                                    }
                                } else {
                                    $log.error("Search error: " + err);
                                    deferred.reject(response);
                                }
                            });
                        });

                    } else {
                        $log.error("Search error");
                        deferred.reject(response);
                    }
                }
                return deferred.promise;
            },
            remove: function(pBookToRemove) {
                var deferred = $q.defer(),
                    self = this,
                    response = {},
                    credentials = $settings.load(),
                    flynnDB = new PouchDB(NAME_OF_POUCHDB, {
                        adapter: 'websql'
                    });
                $log.debug('Starting delete of book: ' + pBookToRemove.value.volumeInfo.title);
                if (flynnDB) {
                    var isbn = pBookToRemove.value.volumeInfo.industryIdentifiers[1].identifier;
                    var searchQuery = {};
                    searchQuery.isbn = isbn;
                    self.search(searchQuery).then(function(response) {
                        var count = 0
                        if (response.books) {
                            count = response.count;
                        }
                        if (count > 0) {
                            var errorOccurred = false;
                            for (var index in response.books) {
                                var pBookToRemove = response.books[index];
                                flynnDB.remove(pBookToRemove, function(err, result) {
                                    if (!err) {
                                        $log.info("Delete of entry was successfull.");
                                    } else {
                                        $log.error("Error deleting entry: " + err);
                                        errorOccurred = true;
                                    }
                                })
                            }
                            if (errorOccurred) {
                                $log.error("Error during delete. Skipping delete");
                                deferred.reject(response);
                            } else {
                                $log.info("Delete successfull.");
                                deferred.resolve(response);
                            }
                        }
                        deferred.resolve(response);
                        /*
                        flynnDB.remove(pBookToRemove, function(err, result) {
                            if (!err) {
                                $log.info("Delete successfull.");
                                deferred.resolve(response);
                            } else {
                                $log.error("Error deleting entry: " + err);
                                deferred.reject(response);
                            }
                        });*/
                    }, function(response) {
                        $log.info("Delete successfull.");
                    });
                }
                return deferred.promise;

            },
            save: function(pBookToSave) {
                var deferred = $q.defer(),
                    self = this,
                    response = {},
                    credentials = $settings.load(),
                    saveSuccess = false,
                    errorOccurred = false,
                    flynnDB = new PouchDB(NAME_OF_POUCHDB, {
                        adapter: 'websql'
                    });
                $log.debug('Starting save for book: ' + pBookToSave.value.volumeInfo.title);
                if (flynnDB) {
                    var bookEntriesToAdd = 0,
                        updateNeeded = true;
                    // update already saved entry, maybe changed amount?   
                    var isbn = pBookToSave.value.volumeInfo.industryIdentifiers[1].identifier;
                    var searchQuery = {};
                    searchQuery.isbn = isbn;
                    self.search(searchQuery).then(function(response) {
                        $log.info("Found already an db entry");
                        var count = 0
                        if (response.books) {
                            count = response.count;
                        }
                        if (count == pBookToSave.count) {
                            $log.info("No need to update. Amount not changed");
                            response.noUpdate = true;
                            deferred.resolve(response);
                        } else {
                            var booksToAdd = pBookToSave.count - count;
                            if (booksToAdd > 0) {
                                $log.info("Adding " + booksToAdd + " new entries.");
                                var docs = [];
                                for (var i = 1; i <= booksToAdd; i++) {
                                    var book = {};
                                    book.value = pBookToSave.value;
                                    docs.push(book);
                                }
                                flynnDB.bulkDocs(docs, function(err, result) {
                                    if (!err) {
                                        $log.info("Saving successfull.");
                                        deferred.resolve(response);
                                    } else {
                                        $log.error("Error saving new entries: " + err);
                                        deferred.reject(response);
                                    }
                                });
                            } else {
                                // TODO REMOVE 
                                deferred.reject(response);
                            }
                        }
                    }, function(response) {
                        $log.info("Found no existing entries");
                        var docs = [];
                        for (var i = 1; i <= pBookToSave.count; i++) {
                            docs.push(pBookToSave);
                        }
                        flynnDB.bulkDocs(docs, function(err, result) {
                            if (!err) {
                                $log.info("Saving successfull.");
                                deferred.resolve(response);
                            } else {
                                $log.error("Error saving new entries: " + err);
                                deferred.reject(response);
                            }
                        });
                    });
                }
                return deferred.promise;
            }
        };

    }
]);



app.service('SettingsService', ['$rootScope', 'localStorageService',
    function($rootScope, localStorage) {
        return {
            save: function(pConfig) {
                localStorage.remove('flynn_app.settings');
                var config = pConfig;
                config.googleApiKey = 'AIzaSyC8qspKiGBqhXNqkeF6v-D72SrKO-SzCNY';
                config.timeout = 20000;
                localStorage.add('flynn_app.settings', config);
            },
            load: function() {
                console.log("Loading settings from local storage");
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
                console.log("Verifying flynn settings");
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


angular.module('fsCordova', []).service('CordovaService', ['$document', '$q',
    function($document, $q) {

        var d = $q.defer(),
            resolved = false;

        var self = this;
        this.ready = d.promise;

        document.addEventListener('deviceready', function() {
            resolved = true;
            d.resolve(window.cordova);
        });

        // Check to make sure we didn't miss the 
        // event (just in case)
        setTimeout(function() {
            if (!resolved) {
                if (window.cordova) {
                    d.resolve(window.cordova);
                } else {
                    // for local dev mock it
                    var cord = {};
                    cord.ready = {};
                    d.resolve(cord);
                }

            }
        }, 3000);
    }
]);