'use strict';

angular.module('flynnBookScannerApp')
    .controller('BookController', ['$scope', '$http', '$location', '$resource', function ($scope, $http, $location, $resource) {
        function scan() {
            cordova.plugins.barcodeScanner.scan(
                function (result) {
                    alert('We got a barcode\n' +
                        'Result: ' + result.text + '\n' +  'Format: ' + result.format + '\n' +  'Cancelled: ' + result.cancelled);
                    retrieve(result.text);
                },
                function (error) {
                    alert('Scanning failed: ' + error);
                }
            );
        }

        function retrieve(isbn) {
            $http.get('https://www.googleapis.com/books/v1/volumes/?q=:isbn='+isbn+'&projection=full&maxResults=1').success(function(data) {
                $scope.books = data.items;
            });
        }

        var BookRessource = $resource('http://mmd.holisticon.de:5984/books/', {});



        function save(book) {
            var thisBook = new BookRessource(book);
            thisBook.$save(function(data) {
                alert(JSON.stringify(data));
            });
        }

        // https://www.googleapis.com/books/v1/volumes/?q=:isbn=9781849682398
        $scope.isbn = $location.search().isbn;

        $http.get('https://www.googleapis.com/books/v1/volumes/?q=:isbn='+$scope.isbn+'&projection=full&maxResults=1').success(function(data) {
            $scope.books = data.items;
            console.log(JSON.stringify(data.items));
        });

        $scope.scan = scan;
        $scope.save = save;

 }]);