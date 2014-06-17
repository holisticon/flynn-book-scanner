'use strict';


/**
 * Shows up the error dialog with the given error details
 * @param $rootScope root scope
 * @param $scope current scope
 * @param blockUI reference to remove blockUI
 * @param errorTitle title to use
 * @param errorCode error code to use
 * @param errorDetails message to display
 */
function showErrorDialog($rootScope, $scope, blockUI, errorTitle, errorCode, errorDetails) {
    // handle error
    var errorMsg = {
        title: errorTitle,
        code: errorCode,
        details: errorDetails
    };
    $rootScope.error_msg = errorMsg; // Unblock the user interface
    blockUI.stop();
    $scope.toggle('overlayError');
}



var app = angular.module('flynnBookScannerApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'blockUI',
    'ngRoute',
    'mobile-angular-ui',
    'LocalStorageModule'
]);

app.config(function($logProvider) {
    $logProvider.debugEnabled(true);
});


app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            redirectTo: '/books',
        }).when('/book', {
            templateUrl: 'views/bookView.html',
            controller: 'SearchController'
        }).when('/settings', {
            templateUrl: 'views/settingsView.html',
            controller: 'SettingsController'
        }).when('/books', {
            templateUrl: 'views/booksView.html',
            controller: 'BooksController'
        }).otherwise({
            redirectTo: '/book'
        });
});

app.config(['$httpProvider',
    function($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
]);


/**
 * Configure blockUI
 */
app.config(function(blockUIConfigProvider) {

    // Change the default overlay message
    blockUIConfigProvider.message('Loading ...');

    // Change the default delay to 50ms before the blocking is visible
    blockUIConfigProvider.delay(50);

});



/**
 * Controller for the app.
 */
app.controller('MainController', ['$scope', '$rootScope', '$location', 'blockUI', 'SettingsService',
    function($scope, $rootScope, $location, blockUI, $settings) {
        // Block the user interface
        blockUI.start();
        // Cordova is ready
        console.log("Device is ready!");

        $rootScope.$on("$routeChangeStart", function() {

        });
        $rootScope.$on("$routeChangeSuccess", function() {});

        $rootScope.$on('settings.invalid', function(event) {
            showErrorDialog($rootScope, $scope, blockUI, "Settings invalid", 1001, "Settings seems to be incorrect. Please correct or check network settings.");
        });

        $rootScope.$on('server.timeout', function(event) {
            showErrorDialog($rootScope, $scope, blockUI, "Timeout", 2001, "No answer from server");
        });

        $rootScope.$on('server.error', function(event) {
            showErrorDialog($rootScope, $scope, blockUI, "Books couldn't be loaded", 2002, "The server didn't respond. Please check your network settings.");
        });

        $rootScope.$on('login.failed', function(event) {
            showErrorDialog($rootScope, $scope, blockUI, "Settings incorrect", 3001, "Please check your settings");
        });

        $rootScope.$on('barcode.error', function(event) {
            showErrorDialog($rootScope, $scope, blockUI, "Barcode error", 4001, "Barcode reader not working. Did you enable camera access?");
        });

        $rootScope.$on('booksearch.invalid', function(event) {
            showErrorDialog($rootScope, $scope, blockUI, "Book couldn't be loaded", 5001, "The book search wasn't successfull. Server didn't respond.");
        });

        $rootScope.$on('booksave.error', function(event) {
            showErrorDialog($rootScope, $scope, blockUI, "Book couldn't be saved", 5101, "The book save wasn't successfull. Server didn't respond.");
        });

        $scope.userAgent = navigator.userAgent;

        //  show settings 
        var settings = $settings.load();
        if (settings && !settings.valid) {
            //timeout of 30 seconds
            settings.timeout = 30000;
            blockUI.stop();
            $location.path("/settings");
        } else {
            blockUI.stop();
        }
        $rootScope.settings = settings;
    }
]);