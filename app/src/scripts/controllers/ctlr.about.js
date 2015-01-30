/**
 * @ngdoc controller
 * @name AboutController
 * @module flynnBookScannerApp
 *
 * @description
 * Provide details about the app
 */
app.controller('AboutController', ['$scope', '$rootScope', 'APP_CONFIG',
    function($scope, $rootScope, APP_CONFIG) {
        'use strict';

        var load = function() {
            var info = [];
            angular.forEach(APP_CONFIG.info, function(value, key) {
                if (key === 'release_notes') {
                    var entry = {};
                    entry.label = value.label;
                    entry.hidden = value.hidden;
                    entry.value = value.value;
                    var htmlString = '<ul class="list-group">' + entry.value.replace(/[0-9a-f]{7}/g, '<li class="list-group-item">') + '</ul>';
                    entry.value = htmlString;
                    this.push(entry);
                } else {
                    this.push(value);
                }
            }, info);
            $scope.info = info;
        }

        load();
    }
]);