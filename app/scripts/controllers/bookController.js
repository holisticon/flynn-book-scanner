(function () {


    'use strict';

    angular.module('controllers')
        .controller('BookController', ["$scope", "$http", "$location", function ($scope, $http, $location) {

            // https://www.googleapis.com/books/v1/volumes/?q=:isbn=9781849682398
            var search = $location.search().isbn;
            $scope.isbn = search;

            var bookResource = $http.get("https://www.googleapis.com/books/v1/volumes/?q=:isbn="+$scope.isbn+"&projection=full&maxResults=1").success(function(data) {
                $scope.books = data.items;
            });

        }]);
})();