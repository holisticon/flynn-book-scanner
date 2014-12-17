function enrichSingleDbEntry(pDbEntry) {
    var authorInfo;
    if (pDbEntry.value.volumeInfo.authors) {
        authorInfo = '';
        var authorCount = pDbEntry.value.volumeInfo.authors.length;
        for (var itemIndex in pDbEntry.value.volumeInfo.authors) {
            authorInfo += pDbEntry.value.volumeInfo.authors[itemIndex];
            if (itemIndex < authorCount - 1) {
                authorInfo += ', ';
            }
        }
    }
    pDbEntry.authorInfo = authorInfo;

}

/**
 * Reduces multiple db entries to set without duplicates. This method also counts the records
 * to get the amount of book entries
 */
function enrichDbData(pDbEntries) {
    var result = false,
        bookEntries = {},
        resultsFound = false;
    if (pDbEntries) {
        for (var itemIndex in pDbEntries) {
            var itemInfo = pDbEntries[itemIndex];
            var isbn = itemInfo.value.volumeInfo.industryIdentifiers[0].identifier;
            if (bookEntries[isbn]) {

                bookEntries[isbn].count += 1;
                bookEntries[isbn].docs.push(itemInfo);
            } else {
                bookEntries[isbn] = {};
                bookEntries[isbn].value = itemInfo.value;
                bookEntries[isbn].image = itemInfo.image;
                bookEntries[isbn].count = 1;
                bookEntries[isbn].docs = [];
                bookEntries[isbn].docs.push(itemInfo);
                enrichSingleDbEntry(bookEntries[isbn]);
                //expose id
                bookEntries[isbn]._id = itemInfo._id;
                resultsFound = true;
            }
        }
        if (resultsFound) {
            // transfer to array
            result = [];
            for (var isbn in bookEntries) {
                result.push(bookEntries[isbn]);
            }
        }
    }
    return result;
};


/**
 * @ngdoc controller
 * @name AppController
 *
 * @description
 * Controller for the app
 *
 * @module flynnBookScannerApp
 */
app.controller('AppController', ['$scope', '$rootScope', '$state', '$ionicLoading', 'settingsService', 'logService', 'inventoryService',
    function($scope, $rootScope, $state, $ionicLoading, settings, logService, inventoryService) {
        $ionicLoading.show();
        $rootScope.$on('settings.invalid', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Settings invalid", 1001, "Settings seems to be incorrect. Please correct or check network settings.");
        });
        $rootScope.$on('server.timeout', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Timeout", 2001, "No answer from server");
        });
        $rootScope.$on('server.error', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Books couldn't be loaded", 2002, "The server didn't respond. Please check your network settings.");
        });
        $rootScope.$on('login.failed', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Login error", 3001, "Please check your sync user data.");
        });
        $rootScope.$on('barcode.error', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Barcode error", 4001, "Barcode reader not working. Did you enable camera access?");
        });
        $rootScope.$on('booksearch.invalid', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Book couldn't be loaded", 5001, "The book search wasn't successfull. Server didn't respond.");
        });
        $rootScope.$on('booksave.error', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Book couldn't be saved", 5101, "The book save wasn't successfull. Server didn't respond.");
        });

        $scope.userAgent = navigator.userAgent;

        //  show settings 
        var config = settings.load();
        if (config && !config.valid) {
            //timeout of 30 seconds
            config.timeout = 30000;
            $state.go('app.settings');
        } else {
            //sync on start 
            if (config.activeProfile().remotesync) {
                inventoryService.syncRemote().then(function(response) {
                    $ionicLoading.hide();
                    $state.go('app.books');
                }, function(error) {
                    $rootScope.$broadcast("settings.invalid");
                    $state.go('app.settings');
                    $ionicLoading.hide();
                });
            }
        }
        $rootScope.settings = config;
    }
]);

/**
 * @ngdoc controller
 * @name BooksController
 * @module flynnBookScannerApp
 *
 * @description
 * Interacts with inventory backend to show up book details
 */
