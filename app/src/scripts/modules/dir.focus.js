/**
 * @ngdoc directive
 * @name isFocused
 * @module flynnBookScannerApp
 * @description gives focus the the element, can be used as attribute
 */
app.directive('isFocused', ['$timeout',
	function($timeout) {
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