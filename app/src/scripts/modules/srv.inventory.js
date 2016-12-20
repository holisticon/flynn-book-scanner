/**
 * @ngdoc service
 * @name inventoryService
 *
 * @module flynnBookScannerApp
 *
 * @description
 * Provides access to the book inventory. Used PouchDB as backend.
 */
app.service('inventoryService', function ($rootScope, $http, $q, settingsService, base64, $log) {
    'use strict';

    var config = settingsService.load(),
      activeProfile = config.activeProfile();

    function getDB() {
      var NAME_OF_POUCHDB;
      config = settingsService.load();
      NAME_OF_POUCHDB = activeProfile.dbName;
      var db;
      if (!db) {
        if (typeof cordova != 'undefined') {

          if (cordova.platformId === 'android') {
            // for performance use indexedDB on Android
            db = new PouchDB(NAME_OF_POUCHDB, {adapter: 'idb', size: 500});
          } else {
            // default use websql
            db = new PouchDB(NAME_OF_POUCHDB, {adapter: 'websql', location: 'default', size: 500});
          }
        } else {
          // default use websql
          db = new PouchDB(NAME_OF_POUCHDB, {adapter: 'websql'});
        }
      }
      return db;
    }

    function updateIndex(pDB, cb) {
      if (pDB) {
        // update index
        pDB.createIndex({
          index: {
            fields: ['value.id']
          }
        }).then(function (result) {
          $log.trace('Creating index was successfull: ', result);
          if (cb) {
            cb();
          }
        }).catch(function (err) {
          $log.err('Creating index was not successfull: ', err);
          if (cb) {
            cb();
          }
        });
      } else {
        if (cb) {
          cb();
        }
      }
    }

    return {
      updateIndex: function () {
        updateIndex(getDB());
      },
      syncRemote: function (reportNetworkError) {
        var deferred = $q.defer();
        // reload config
        config = settingsService.load();
        activeProfile = config.activeProfile();
        // Add authentication data
        var couchDbUrl = activeProfile.couchdb,
          localDB = getDB();
        if (localDB) {
          if (activeProfile.user && activeProfile.password) {
            var basicAuth = encodeURIComponent(activeProfile.user) + ':' + encodeURIComponent(activeProfile.password),
              remoteCouch = couchDbUrl.replace('://', '://' + basicAuth + '@');
            $log.info('Syncing with couchDB started: ' + couchDbUrl);
            // check for network availability first and login
            $http({
              method: 'GET',
              url: remoteCouch,
              timeout: config.appConfig.timeout
            }).then(function () {
              localDB.sync(remoteCouch, config.appConfig.sync || {
                  live: true
                }).on('change', function (info) {
                $rootScope.$apply(function () {
                  $log.info('Updating documents with remote changes...');
                  $log.debug('Updating documents with remote changes with following answer: ', info);
                  updateIndex(localDB);
                });
              }).on('complete', function (info) {
                $rootScope.$apply(function () {
                  $log.info('Completed sync.');
                  $log.debug('Completed sync with following answer: ', info);
                  deferred.resolve(info);
                });
              }).on('uptodate', function (info) {
                $rootScope.$apply(function () {
                  $log.info('Already up-to-date.');
                  $log.debug('Already up-to-date with following answer: ', info);
                  deferred.resolve(info);
                });
              }).on('error', function (err) {
                $rootScope.$apply(function () {
                  $log.error('Error during remote sync with following answer: ', err);
                  if (err.stats === 400) {
                    $log.info('Seems be a remote server error.');
                  }
                  deferred.reject(err);
                });
              }).catch(function (err) {
                $rootScope.$apply(function () {
                  $log.error('Unknown error during remote sync.', err);
                  deferred.resolve(err);
                });
              });
            }, function (err) {
              if (err.status === 0) {
                $log.info('Seems to run in offline mode.');
                if (reportNetworkError) {
                  deferred.reject(err);
                } else {
                  deferred.resolve(err);
                }
              } else {
                if (err.status === 401) {
                  $log.info('Seems to use invalid login data.');
                  deferred.reject(err);
                }
                $log.error('Unkown error during connection check: ' + JSON.stringify(err));
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
      getBook: function (pBookID) {
        var deferred = $q.defer(),
          bookDB = getDB();
        $log.debug('Starting search for book: ' + pBookID);
        if (bookDB) {
          bookDB.find({
            selector: {
              'value.id': {
                $eq: pBookID
              }
            }
          }).then(function (result) {
            $log.debug('Search successfull.');
            $rootScope.$apply(function () {
              if (result.docs.length > 0) {
                deferred.resolve({
                  book: result.docs[0]
                });
              } else {
                deferred.resolve();
              }
            });
          }).catch(function (err) {
            $log.error('Error searching for book ' + pBookID + ' :' + err);
            deferred.reject(err);
          });
        } else {
          $log.error('Error during db connection');
          deferred.reject({});
        }
        return deferred.promise;
      },
      read: function () {
        var deferred = $q.defer(),
          response = {},
          bookDB = getDB();
        if (bookDB) {
          $log.debug('Using db-adapter: ' + bookDB.adapter);
          bookDB.allDocs({
            include_docs: true,
            attachments: true
          }, function (err, doc) {
            $rootScope.$apply(function () {
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

                        var ebook = bookEntry._attachments['ebook_' + bookEntry.value.id];
                        if (ebook) {
                          bookEntry.ebook = {};
                          bookEntry.ebook.filename = 'ebook_' + bookEntry.value.id;
                          bookEntry.ebook.content_type = ebook.content_type;
                          bookEntry.ebook.data = ebook.data;
                        }
                      }
                      bookEntry._attachments = null;
                      $log.debug('Read following valid book entry: ' + bookEntry.value.volumeInfo.title);
                      books.push(bookEntry);
                    }
                  }
                }
                if (books) {
                  response.books = books;
                  $log.debug('Found ' + books.length + ' books in inventory.');
                }
                deferred.resolve(response);
              } else {
                $log.error('Reading from local db not working: ' + JSON.stringify(err));
                deferred.reject(response);
              }
            });
          });
        } else {
          deferred.reject(response);
        }
        return deferred.promise;

      },
      searchISBN: function (pBooks, pISBN) {
        if (pBooks && pBooks.length > 0) {
          var response = {};
          response.books = {};
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
          $log.info('Got ' + response.count + ' results.');
          return response;
        } else {
          $log.info('Got no results.');
          return false;
        }
      },
      searchID: function (pBooks, pID) {
        if (pBooks && pBooks.length > 0) {
          var response = {};
          response.books = {};
          response.count = 0;
          for (var id in pBooks) {
            var bookEntry = pBooks[id].doc;
            if (bookEntry.value && bookEntry.value.id == pID) {
              response.books[id] = bookEntry;
              response.count++;
            }
          }
          $log.info('Got ' + response.count + ' results.');
          return response;
        } else {
          $log.info('Got no results.');
          return false;
        }
      },
      search: function (pSearchQuery) {
        var deferred = $q.defer(),
          response = {},
          self = this,
          bookDB = getDB();
        $log.debug('Starting search: ' + JSON.stringify(pSearchQuery));
        if (pSearchQuery.isbn) {
          var isbn = '' + pSearchQuery.isbn;
          $log.debug('Starting isbn-search: ' + isbn);
          bookDB.allDocs({
            include_docs: true,
            descending: true
          }, function (err, res) {
            $rootScope.$apply(function () {
              if (!err) {
                var result = self.searchISBN(res.rows, isbn);
                if (!result) {
                  deferred.reject(response);
                } else {
                  deferred.resolve(result);
                }
              } else {
                $log.error('Search error: ' + err);
                deferred.reject(response);
              }
            });
          });
        } else {
          if (pSearchQuery.id) {
            var bookId = '' + pSearchQuery.id;
            $log.debug('Starting id-search: ' + bookId);
            bookDB.allDocs({
              include_docs: true,
              descending: true
            }, function (err, res) {
              $rootScope.$apply(function () {
                if (!err) {
                  var result = self.searchID(res.rows, bookId);
                  if (!result) {
                    deferred.reject(response);
                  } else {
                    deferred.resolve(result);
                  }
                } else {
                  $log.error('Search error: ' + err);
                  deferred.reject(response);
                }
              });
            });

          } else {
            $log.error('Got unknown search query');
            deferred.reject(response);
          }
        }

        return deferred.promise;
      },
      remove: function (pBookToRemove) {
        var deferred = $q.defer(),
          self = this,
          response = {},
          bookDB = getDB();
        $log.debug('Starting delete of book: ' + pBookToRemove.value.volumeInfo.title);
        if (bookDB) {
          var searchQuery = {};
          searchQuery.id = pBookToRemove.value.id;
          self.search(searchQuery).then(function (searchResponse) {
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
                deferred.resolve({});
              }
            } else {
              $log.error('Error deleting entry. Book not found');
              deferred.reject(response);
            }
            bookDB.bulkDocs(booksToBeRemoved, function (err) {
              $rootScope.$apply(function () {
                if (!err) {
                  $log.info('Delete of entry was successfull.');
                  updateIndex(bookDB);
                } else {
                  $log.error('Error deleting entry: ' + err);
                  deferred.reject(err);
                }
              });
            }, function (response) {
              $log.error('Error deleting entry.');
              deferred.reject(response);
            });
          });
        }
        return deferred.promise;

      },
      saveUpdated: function (pBookToSave, pExistingEntries) {
        var deferred = $q.defer(),
          bookDB = getDB();
        $log.debug('Starting update for book: ' + pBookToSave.value.volumeInfo.title);
        if (bookDB) {
          var docs = [];
          for (var index in pExistingEntries) {
            var book = pExistingEntries[index];
            book.value = pBookToSave.value;
            if (pBookToSave.image) {
              book._attachments = book._attachments || {};
              book._attachments[pBookToSave.image.name] = {};
              book._attachments[pBookToSave.image.name].content_type = pBookToSave.image.content_type;
              book._attachments[pBookToSave.image.name].data = pBookToSave.image.data;
            }
            if (pBookToSave.ebook) {
              book._attachments = book._attachments || {};
              book._attachments[pBookToSave.ebook.name] = {};
              book._attachments[pBookToSave.ebook.name].content_type = pBookToSave.ebook.content_type;
              book._attachments[pBookToSave.ebook.name].data = pBookToSave.ebook.data;
            }
            if (book._attachments) {
              book._attachments = book._attachments;
            }
            docs.push(book);
          }
          bookDB.bulkDocs(docs, function (err, result) {
            $rootScope.$apply(function () {
              if (!err) {
                $log.info('Update successfull.');
                deferred.resolve(result);
              } else {
                $log.error('Error updating book:' + err);
                deferred.reject(err);
              }
            });
          });
        } else {
          $log.error('Error during db connection');
          deferred.reject({});
        }
        return deferred.promise;
      },
      save: function (pBookToSave) {
        var deferred = $q.defer(),
          self = this,
          response = {},
          bookDB = getDB();
        // set to 1 if no amount was set
        if (!pBookToSave.count) {
          pBookToSave.count = 1;
        }
        $log.debug('Starting save for book: ' + pBookToSave.value.volumeInfo.title);
        if (bookDB) {
          // update already saved entry, maybe changed amount?
          var searchQuery = {};
          if (pBookToSave.value.volumeInfo.industryIdentifiers && pBookToSave.value.volumeInfo.industryIdentifiers.length > 1) {
            searchQuery.isbn = pBookToSave.value.volumeInfo.industryIdentifiers[1].identifier;
          } else {
            searchQuery.id = pBookToSave.value.id;
          }
          self.search(searchQuery).then(function (searchResponse) {
            $log.info('Found already an db entry');
            var count = 0;
            if (searchResponse.books) {
              count = searchResponse.count;
            }
            if (count === pBookToSave.count) {
              $log.info('Amount not changed');
              self.saveUpdated(pBookToSave, searchResponse.books).then(function () {
                $log.info('Update was successfull.');
                deferred.resolve(response);
                updateIndex(bookDB);
              }, function (response) {
                $log.error('Error updating entry.');
                deferred.reject(response);
              });
            } else {
              var booksToAdd = pBookToSave.count - count;
              if (booksToAdd > 0) {
                $log.info('Adding ' + booksToAdd + ' new entries.');
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
                  if (pBookToSave.ebook) {
                    book._attachments = {};
                    book._attachments[pBookToSave.ebook.name] = {};
                    book._attachments[pBookToSave.ebook.name].content_type = pBookToSave.ebook.content_type;
                    book._attachments[pBookToSave.ebook.name].data = pBookToSave.ebook.data;
                  }
                  docs.push(book);
                }
                bookDB.bulkDocs(docs, function (err) {

                  $rootScope.$apply(function () {
                    if (!err) {
                      response.books = docs;
                      $log.info('Saving successfull.');
                      updateIndex(bookDB);
                      deferred.resolve(response);
                    } else {
                      $log.error('Error saving new entries: ' + err);
                      deferred.reject(response);
                    }
                  });
                });
              } else {
                var countExisting = 0,
                  booksToRemove = Math.abs(booksToAdd);
                $log.info('Removing ' + booksToRemove + ' existing entries.');
                var booksToBeRemoved = [],
                  booksToBeUpdated = [];
                for (var index in searchResponse.books) {
                  var currentBook = searchResponse.books[index];
                  if (countExisting < booksToRemove) {
                    currentBook._deleted = true;
                    currentBook._attachments = null;
                    booksToBeRemoved.push(currentBook);
                    countExisting++;
                  } else {
                    booksToBeUpdated.push(currentBook);
                  }
                }
                bookDB.bulkDocs(booksToBeRemoved, function (err) {
                  $rootScope.$apply(function () {
                    if (!err) {
                      $log.info('Delete was successfull.');
                      self.saveUpdated(pBookToSave, booksToBeUpdated).then(function (saveResponse) {
                        $log.info('Update was successfull.');
                        deferred.resolve(saveResponse);
                        updateIndex(bookDB);
                      }, function (response) {
                        $log.error('Error updating entry.');
                        deferred.reject(response);
                      });
                    } else {
                      $log.error('Error during: ' + err);
                      deferred.reject(err);
                    }
                  });
                }, function (response) {
                  $log.error('Error deleting entry.');
                  deferred.reject(response);
                });

              }
            }
          }, function (response) {
            $log.info('Found no existing entries');
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
              if (pBookToSave.ebook) {
                book._attachments = {};
                book._attachments[pBookToSave.ebook.name] = {};
                book._attachments[pBookToSave.ebook.name].content_type = pBookToSave.ebook.content_type;
                book._attachments[pBookToSave.ebook.name].data = pBookToSave.ebook.data;
              }
              docs.push(book);
            }
            bookDB.bulkDocs(docs, function (err) {
              $rootScope.$apply(function () {
                if (!err) {
                  response.books = docs;
                  $log.info('Saving successfull.');
                  deferred.resolve(response);
                  updateIndex(bookDB);
                } else {
                  $log.error('Error saving new entries: ' + err);
                  deferred.reject(response);
                }
              });
            });
          });
        } else {
          $log.error('Error during db connection');
          deferred.reject(response);
        }
        return deferred.promise;
      }
    };
  }
);
