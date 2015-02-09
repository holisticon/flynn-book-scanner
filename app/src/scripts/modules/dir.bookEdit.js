/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description creates input formular for adding a book
 */
app.directive('bookEditDetails', ['$timeout', '$ionicLoading', 'base64',
	function($timeout, $ionicLoading, base64) {
		'use strict';
		return {
			restrict: 'E',
			scope: {
				selectedBook: '=book',
				editEntry: '=editEntry',
				newEntry: '=newEntry'
			},
			replace: true,
			templateUrl: 'templates/bookEditDetails.html',

			link: function(scope, element, attrs) {
				$ionicLoading.show();
				scope.$watch('selectedBook', function(selectedBook) {
					$timeout(function() {
						$ionicLoading.hide();
					}, 5);
				});
			}
		}
	}
]);