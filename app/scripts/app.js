'use strict';


var app = angular.module('flynnBookScannerApp', [
    'controllers',
    'ngCookies',
    'ngResource',
    'ngSanitize',
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