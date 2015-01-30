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