/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description creates img element from provide base64 encoded image data
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
			         $timeout(function(){
							$ionicLoading.hide();
			         }, 5);
				});
			}
		}
	}
]);

/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description creates img element from provide base64 encoded image data
 */
app.directive('bookEditDetails', ['$timeout', '$ionicLoading', 'base64', 'logService',
	function($timeout, $ionicLoading, base64, logService) {
		'use strict';
		return {
			restrict: 'E',
			scope: {
				selectedBook: '=book',
				newEntry: '=newEntry'
			},
			replace: true,
			templateUrl: 'templates/bookEditDetails.html',

			link: function(scope, element, attrs) {
				$ionicLoading.show();
				scope.$watch('selectedBook', function(selectedBook) {
			         $timeout(function(){
							$ionicLoading.hide();
			         }, 5);
				});
			}
		}
	}
]);


/**
 * @ngdoc directive
 * @name isFocused
 * @module flynnBookScannerApp
 * @description gives focus the the element, can be used as attribute
 */
app.directive('isFocused', ['$timeout', 'logService',
	function($timeout, logService) {
		'use strict';
		return {
			restrict: 'A',
			scope: {
				trigger: '&isFocused'
			},
			link: function(scope, element) {
				if (scope.trigger()) {
					$timeout(function() {
						element[0].focus();
						element[0].click();
						if (typeof cordova != 'undefined') {
							cordova.plugins.Keyboard.show();
						}
					});
				}
			}
		}
	}
]);

/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description creates img element from provide base64 encoded image data
 */
app.directive('imageData', ['base64', 'logService', 'webWorkerPool',
	function(base64, logService, webWorkerPool) {
		'use strict';

		return {
			restrict: 'E',
			scope: {
				image: '=image'
			},
			replace: true,
			template: '<img/>',
			link: function(scope, element, attrs) {
				scope.$watch('image', function(image) {
					if (image && image.data && !element.attr('src')) {
						webWorkerPool.postMessage(image).then(function(event) {
							var img = element[0],
								url = event.data;
							img.src = url;
						});
					}
				});
			}
		}
	}
]);