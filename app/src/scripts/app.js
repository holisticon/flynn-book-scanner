'use strict';

/**
 * @ngdoc Called after error dialog is closed.
 * @param $rootScope root scope
 * @param $scope current scope
 * @param log reference to log service
 */
function errorDialogClosed($rootScope, $scope, log) {
    log.debug("Error dialog closed.");
}

/**
 * @ngdoc Shows up the error dialog with the given error details
 * @param $rootScope root scope
 * @param $scope current scope
 * @param $ionicLoading reference to loading indicator
 * @param log reference to log service
 * @param errorTitle title to use
 * @param errorCode error code to use
 * @param errorDetails message to display
 */
function showErrorDialog($rootScope, $scope, $ionicLoading, log, errorTitle, errorCode, errorDetails) {
    $ionicLoading.show();
    navigator.notification.alert(errorCode + "\n" + errorDetails, errorDialogClosed($rootScope, $scope, log), "Error - " + errorTitle);
    $ionicLoading.hide();
}

/**
 *
 * @ngdoc Called after device is ready to use
 */
var onDeviceReady = function() {
    var $http = angular.injector(['ng']).get('$http'),
        $rootScope = angular.injector(['ng']).get('$rootScope');
    $rootScope.loading = true;
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
            $rootScope.loading = false;
        });
}

// on dev fire up event directly
if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
    document.addEventListener("deviceready", onDeviceReady, false);
} else {
    onDeviceReady();
}

/**
 * @ngdoc flynn app
 *
 * @module flynnBookScannerApp
 *
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
    'dbLog'
]);

/**
 * @ngdoc Reverse list in order
 *
 * @module flynnBookScannerApp
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
 * @ngdoc Set loading text
 *
 * @module flynnBookScannerApp
 */
app.constant('$ionicLoadingConfig', {
    template: 'Loading ...'
});

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
 * @ngdoc configure app module
 *
 * @module flynnBookScannerApp
 */
app.config(function($stateProvider, $urlRouterProvider, $httpProvider, logServiceProvider, APP_CONFIG) {
    // configure logging
	logServiceProvider.dbName('flynnDB_logs');
	logServiceProvider.enableDebugLogging(APP_CONFIG.debug);
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
        .state('app.about', {
            url: "/about",
            views: {
                'menuContent': {
                    templateUrl: 'views/aboutView.html'
                }
            }
        });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app');
    // configure http provider for cross-domain
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});