app.controller('BooksController', ['$rootScope', '$scope', '$state', '$ionicLoading', '$http', '$ionicActionSheet', 'logService', 'inventoryService',
    function($rootScope, $scope, $state, $ionicLoading, $http, $ionicActionSheet, logService, inventoryService) {

        var allBooks;

        /**
         * load data via inventory service
         *
         */
        function load() {
            $ionicLoading.show();
            $scope.searchQuery = {};
            inventoryService.read().then(onSuccess, onError);

            function onSuccess(response) {
                allBooks = enrichDbData(response.books);
                $scope.books = enrichDbData(response.books);
                $ionicLoading.hide();
            }

            function onError(response) {
                $rootScope.$broadcast("server.error");
                $ionicLoading.hide();
            }
        }

        function resetSearch() {
            $scope.searchQuery = {};
            load();
        }

        function removeBook(pBookToRemove) {
            inventoryService.remove(pBookToRemove).then(onSuccess, onError);

            function onSuccess(response) {
                $ionicLoading.show();
                load();
            }

            function onError(response) {
                $ionicLoading.hide();
                $rootScope.$broadcast("server.error");
            }
        }

        function showBookDetails(pBook) {
            var book = pBook;
            logService.debug('Showing details for book: ' + book.value.volumeInfo.title);
            $state.go('app.book_show', {
                'bookId': book._id
            });
        }

        function showActionMenu(book) {
            $scope.book = book;
            // Show the action sheet
            var hideSheet = $ionicActionSheet.show({
                // TODO_edit book
                /*buttons: [{
                    text: '<b>Edit</b>'
                }],*/
                destructiveText: 'Delete',
                titleText: 'Modify book entry',
                cancelText: 'Cancel',
                cancel: function() {
                    // hideSheet();
                },
                buttonClicked: function(index) {
                    //return true;
                },
                destructiveButtonClicked: function() {
                    var bookToRemove = $scope.book;
                    removeBook(bookToRemove);
                    return true;
                }
            });
        }

        load();

        // public methods
        $scope.load = load;
        $scope.showBookDetails = showBookDetails;
        $scope.showActionMenu = showActionMenu;
        $scope.resetSearch = resetSearch;

    }
]);

/**
 * @ngdoc controller
 * @name BookDetailsController
 * @module flynnBookScannerApp
 *
 * @description
 * Controller to show book details from inventory
 */
app.controller('BookDetailsController', ['$rootScope', '$scope', '$stateParams', '$ionicLoading', '$location', 'logService', 'settingsService', 'inventoryService', 'googleBookService',
    function($rootScope, $scope, $stateParams, $ionicLoading, $location, log, settingsService, inventoryService, googleBookService) {
        var booksInventory, credentials = settingsService.load();
        var bookID = $stateParams.bookId;

        function load() {
            if (bookID) {
                inventoryService.read().then(onSuccess, onError);
            }

            function onSuccess(response) {
                var allBooks = response.books;
                var selectedBook;
                for (var index in allBooks) {
                    var book = allBooks[index];
                    if (book._id == bookID) {
                        selectedBook = book;
                        break;
                    }
                }
                $scope.selectedBook = enrichSingleDbEntry(selectedBook)
                $scope.selectedBook = selectedBook;
                $scope.searching = false;
            }

            function onError(response) {
                $scope.selectedBook = null;
                $scope.searching = false;
            }
        }

        load(bookID);

    }
]);

/**
 * @ngdoc controller
 * @name BookController
 * @module flynnBookScannerApp
 *
 * @description
 * Controller to add new book entries to inventory
 */
