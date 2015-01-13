/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description creates img element from provide base64 encoded image data
 */
app.directive('bookDetails', ['$interval', '$ionicLoading', 'base64', 'logService',
	function($interval, $ionicLoading, base64, logService) {
		'use strict';
		return {
			restrict: 'E',
			scope: {
				selectedBook: '=book',
				editMode: '=edit'
			},
			replace: true,
			templateUrl: 'templates/bookDetails.html',

			link: function(scope, element, attrs) {
				$ionicLoading.show();
				scope.$watch('selectedBook', function(selectedBook) {
					$ionicLoading.hide();
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
app.directive('imageData', ['$interval', '$ionicLoading', 'base64', 'logService',
	function($interval, $ionicLoading, base64, logService) {
		'use strict';

		var b64toBlob = function(b64Data, contentType, sliceSize) {
			contentType = contentType || '';
			sliceSize = sliceSize || 512;
			var byteCharacters = atob(b64Data),
				byteArrays = [];

			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);
				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}
				var byteArray = new Uint8Array(byteNumbers);
				byteArrays.push(byteArray);
			}
			var blob = new Blob(byteArrays, {
				type: contentType
			});
			return blob;
		}

		return {
			restrict: 'E',
			scope: {
				image: '=image'
			},
			replace: true,
			template: '<img/>',
			link: function(scope, element, attrs) {
				scope.$watch('image', function(image) {
					if (image && image.data) {
						$ionicLoading.show();
						try {
							var blob = b64toBlob(image.data, image.content_type);
							var blobUrl = URL.createObjectURL(blob);
							var img = element[0];
							img.src = blobUrl;
							$ionicLoading.hide();
						} catch (e) {
							logService.error('Error during image transformation');
							$ionicLoading.hide();
						}
					}
				});
			}
		}
	}
]);