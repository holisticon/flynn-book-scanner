'use strict';

angular.module('controllers', []);

angular.module('flynnBookScannerApp', [
        'controllers',
        'ngCookies',
        'ngResource',
        'ngSanitize',
        'ngRoute'
    ])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            }).when('/book', {
                templateUrl: 'views/bookView.html',
                controller: 'BookController'
            }).otherwise({
                redirectTo: '/'
            });
    });
