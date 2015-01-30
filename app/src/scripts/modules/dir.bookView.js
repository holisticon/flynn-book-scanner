/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description show book details
 */
app.directive('bookViewDetails', ['$timeout', '$ionicLoading', 'base64', 'logService',
	function($timeout, $ionicLoading, base64, logService) {
		'use strict';
		return {
			restrict: 'E',
			scope: {
				selectedBook: '=book'
			},
			replace: true,
			templateUrl: 'templates/bookViewDetails.html',

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