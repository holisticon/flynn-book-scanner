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
            controller: 'BookController'
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
