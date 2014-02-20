'use strict';

angular.module('controllers', []);

angular.module('flynnBookScannerApp', [
        'controllers',
        'ngCookies',
        'ngResource',
        'ngSanitize',
        'ngRoute',
        'LocalStorageModule'
    ])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/book', {
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
    }).config(['$httpProvider', function ($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }]);

