'use strict';

angular.module('flynnBookScannerApp')
    .controller('BookController', ['$scope', '$http', '$location', '$resource', function ($scope, $http, $location, $resource) {
        var isbn = $location.search().isbn,
            BookResource = $resource('http://mmd.holisticon.de:5984/books/', {});
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

        function save(book) {
            var bookResource = new BookResource(book);
            bookResource.$save(function(data) {
                alert(JSON.stringify(data));
            });
        }

        retrieve(isbn);

        $scope.isbn = isbn;
        $scope.scan = scan;
        $scope.save = save;

 }]);