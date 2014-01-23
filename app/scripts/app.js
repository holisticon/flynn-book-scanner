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
            .when('/book', {
                templateUrl: 'views/bookView.html',
                controller: 'BookController'
            }).otherwise({
                redirectTo: '/book'
            });
    });
