app.directive('imageData', ['$interval', 'base64', 'logService',
	function($interval, base64, logService) {
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
					if (image) {
						try {
							var blob = b64toBlob(image.data, image.content_type);
							var blobUrl = URL.createObjectURL(blob);
							var img = element[0];
							img.src = blobUrl;
						} catch (e) {
							logService.error('Error during image transformation');
						}
					}
				});
			}
		}
	}
]);