app.controller('BookController', ['$rootScope', '$scope', '$ionicLoading', '$http', '$q', '$state', '$resource', '$ionicModal', 'logService', 'settingsService', 'inventoryService', 'googleBookService',
    function($rootScope, $scope, $ionicLoading, $http, $q, $state, $resource, $ionicModal, logService, settingsService, inventoryService, googleBookService) {
        var booksInventory,
            credentials = settingsService.load().activeProfile();

        function init() {
            $ionicModal.fromTemplateUrl('book_modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.modal = modal;
            });
            $scope.openModal = function() {
                $scope.modal.show();
            };
            $scope.closeModal = function() {
                $scope.modal.hide();
            };
            //Cleanup the modal when we're done with it!
            $scope.$on('$destroy', function() {
                $scope.modal.remove();
            });
        }

        /**
         * Scan book via ISBN barcode
         */
        function scan() {
            $ionicLoading.show();
            cordova.plugins.barcodeScanner.scan(
                function(result) {
                    if (!result.cancelled) {
                        logService.debug('We got a barcode\n' +
                            'Result: ' + result.text + '\n' + 'Format: ' + result.format + '\n');
                        $scope.searchQuery.isbn = result.text;
                        search();
                        $ionicLoading.hide();
                    }
                },
                function(error) {
                    logService.error("Scanning failed.");
                    $rootScope.$broadcast("barcode.error");
                    $ionicLoading.hide();
                }
            );
        }

        // TODO_#21_take book image
        function takePicture() {
            navigator.camera.getPicture(function(imageURI) {

                // imageURI is the URL of the image that we can use for
                // an <img> element or backgroundImage.

            }, function(err) {

                // Ruh-roh, something bad happened

            }, cameraOptions);
        }

        /**
         * Search a book to add via Google Book Search.
         * Currently only isbn search is implemented.
         *
         */
        function search() {
            $scope.books = null;
            var searchQuery = $scope.searchQuery;

            if (searchQuery) {
                // reset search
                booksInventory = {};
                inventoryService.read().then(onSuccess, onError);
            }

            function onSuccess(response) {
                booksInventory = response.books;
                logService.debug("Start searching with criteria: " + JSON.stringify(searchQuery));
                retrieve(searchQuery);
            }

            function onError(response) {
                logService.error('Error during reading inventory for search with critera ' + JSON.stringify(searchQuery) + ':' + JSON.stringify(response));
            }
        }

        /**
         * Perform Google Book Search
         *
         */
        function retrieve(pSearchQuery) {
            $ionicLoading.show();
            googleBookService.search(pSearchQuery).then(onSuccess, onError);

            function onSuccess(response) {
                logService.info("Got valid service response");
                $scope.books = response.books;
                $ionicLoading.hide();
            }

            function onError(response) {
                $rootScope.$broadcast("booksearch.invalid");
                $ionicLoading.hide();
            }
        }

        function reset() {
            $ionicLoading.show();
            $scope.books = null;
            $scope.infoMsg = null;
            $scope.searchQuery = null;
            $scope.selectedBook = null;
            $scope.searchQuery = {};
            $ionicLoading.hide();
            $scope.closeModal();
        }

        /**
         * Triggered from the UI if user selects a book which he wants to add.
         *
         */
        function selectBook(pSelectedBookValue) {
            $ionicLoading.show();
            var newEntry = true,
                book = pSelectedBookValue,
                books = booksInventory,
                authorInfo = "";
            logService.debug('Showing details for book: ' + JSON.stringify(book.value));
            for (var itemIndex in book.value.volumeInfo.authors) {
                var authorsInfo = book.value.volumeInfo.authors;
                if (authorsInfo) {
                    var authorCount = authorsInfo.length;
                    authorInfo += authorsInfo[itemIndex];
                    if (itemIndex < authorCount - 1) {
                        authorInfo += ", ";
                    }
                }
            }
            var count = 0;
            if (books) {
                var isbn0;
                if (pSelectedBookValue.value.volumeInfo.industryIdentifiers) {
                    var indIDs = pSelectedBookValue.value.volumeInfo.industryIdentifiers;
                    if (indIDs[0]) {
                        isbn0 = indIDs[0].identifier;
                    }
                }
                for (var id in books) {
                    var bookEntry = books[id],
                        currentISBN = bookEntry.value.volumeInfo.industryIdentifiers[0].identifier;
                    // only add complete entries to results
                    if (isbn0 && currentISBN == isbn0) {
                        logService.debug("Already found a saved book entry: " + JSON.stringify(bookEntry));
                        book = bookEntry;
                        count++;
                    }
                }
            }
            if (count > 0) {
                logService.debug("Found already entry in couchdb");
                $scope.infoMsg = "Book is already added to library. Please update amount.";
            } else {
                logService.debug("Found no existing entry in couchdb");
                $scope.infoMsg = null;
                // set default count to 1
                count = 1;
                book.value.bookshelf = credentials.lastBookshelf;
            }
            book.count = count;
            book.authorInfo = authorInfo;
            book.value.owner = book.value.owner || credentials.owner;
            $scope.selectedBook = book;
            $ionicLoading.hide();
            $scope.openModal();
        }

        function save(book) {
            $ionicLoading.show();
            logService.debug("Starting save for book: ");
            // remember last bookshelf
            var config = settingsService.load();
            config.activeProfile().lastBookshelf = book.value.bookshelf;
            settingsService.save(config);
            // verify new settings
            inventoryService.read().then(onSettingsSuccess, onSettingsError);

            function onSettingsSuccess(response) {
                logService.debug("Settings saving successfull.");
            }

            function onSettingsError(response) {
                logService.error("Settings saving was not successfull.");
            }

            var bookImage = document.getElementById(book.value.id).getElementsByClassName('img-thumbnail')[0];
            if (bookImage.src) {
                // extract image info
                blobUtil.imgSrcToBlob(bookImage.src).then(function(blob) {
                    var reader = new window.FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function() {
                        var image = {};
                        image.name = 'thumbnail_' + book.value.id;
                        image.content_type = blob.type;
                        image.data = reader.result.replace('data:image/jpeg;base64,', '');
                        book.image = image;
                        inventoryService.save(book).then(onSuccess, onError);
                    }
                });
            } else {
                inventoryService.save(book).then(onSuccess, onError);
            }


            function onSuccess(response) {
                logService.info("Successfully added book");
                if (response.noUpdate) {
                    navigator.notification.alert("Book already added. Please increase amount.");
                } else  {
                    // sync on save
                    if (config.activeProfile().remotesync) {
                        inventoryService.syncRemote().then(function(response) {
                            $ionicLoading.hide();
                        }, function(error) {
                            $rootScope.$broadcast("settings.invalid");
                            $state.go('app.settings');
                            $ionicLoading.hide();
                        });
                    }
                    navigator.notification.alert("Book successfully added.", reset(), "Book");
                }
            }

            function onError(response) {
                $rootScope.$broadcast("booksave.error");
                logService.debug("Error during book saving: ");
                $scope.infoMsg = null;
                $ionicLoading.hide();
            }
        }

        init();

        $scope.searchQuery = {};
        $scope.infoMsg = null;

        // public methods
        $scope.scan = scan;
        $scope.save = save;
        $scope.selectBook = selectBook;
        $scope.search = search;
    }
]);


