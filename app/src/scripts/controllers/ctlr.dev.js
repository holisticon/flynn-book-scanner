/**
 * @ngdoc controller
 * @name DevController
 * @module flynnBookScannerApp
 *
 * @description
 * development helper
 */
app.controller('DevController', ['$rootScope', '$scope', '$state','$log','settingsService', 'inventoryService',
    function($rootScope, $scope, $state, $log, settings, inventoryService) {

        var config = settings.load();               
        
    }
]);