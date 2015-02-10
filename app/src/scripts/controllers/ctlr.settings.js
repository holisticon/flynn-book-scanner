/**
 * @ngdoc controller
 * @name SettingsController
 * @module flynnBookScannerApp
 *
 * @description
 * Control preference/settings of the app and show log entries
 */
app.controller('SettingsController', ['$rootScope', '$log', '$scope', '$ionicLoading', '$state', 'logService', 'settingsService', 'inventoryService',
    function($rootScope, $log, $scope, $ionicLoading, $state, logService, settingsService, inventoryService) {

        // autoload
        loadSettings();
        readLogs();

        function loadSettings() {
            $log.debug('Loading settings from local storage');
            var config = settingsService.load();
            $scope.flynn = {};
            $scope.flynn.activeProfile = {};
            $scope.flynn.activeProfile.name = config.activeProfile().name || 'default';
            $scope.flynn.activeProfile.owner = config.activeProfile().owner;
            $scope.flynn.activeProfile.dbName = config.activeProfile().dbName || 'flynnDB_' + $scope.flynn.activeProfile.name;
            $scope.flynn.activeProfile.remotesync = config.activeProfile().remotesync || false;
            $scope.flynn.activeProfile.couchdb = config.activeProfile().couchdb;
            $scope.flynn.activeProfile.user = config.activeProfile().user;
            $scope.flynn.activeProfile.password = config.activeProfile().password;
            // load log levels
            $scope.logging = {};
            $scope.logging.logLevels = [{
                name: 'Errors only',
                logLevel: 'ERROR'
            }, {
                name: 'Info',
                logLevel: 'INFO'
            }, {
                name: 'Debug info',
                logLevel: 'DEBUG'
            }, {
                name: 'Trace messages',
                logLevel: 'TRACE'
            }];
        }

        function clearLogDB() {
            $ionicLoading.show();
            logService.clearLogData().then(function(logData) {
                readLogs();
            }, function(response) {
                $ionicLoading.hide();
            });
        }

        function readInventory() {
            inventoryService.read().then(function(response) {
                $ionicLoading.hide();
                $log.debug('Got valid server response. Settings seeem to be valid.');
                $state.go('app.books');
            }, function(error) {
                $ionicLoading.hide();
                settingsService.valid = false;
                $rootScope.$broadcast("settingsService.invalid");
            });
        }

        function saveSettings(redirect) {
            $log.debug('Saving settings to local storage');
            $ionicLoading.show();
            var profile = $scope.flynn.activeProfile;
            // adding default profile
            var config = {},
                profiles = [];
            profiles.push(profile);
            config.activeProfileID = 0;
            config.profiles = profiles;
            // save config
            settingsService.save(config);
            if (redirect) {
                // sync if server was added
                if ($scope.flynn.activeProfile.remotesync) {
                    syncWithServer();
                } else {
                    readInventory();
                }
            } else {
                $ionicLoading.hide();
            }
        }

        function syncWithServer() {
            $ionicLoading.show({
                template: '<i class="icon ion-looping loading-icon"></i>&nbsp;&nbsp;Syncing books ...'
            });
            inventoryService.syncRemote(true).then(function(response) {
                $ionicLoading.hide();
                readInventory();
            }, function(error) {
                if (error.status === 401) {
                    $rootScope.$broadcast("login.failed");
                } else {
                    if (error.status === 0) {
                        $rootScope.$broadcast("network.offline");
                    } else {
                        $rootScope.$broadcast("settings.invalid");
                    }
                }
                $ionicLoading.hide();
            });
        }

        function readLogs() {
            $ionicLoading.show({
                template: '<i class="icon ion-looping loading-icon"></i>&nbsp;&nbsp;Loading log data ...'
            });
            logService.readLogData().then(function(response) {
                $scope.logs = response;
                $ionicLoading.hide();
            }, function(errorDetails) {
                $log.error('No log entries found');
                $ionicLoading.hide();
            });
        }

        // public methods
        $scope.load = loadSettings;
        $scope.save = function() {
            saveSettings(true);
        }
        $scope.sync = function() {
            saveSettings(false);
            syncWithServer();
        }
        $scope.showLogs = readLogs;
        $scope.clearLogs = clearLogDB;
        $scope.filterLogs = function() {
            if ($scope.logging.selectedLogLevel) {
                $ionicLoading.show();
                var logLevel = $scope.logging.selectedLogLevel.logLevel;
                logService.readLogData(logLevel).then(function(logData) {
                    $scope.logs = logData;
                    $ionicLoading.hide();
                }, function(response) {
                    $ionicLoading.hide();
                });
            } else {
                readLogs();
            }
        }
    }
]);