/**
 * @ngdoc controller
 * @name SettingsController
 * @module flynnBookScannerApp
 *
 * @description
 * Control preference/settings of the app and show log entries
 */
app.controller('SettingsController', ['$rootScope', '$scope', '$ionicLoading', '$state', 'logService', 'settingsService', 'inventoryService',
    function($rootScope, $scope, $ionicLoading, $state, logService, settingsService, inventoryService) {

        var defaultCouch = 'https://server.holisticon.de/couchdb/flynn/',
            defaultUser = '<LDAP-User>',
            defaultPassword,
            defaultOwner = 'Holisticon AG';

        // autoload
        loadSettings();
        readLogs();

        function loadSettings() {
            console.debug("Loading settings from local storage");
            var config = settingsService.load();
            $scope.flynn = {};
            $scope.flynn.activeProfile = {};
            $scope.flynn.activeProfile.name = config.activeProfile().name || 'default';
            $scope.flynn.activeProfile.owner = config.activeProfile().owner || defaultOwner;
            $scope.flynn.activeProfile.dbName = config.activeProfile().dbName || 'flynnDB_' + $scope.flynn.activeProfile.name;
            $scope.flynn.activeProfile.remotesync = config.activeProfile().remotesync || false;
            $scope.flynn.activeProfile.couchdb = config.activeProfile().couchdb || defaultCouch;
            $scope.flynn.activeProfile.user = config.activeProfile().user || defaultUser;
            $scope.flynn.activeProfile.password = config.activeProfile().password || defaultPassword;
            // load log levels
            $scope.logging = {};
            $scope.logging.logLevels = [{
                name: 'Errors only',
                logLevel: 'ERROR'
            }, {
                name: 'Info',
                logLevel: 'INFO'
            }, {
                name: 'Debug info',
                logLevel: 'DEBUG'
            }, {
                name: 'Trace messages',
                logLevel: 'TRACE'
            }];
        }

        function clearLogDB() {
            $ionicLoading.show();
            logService.clearLogData().then(function(logData) {
                readLogs();
            }, function(response) {
                $ionicLoading.hide();
            });
        }

        function saveSettings(redirect) {
            logService.debug("Saving settings to local storage");
            $ionicLoading.show();
            var profile = $scope.flynn.activeProfile;

            // adding default profile
            var config = {},
                profiles = [];
            profiles.push(profile);
            config.activeProfileID = 0;
            config.profiles = profiles;
            // save config
            settingsService.save(config);
            if (redirect) {
                // sync if server was added
                if ($scope.flynn.activeProfile.remotesync) {
                    syncWithServer();
                }
                inventoryService.read().then(onSuccess, onError);

                function onSuccess(response) {
                    $ionicLoading.hide();
                    logService.debug("Got valid server response. Settings seeem to be valid.");
                    $state.go('app.books');
                }

                function onError(response) {
                    $ionicLoading.hide();
                    settingsService.valid = false;
                    $rootScope.$broadcast("settingsService.invalid");
                }
            } else {
                $ionicLoading.hide();
            }
        }

        function syncWithServer() {
            $ionicLoading.show({
                template: '<i class="icon ion-looping loading-icon"></i>Syncing books ...'
            });
            inventoryService.syncRemote().then(function(response) {
                $ionicLoading.hide();
                $state.go('app.books');
            }, function(error) {
                if (error.status === 401) {
                    $rootScope.$broadcast("login.failed");
                } else {
                    $rootScope.$broadcast("settings.invalid");
                }
                $ionicLoading.hide();
            });
        }

        function readLogs() {
            $ionicLoading.show({
                template: '<i class="icon ion-looping loading-icon"></i>Loading log data ...'
            });
            var logs = logService.readLogData().then(function(response) {
                $scope.logs = response;
                $ionicLoading.hide();
            }, function(errorDetails) {
                logService.error('No log entries found');
                $ionicLoading.hide();
            });
        }

        // public methods
        $scope.load = loadSettings;
        $scope.save = function() {
            saveSettings(true);
        }
        $scope.sync = function() {
            saveSettings(false);
            syncWithServer();
        }
        $scope.showLogs = readLogs;
        $scope.clearLogs = clearLogDB;
        $scope.filterLogs = function() {
            if ($scope.logging.selectedLogLevel) {
                $ionicLoading.show();
                var logLevel = $scope.logging.selectedLogLevel.logLevel;
                logService.readLogData(logLevel).then(function(logData) {
                    $scope.logs = logData;
                    $ionicLoading.hide();
                }, function(response) {
                    $ionicLoading.hide();
                });
            } else {
                readLogs();
            }
        }
    }
]);

app.controller('AboutController', ['$scope', '$rootScope', 'APP_CONFIG',
    function($scope, $rootScope, APP_CONFIG) {
        'use strict';

        var load = function() {
            var info = [];
            angular.forEach(APP_CONFIG.info, function(value, key) {
                if (key === 'release_notes') {
                    var entry = {};
                    entry.label = value.label;
                    entry.hidden = value.hidden;
                    entry.value = value.value;
                    var htmlString = '<ul class="list list-inset">' + entry.value.replace(/[0-9a-f]{7}/g, '<li class="item">') + '</ul>';
                    entry.value = htmlString;
                    this.push(entry);
                } else {
                    this.push(value);
                }
            }, info);
            $scope.info = info;
        }

        load();
    }
]);