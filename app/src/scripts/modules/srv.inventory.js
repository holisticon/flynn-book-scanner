/**
 * @ngdoc service
 * @name inventoryService
 *
 * @module flynnBookScannerApp
 *
 * @description
 * Provides access to the book inventory. Used PouchDB as backend.
 */
app.service('inventoryService', ['$rootScope', '$http', '$q', 'settingsService', 'base64', '$log', 
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
                    db = new PouchDB(NAME_OF_POUCHDB, { adapter: 'idb', size: 50 });
                } else {
                    // default use websql
                    db = new PouchDB(NAME_OF_POUCHDB, { adapter: 'websql', size: 50 });
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
                            timeout: config.timeout,
                        }).then(function(response) {
                            var syncPromise = localDB.sync(remoteCouch)
                                .on('change', function(info) {
                                    $rootScope.$apply(function() {
                                        logService.info('Updating documents with remote changes...');
                                        logService.debug('Updating documents with remote changes with following answer: ' + info.toString());
                                    });
                                }).on('complete', function(info) {
                                    $rootScope.$apply(function() {
                                        logService.info('Completed sync.');
                                        logService.debug('Completed sync with following answer: ' + info.toString());
                                        deferred.resolve(info);
                                    });
                                }).on('uptodate', function(info) {
                                    $rootScope.$apply(function() {
                                        logService.info('Already up-to-date.');
                                        logService.debug('Already up-to-date with following answer: ' + info.toString());
                                        deferred.resolve(info);
                                    });
                                }).on('error', function(info) {
                                    $rootScope.$apply(function() {
                                        logService.error('Error during remote sync with following answer: ' + info.toString());
                                        deferred.reject(info);
                                    });
                                }).catch(function(err) {
                                    $rootScope.$apply(function() {
                                        logService.error('Unkown error during remote sync.'+ err.toString());
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
                    response = {},
                    self = this,
                    flynnDB = getDB();
                if (flynnDB) {
                    logService.debug('Using db-adapter: ' + flynnDB.adapter);
                    flynnDB.allDocs({
                        include_docs: true,
                        attachments: true
                    }, function(err, doc) {
                        $rootScope.$apply(function() {
                            if (!err) {
                                var books,
                                    rows = doc.rows;
                                if (rows && rows.length > 0) {
                                    books = [];
                                    for (var id in rows) {
                                        var bookEntry = rows[id].doc;
                                        // only add complete entries to results
                                        if (bookEntry.value && bookEntry.value.volumeInfo) {
                                            if (bookEntry._attachments) {
                                                var attachment = bookEntry._attachments['thumbnail_' + bookEntry.value.id];
                                                if (attachment) {
                                                    bookEntry.image = {};
                                                    bookEntry.image.content_type = attachment.content_type;
                                                    bookEntry.image.data = attachment.data;
                                                    bookEntry.image.id = 'thumbnail_' + bookEntry.value.id;
                                                }
                                            }
                                            bookEntry._attachments = null;
                                            logService.debug('Read following valid book entry: ' + bookEntry.value.volumeInfo.title);
                                            books.push(bookEntry);
                                        }
                                    }
                                }
                                if (books) {
                                    response.books = books;
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
            searchISBN: function(pBooks, pISBN) {
                if (pBooks && pBooks.length > 0) {
                    var response = {};
                    response.books = {}
                    response.count = 0;
                    for (var id in pBooks) {
                        var bookEntry = pBooks[id].doc;
                        if (bookEntry.value && bookEntry.value.volumeInfo) {
                            var idInfoDtls = bookEntry.value.volumeInfo.industryIdentifiers;
                            if (idInfoDtls) {
                                if (idInfoDtls[0].identifier == pISBN) {
                                    response.books[id] = bookEntry;
                                    response.count++;
                                } else {
                                    if (idInfoDtls.length > 1 && idInfoDtls[1].identifier == pISBN) {
                                        response.books[id] = bookEntry;
                                        response.count++;
                                    }
                                }
                            }
                        }
                    }
                    logService.info('Got ' + response.count + ' results.');
                    return response;
                } else {
                    logService.info('Got no results.');
                    return false;
                }
            },
            searchID: function(pBooks, pID) {
                if (pBooks && pBooks.length > 0) {
                    var response = {};
                    response.books = {}
                    response.count = 0;
                    for (var id in pBooks) {
                        var bookEntry = pBooks[id].doc;
                        if (bookEntry.value && bookEntry.value.id == pID) {
                            response.books[id] = bookEntry;
                            response.count++;
                        }
                    }
                    logService.info('Got ' + response.count + ' results.');
                    return response;
                } else {
                    logService.info('Got no results.');
                    return false;
                }
            },
            search: function(pSearchQuery) {
                var deferred = $q.defer(),
                    response = {},
                    self = this,
                    flynnDB = getDB();
                logService.debug('Starting search: ' + JSON.stringify(pSearchQuery));
                if (pSearchQuery.isbn) {
                    var isbn = '' + pSearchQuery.isbn;
                    logService.debug('Starting isbn-search: ' + isbn);
                    flynnDB.allDocs({
                        include_docs: true,
                        descending: true
                    }, function(err, res) {
                        $rootScope.$apply(function() {
                            if (!err) {
                                var result = self.searchISBN(res.rows, isbn)
                                if (!result) {
                                    deferred.reject(response);
                                } else {
                                    deferred.resolve(result);
                                }
                            } else {
                                logService.error('Search error: ' + err);
                                deferred.reject(response);
                            }
                        });
                    });
                } else {
                    if (pSearchQuery.id) {
                        var bookId = '' + pSearchQuery.id;
                        logService.debug('Starting id-search: ' + bookId);
                        flynnDB.allDocs({
                            include_docs: true,
                            descending: true
                        }, function(err, res) {
                            $rootScope.$apply(function() {
                                if (!err) {
                                    var result = self.searchID(res.rows, bookId)
                                    if (!result) {
                                        deferred.reject(response);
                                    } else {
                                        deferred.resolve(result);
                                    }
                                } else {
                                    logService.error("Search error: " + err);
                                    deferred.reject(response);
                                }
                            });
                        });

                    } else {
                        logService.error('Got unknown search query');
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
                    var searchQuery = {};
                    if (pBookToSave.value.volumeInfo.industryIdentifiers && pBookToSave.value.volumeInfo.industryIdentifiers.length > 1) {
                        searchQuery.isbn = pBookToSave.value.volumeInfo.industryIdentifiers[1].identifier;
                    } else {
                        searchQuery.id = pBookToSave.value.id;
                    }
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