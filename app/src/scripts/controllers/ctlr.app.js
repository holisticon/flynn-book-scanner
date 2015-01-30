/**
 * @ngdoc controller
 * @name AppController
 *
 * @description
 * Controller for the app
 *
 * @module flynnBookScannerApp
 */
app.controller('AppController', ['$scope', '$rootScope', '$state', '$ionicLoading', 'settingsService', 'logService', 'inventoryService',
    function($scope, $rootScope, $state, $ionicLoading, settings, logService, inventoryService) {
        $ionicLoading.show();
        $rootScope.$on('settings.invalid', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Settings invalid", 1001, "Settings seems to be incorrect. Please correct or check network settings.");
        });
        $rootScope.$on('network.offline', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "No network", 1002, "Network connection seems to be not working. Please try again later.");
        });
        $rootScope.$on('server.timeout', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Timeout", 2001, "No answer from server");
        });
        $rootScope.$on('server.error', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Books couldn't be loaded", 2002, "The server didn't respond. Please check your network settings.");
        });
        $rootScope.$on('login.failed', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Login error", 3001, "Please check your sync user data.");
        });
        $rootScope.$on('barcode.error', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Barcode error", 4001, "Barcode reader not working. Did you enable camera access?");
        });
        $rootScope.$on('booksearch.invalid', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Book couldn't be loaded", 5001, "The book search wasn't successfull. Server didn't respond.");
        });
        $rootScope.$on('booksave.error', function(event) {
            showErrorDialog($rootScope, $scope, $ionicLoading, logService, "Book couldn't be saved", 5101, "The book save wasn't successfull. Server didn't respond.");
        });

        $scope.userAgent = navigator.userAgent;

        //  show settings 
        var config = settings.load();
        if (config && !config.valid) {
            //timeout of 30 seconds
            config.timeout = 30000;
            $state.go('app.settings');
        } else {
            $ionicLoading.hide();
            $state.go('app.books');
        }
        $rootScope.settings = config;
    }
]);