/**
 * @ngdoc function
 * @name errorDialogClosed
 * @description Called after error dialog is closed.
 * @param {object} root scope
 * @param {object} current scope
 * @param {object} reference to log service
 */
function errorDialogClosed($rootScope, $scope, log) {
    log.debug("Error dialog closed.");
}

/**
 * @ngdoc function
 * @name showErrorDialog
 * @description Shows up the error dialog with the given error details
 * @param {object} root scope
 * @param {object} current scope
 * @param {object} reference to loading indicator
 * @param {object} reference to log service
 * @param {object} title to use
 * @param {object} error code to use
 * @param {object} message to display
 */
function showErrorDialog($rootScope, $scope, $ionicLoading, log, errorTitle, errorCode, errorDetails) {
    $ionicLoading.show();
    navigator.notification.alert(errorCode + "\n" + errorDetails, errorDialogClosed($rootScope, $scope, log), "Error - " + errorTitle);
    $ionicLoading.hide();
}

/**
 * @ngdoc function
 * @name onDeviceReady
 * @description Called after device is ready to use
 */
var onDeviceReady = function() {
    var $http = angular.injector(['ng']).get('$http'),
        $rootScope = angular.injector(['ng']).get('$rootScope');
    $http.get('config.json')
        .success(function(data, status, headers, config) {
            var config = data;
            app.constant("APP_CONFIG", config);
            if (config.dev === true) {
                console.debug('Skipping bootstrapping on dev mode.');
                navigator.notification.alert('Running in dev mode!', null, 'Info');
            } else {
                // Add additional services/constants/variables to your app,
                // and then finally bootstrap it:
                angular.bootstrap(document, ['flynnBookScannerApp']);
            }
            $rootScope.loading = false;
        })
        .error(function(data, status, headers, config) {
            console.error('Did not get valid config.json file.');
            navigator.notification.alert('Server did not show valid response.', null, 'Server Error');
        });
}

// on dev fire up event directly
if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
    document.addEventListener("deviceready", onDeviceReady, false);
} else {
    onDeviceReady();
}

/**
 * @ngdoc object
 * @name app declaration
 * @description  declares flynn app
 * @module flynnBookScannerApp
 */
var app = angular.module('flynnBookScannerApp', [
    'ui.bootstrap',
    'LocalStorageModule',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'ngTouch',
    'ionic',
    'dbLog',
    'webWorkerPool'
]);

/**
 * @ngdoc filter
 * @name reverse
 * @module flynnBookScannerApp
 * @description Reverse list in order
 */
app.filter('reverse', function() {
    return function(items) {
        if (items) {
            return items.slice().reverse();
        } else {
            return;
        }
    };
});

/**
 * @ngdoc filter
 * @name bookFilter
 * @module flynnBookScannerApp
 * @description book filter
 */
app.filter('bookFilter', [function() {
    /**
     * Search in list for text
     */
    function searchList(pList, pSearchText) {
        for (var i = 0, len = pList.length; i < len; i++) {
            var entry = pList[i].toUpperCase();
            if (entry.indexOf(pSearchText) > -1) {
                return true;
            } else {
                return false;
            }
        }
    }
    return function(pBooks, pSearchText) {
        if (pSearchText) {
            var found=false,
            	filtered,
                searchText = pSearchText.toUpperCase();
            for (var i = 0, len = pBooks.length; i < len; i++) {
                var book = pBooks[i],found=false;
                if (book.value.volumeInfo.title.toUpperCase() === searchText) { // matches whole word
                	found=true;
                } else {
                    if (book.value.volumeInfo.title.toUpperCase().indexOf(searchText) > -1) {
                    	found=true;
                    } else {
                        if (book.value.volumeInfo.subtitle && book.value.volumeInfo.subtitle.toUpperCase().indexOf(searchText) > -1) {
                        	found=true;
                        } else {
                            if (book.value.volumeInfo.description && book.value.volumeInfo.description.toUpperCase().indexOf(searchText) > -1) {
                            	found=true;
                            } else {
                                if (book.value.volumeInfo.publishedDate && book.value.volumeInfo.publishedDate.toString().toUpperCase().indexOf(searchText) > -1) {
                                	found=true;
                                } else {
                                    if (book.value.volumeInfo.authors && searchList(book.value.volumeInfo.authors, searchText)) {
                                    	found=true;
                                    }
                                }
                            }
                        }
                    }
                }
                if(found){
                	if(!filtered){
                    	filtered=[];                		
                	}
                    filtered.push(book);
                }
            };
            return filtered;
        } else {
            return pBooks;
        }
    };
}]);

/**
 * @ngdoc function
 * @name constant
 * @module flynnBookScannerApp
 * @description  Set loading text
 */
app.constant('$ionicLoadingConfig', {
    template: '<i class="icon ion-loading-d"></i>&nbsp;&nbsp;Loading ...'
});


/**
 * @ngdoc function
 * @name run
 * @module flynnBookScannerApp
 * @description  init ionic
 */
app.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
    });
})


/**
 * @ngdoc function
 * @name config
 * @module flynnBookScannerApp
 * @description configure app
 */
app.config(function($urlRouterProvider,$compileProvider, $httpProvider, $stateProvider, $ionicConfigProvider, webWorkerPoolProvider, logServiceProvider, APP_CONFIG) {
	// fix wp8 cordova errors
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|ghttps?|ms-appx|x-wmapp0):/);
	// limit webworker threads
    webWorkerPoolProvider.workerUrl('scripts/webworker.renderImage.js');
    webWorkerPoolProvider.capacity(4);
    // places them at the bottom for all OS
    $ionicConfigProvider.tabs.position("bottom");
    // makes them all look the same across all OS
    $ionicConfigProvider.tabs.style("standard");
    // configure caching
    $ionicConfigProvider.views.maxCache(5);
    $ionicConfigProvider.templates.maxPrefetch(3);
    // configure logging
    logServiceProvider.dbName('flynnDB_logs');
    logServiceProvider.enableDebugLogging(APP_CONFIG.debug);
    if (APP_CONFIG.debug) {
        // enable couchDB debug
        PouchDB.debug.enable('*');
    } else {
        PouchDB.debug.disable();
    }
    logServiceProvider.enableTraceLogging(APP_CONFIG.trace);
    // configure routes and states
    $stateProvider
        .state('app', {
            url: "/app",
            templateUrl: 'views/navbarView.html',
            controller: 'AppController'
        })
        .state('app.settings', {
            url: "/settings",
            views: {
                'menuContent': {
                    templateUrl: 'views/settingsView.html',
                    controller: 'SettingsController'
                }
            }
        })
        .state('app.book_add', {
            url: "/book/add",
            views: {
                'menuContent': {
                    templateUrl: 'views/addBookView.html',
                    controller: 'BookController'
                }
            }
        })
        .state('app.books', {
            url: "/books",
            views: {
                'menuContent': {
                    templateUrl: 'views/booksView.html',
                    controller: 'BooksController'
                }
            }
        })
        .state('app.book_show', {
            url: "/book/:bookId",
            views: {
                'menuContent': {
                    templateUrl: 'views/bookView.html',
                    controller: 'BookDetailsController'
                }
            }
        })
        .state('app.book_edit', {
            url: "/book/edit/:bookId",
            views: {
                'menuContent': {
                    templateUrl: 'views/editBookView.html',
                    controller: 'BookEditController'
                }
            }
        })
        .state('app.about', {
            url: "/about",
            views: {
                'menuContent': {
                    templateUrl: 'views/aboutView.html',
                    controller: 'AboutController'
                }
            }
        });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app');
    // configure http provider for cross-domain
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});