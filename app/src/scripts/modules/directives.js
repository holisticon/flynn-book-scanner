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

/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description creates input formular for adding a book
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
					$timeout(function() {
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
app.directive('imageData', ['imageDataCache', 'base64', 'logService', 'webWorkerPool',
	function(imageDataCache, base64, logService, webWorkerPool) {
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
					if (image && image.data && image.id) {
						if (imageDataCache.get(image.id) === undefined) {
							webWorkerPool.postMessage(image).then(function(event) {
								var url = event.data;
								element[0].src = url;
								imageDataCache.put(image.id, url);
							});
						} else {
							element[0].src = imageDataCache.get(image.id);
						}
					} 
				});
			}
		}
	}
]);