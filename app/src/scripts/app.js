'use strict';

function errorDialogClosed($rootScope, $scope, $log) {
    $log.debug("Error dialog closed.");
}

/**
 * Shows up the error dialog with the given error details
 * @param $rootScope root scope
 * @param $scope current scope
 * @param $ionicLoading reference to remove $ionicLoading
 * @param errorTitle title to use
 * @param errorCode error code to use
 * @param errorDetails message to display
 */
function showErrorDialog($rootScope, $scope, $log, $ionicLoading, errorTitle, errorCode, errorDetails) {
    $ionicLoading.show();
    navigator.notification.alert(errorCode + "\n" + errorDetails, errorDialogClosed($rootScope, $scope, $log), "Error - " + errorTitle);
    $ionicLoading.hide();
}


var onDeviceReady = function() {
    var $http = angular.injector(['ng']).get('$http'),
        $rootScope = angular.injector(['ng']).get('$rootScope');
    $rootScope.loading = true;
    $http.get('config.json')
        .success(function(data, status, headers, config) {
            var config = data;
            // enable debugging
            if (config.debug === 'true') {
                config.debug = true;
            }
            // enable development mode
            if (config.dev === 'true') {
                config.dev = true;
            }
            app.constant("APP_CONFIG", config);
            if (config.debug === true) {
                console.debug('Skipping bootstrapping on debug.');
                navigator.notification.alert('Running in debug mode!', null, 'Info');
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
 * @ngdoc
 *
 * @name flynn app
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
    'ionic'
]);

/**
 * @ngdoc
 * 
 * Reverse list in order
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

app.config(function($logProvider) {
    $logProvider.debugEnabled(true);
});

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


app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('app', {
            url: "/app",
            // abstract: true,
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
});

app.config(['$httpProvider',
    function($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
]);


/**
 * Controller for the app.
 */
app.controller('AppController', ['$scope', '$rootScope', '$state', '$ionicLoading', 'SettingsService', 'LogService', 'InventoryService',
    function($scope, $rootScope, $state, $ionicLoading, $settings, $log, $inventory) {

        $ionicLoading.show();
        $rootScope.$on("$routeChangeStart", function() {
            $ionicLoading.show();
        });
        $rootScope.$on("$routeChangeSuccess", function() {
            $ionicLoading.hide();
        });

        $rootScope.$on('settings.invalid', function(event) {
            showErrorDialog($rootScope, $scope, $log, $ionicLoading, "Settings invalid", 1001, "Settings seems to be incorrect. Please correct or check network settings.");
        });

        $rootScope.$on('server.timeout', function(event) {
            showErrorDialog($rootScope, $scope, $log, $ionicLoading, "Timeout", 2001, "No answer from server");
        });

        $rootScope.$on('server.error', function(event) {
            showErrorDialog($rootScope, $scope, $log, $ionicLoading, "Books couldn't be loaded", 2002, "The server didn't respond. Please check your network settings.");
        });

        $rootScope.$on('login.failed', function(event) {
            showErrorDialog($rootScope, $scope, $log, $ionicLoading, "Settings incorrect", 3001, "Please check your settings");
        });

        $rootScope.$on('barcode.error', function(event) {
            showErrorDialog($rootScope, $scope, $log, $ionicLoading, "Barcode error", 4001, "Barcode reader not working. Did you enable camera access?");
        });

        $rootScope.$on('booksearch.invalid', function(event) {
            showErrorDialog($rootScope, $scope, $log, $ionicLoading, "Book couldn't be loaded", 5001, "The book search wasn't successfull. Server didn't respond.");
        });

        $rootScope.$on('booksave.error', function(event) {
            showErrorDialog($rootScope, $scope, $log, $ionicLoading, "Book couldn't be saved", 5101, "The book save wasn't successfull. Server didn't respond.");
        });

        $scope.userAgent = navigator.userAgent;

        //  show settings 
        var config = $settings.load();
        if (config && !config.valid) {
            //timeout of 30 seconds
            config.timeout = 30000;
            $state.go('app.settings'); //, {}, {reload: true});
            //if($state.current.name !== 'app.settings'){
            //$state.go('app.settings', {}, {reload: true});
            // }
        } else {
            $state.go('app.books');
            //$state.go('app.books');//, {}, {reload: true});
            //$state.go('app.books', {}, {reload: true});
            //sync on start 
            if (config.activeProfile().remotesync) {
                $inventory.syncRemote();
            }
            $ionicLoading.hide();

        }
        $ionicLoading.hide();
        $rootScope.settings = config;
    }
]);