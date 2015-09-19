/**
 * @ngdoc directive
 * @name imageData
 * @module flynnBookScannerApp
 * @description creates img element from provide base64 encoded image data
 */
app.directive('imageData', function (imageDataCache, base64, webWorkerPool) {
    'use strict';
    return {
      restrict: 'E',
      scope: {
        image: '=image'
      },
      replace: true,
      template: '<img/>',
      link: function (scope, element) {
        scope.$watch('image', function (image) {
          if (image && image.data && image.id) {
            if (imageDataCache.get(image.id) === undefined) {
              webWorkerPool.postMessage(image).then(function (event) {
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
    };
  }
);
