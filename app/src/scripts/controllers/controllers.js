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
        $rootScope.$on('network.offline', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "No network", 1002, "Network connection seems to be not working. Please try again later.");
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
            $ionicLoading.hide();
            $state.go('app.books');
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
app.controller('BooksController', ['$rootScope', '$scope', '$state', '$filter', '$ionicLoading', '$http', '$ionicActionSheet', 'settingsService', 'logService', 'inventoryService',
    function($rootScope, $scope, $state, $filter, $ionicLoading, $http, $ionicActionSheet, settings, logService, inventoryService) {

        var config = settings.load(),
            allBooks;

        // use paged list for view contents only
        function getBooks() {
            return $scope.books;
        }

        function getBookHeight(book, index) {
            //Make evenly indexed items be 10px taller, for the sake of example
            return (index % 2) === 0 ? 100 : 100;
        }

        function syncWithServer() {
            $ionicLoading.show({
                template: '<i class="icon ion-looping loading-icon"></i>&nbsp;&nbsp;Syncing books ...'
            });
            inventoryService.syncRemote().then(function(response) {
                $ionicLoading.hide();
            }, function(error) {
                if (error.status === 401) {
                    $rootScope.$broadcast("login.failed");
                } else {
                    $rootScope.$broadcast("settings.invalid");
                }
                $ionicLoading.hide();
            });
        }

        /**
         * load data via inventory service
         *
         */
        function load(pDontSync) {
            $ionicLoading.show();
            $scope.searchQuery = {};
            inventoryService.read().then(onSuccess, onError);

            function onSuccess(response) {
                if (response.books) {
                    allBooks = enrichDbData(response.books);
                    resetSearch();
                    // sync if server was added
                    if (config.activeProfile().remotesync && !pDontSync) {
                        syncWithServer();
                    }
                }
                $ionicLoading.hide();
            }

            function onError(response) {
                $rootScope.$broadcast("server.error");
                $scope.searchQuery = {};
                $ionicLoading.hide();
            }
        }

        function doSearch() {
            $scope.books = $filter('bookFilter')(allBooks, $scope.searchQuery.fullTextSearch);
        }

        function resetSearch() {
            $scope.books = allBooks;
            $scope.searchQuery = {};
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
                'bookId': book.hashCode
            });
        }

        function showActionMenu(book) {
            $scope.book = book;
            // Show the action sheet
            var hideSheet = $ionicActionSheet.show({
                buttons: [{
                    text: '<b>Edit</b>'
                }],
                destructiveText: 'Delete',
                titleText: 'Modify book entry',
                cancelText: 'Cancel',
                cancel: function() {},
                buttonClicked: function(index) {
                    $state.go('app.book_edit', {
                        'bookId': book.hashCode
                    });
                },
                destructiveButtonClicked: function() {
                    var bookToRemove = $scope.book;
                    removeBook(bookToRemove);
                    return true;
                }
            });
        }

        load(true);

        // public methods
        $scope.load = load;
        $scope.showBookDetails = showBookDetails;
        $scope.showActionMenu = showActionMenu;
        $scope.resetSearch = resetSearch;
        $scope.doSearch = doSearch;
        $scope.getBooks = getBooks;
        $scope.getBookHeight = getBookHeight;

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
        var credentials = settingsService.load(),
            bookID = $stateParams.bookId;

        function load() {
            if (bookID) {
                inventoryService.read().then(function(response) {
                    var allBooks = enrichDbData(response.books);
                    var selectedBook;

                    for (var index in allBooks) {
                        var book = allBooks[index];
                        if (book.hashCode == bookID) {
                            $scope.selectedBook = book;
                            break;
                        }
                    }
                }, function(errorResponse) {
                    log.error('Error during load book via hashCode');
                });
            }
        }

        load(bookID);

    }
]);


/**
 * @ngdoc controller
 * @name BookEditController
 * @module flynnBookScannerApp
 *
 * @description
 * Controller to edit book details from inventory
 */
app.controller('BookEditController', ['$rootScope', '$scope', '$state', '$stateParams', '$ionicLoading', '$location', 'logService', 'settingsService', 'inventoryService',
    function($rootScope, $scope, $state, $stateParams, $ionicLoading, $location, logService, settingsService, inventoryService) {
        var booksInventory, credentials = settingsService.load();
        var bookID = $stateParams.bookId;

        function save() {
            var book = $scope.selectedBook,
                config = settingsService.load();
            $ionicLoading.show();
            logService.debug("Starting save for book.");
            var bookImage = document.getElementById(book.value.id).getElementsByClassName('img-thumbnail')[0];
            if (bookImage && bookImage.src && !book.image) {
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
                        inventoryService.syncRemote().then(function(response) {}, function(error) {
                            $rootScope.$broadcast("settings.invalid");
                            $state.go('app.settings');
                        });
                    }
                    $ionicLoading.hide();
                    navigator.notification.alert('Book successfully updated.', $state.go('app.books', {}, {
                        reload: true
                    }), 'Book');
                }
            }

            function onError(response) {
                $rootScope.$broadcast('booksave.error');
                logService.debug('Error during book saving.');
                $ionicLoading.hide();
            }
        }

        function load() {
            if (bookID) {
                inventoryService.read().then(function(response) {
                    var allBooks = enrichDbData(response.books);
                    var selectedBook,
                        count = 0;
                    for (var index in allBooks) {
                        var book = allBooks[index];
                        if (book.hashCode == bookID) {
                            $scope.selectedBook = book;
                            break;
                        }
                    }
                }, function(errorResponse) {
                    log.error('Error during load book via hashCode');
                });
            }
        }

        load();


        // public methods
        $scope.save = save;

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
app.controller('BookController', ['$rootScope', '$scope', '$ionicLoading', '$http', '$filter', '$q', '$state', '$resource', '$ionicModal', '$ionicHistory', 'logService', 'settingsService', 'inventoryService', 'googleBookService',
    function($rootScope, $scope, $ionicLoading, $http, $filter, $q, $state, $resource, $ionicModal, $ionicHistory, logService, settingsService, inventoryService, googleBookService) {
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
                    }
                    $ionicLoading.hide();
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
            if (searchQuery && (searchQuery.isbn || searchQuery.keyword)) {
                // reset search
                booksInventory = {};
                inventoryService.read().then(function(response) {
                    booksInventory = response.books;
                    logService.debug('Start searching with criteria:');
                    retrieve(searchQuery);
                }, function(response) {
                    logService.error('Error during reading inventory for search with critera ' + JSON.stringify(searchQuery) + ':' + JSON.stringify(response));
                });
            } else {
                navigator.notification.alert('Please enter search details.', null, 'Info');
            }
        }

        function addManual($event) {
            // our function body
            $event.preventDefault();
            var book = {};
            book.value = {};
            book.value.volumeInfo = {};
            book.value.volumeInfo.industryIdentifiers = [];
            book.value.volumeInfo.industryIdentifiers.push({});
            book.value.volumeInfo.industryIdentifiers.push({});
            selectBook(book)
        }

        /**
         * Perform Google Book Search
         *
         */
        function retrieve(pSearchQuery) {
            $ionicLoading.show();
            googleBookService.search(pSearchQuery).then(function(response) {
                logService.info('Got valid service response');
                $scope.books = enrichDbData(response.books);
                $ionicLoading.hide();
            }, function(response) {
                $rootScope.$broadcast('booksearch.invalid');
                $ionicLoading.hide();
            });
        }

        function reset() {
            $ionicLoading.show();
            $scope.books = null;
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
                bookToAdd = pSelectedBookValue,
                books = booksInventory,
                authorInfo = "";
            logService.debug('Showing details for book: ' + pSelectedBookValue.value.volumeInfo.title);
            for (var itemIndex in pSelectedBookValue.value.volumeInfo.authors) {
                var authorsInfo = pSelectedBookValue.value.volumeInfo.authors;
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
                        logService.debug("Already found a saved book entry: " + bookEntry.value.volumeInfo.title);
                        bookToAdd = bookEntry;
                        count++;
                    }
                }
            }
            if (count > 0) {
                logService.debug("Found already entry in couchdb");
                bookToAdd.infoMsg = "Book is already added to library. Please update amount.";
            } else {
                logService.debug("Found no existing entry in couchdb");
                bookToAdd.infoMsg = null;
                // set default count to 1
                count = 1;
                bookToAdd.value.bookshelf = credentials.lastBookshelf;
            }
            bookToAdd.count = count;
            bookToAdd.authorInfo = authorInfo;
            bookToAdd.value.owner = bookToAdd.value.owner || credentials.owner;
            $scope.selectedBook = bookToAdd;
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
            inventoryService.read().then(function(response) {
                logService.debug("Settings saving successfull.");
            }, function(response) {
                logService.error("Settings saving was not successfull.");
            });

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
                        });
                    }
                    $ionicLoading.hide();
                    navigator.notification.alert("Book successfully added.", reset(), "Book");
                    $ionicHistory.clearHistory();
                }
            }

            function onError(response) {
                $rootScope.$broadcast("booksave.error");
                logService.debug("Error during book saving: ");
                $ionicLoading.hide();
            }
        }

        init();

        $scope.searchQuery = {};

        // public methods
        $scope.scan = scan;
        $scope.save = save;
        $scope.selectBook = selectBook;
        $scope.search = search;
        $scope.manual = addManual;
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
                template: '<i class="icon ion-looping loading-icon"></i>&nbsp;&nbsp;Syncing books ...'
            });
            inventoryService.syncRemote(true).then(function(response) {
                $ionicLoading.hide();
                $state.go('app.books');
            }, function(error) {
                if (error.status === 401) {
                    $rootScope.$broadcast("login.failed");
                } else {
                    if (error.status === 0) {
                        $rootScope.$broadcast("network.offline");
                    } else {
                        $rootScope.$broadcast("settings.invalid");
                    }
                }
                $ionicLoading.hide();
            });
        }

        function readLogs() {
            $ionicLoading.show({
                template: '<i class="icon ion-looping loading-icon"></i>&nbsp;&nbsp;Loading log data ...'
            });
            logService.readLogData().then(function(response) {
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
                    var htmlString = '<ul class="list-group">' + entry.value.replace(/[0-9a-f]{7}/g, '<li class="list-group-item">') + '</ul>';
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