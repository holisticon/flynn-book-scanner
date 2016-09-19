/**
 * @ngdoc controller
 * @name SettingsController
 * @module flynnBookScannerApp
 *
 * @description
 * Control preference/settings of the app and show log entries
 */
app.controller('SettingsController', function ($rootScope, $log, $scope, $ionicLoading, $state, logService, settingsService, inventoryService) {
    'use strict';

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

    function readLogs() {
      $ionicLoading.show({template: '<i class="icon ion - looping loading-icon"></i>&nbsp;&nbsp;Loading log data ...'});
      logService.readLogData().then(function (response) {
        $scope.logs = response;
        $ionicLoading.hide();
      }, function () {
        $log.error('No log entries found');
        $ionicLoading.hide();
      });
    }

    function clearLogDB() {
      $ionicLoading.show();
      logService.clearLogData().then(function () {
        readLogs();
      }, function () {
        $ionicLoading.hide();
      });
    }

    function emailLogs() {
      var logViewData = '';
      for (var i in $scope.logs) {
        var log = $scope.logs[i];
        logViewData += '<p>' + log.timestamp + ' - ' + log.level + ':' + log.details + '</p>';
      }
      cordova.plugins.email.open({
        subject: 'flynn: Log details',
        body: '<br><br><h3>Log-Entries:</h3><br>' + logViewData,
        isHtml: true
      });
    }

    function readInventory() {
      inventoryService.read().then(function () {
        $log.debug('Got valid server response. Settings seems to be valid.');
        $state.go('app.books');
      }, function () {
        settingsService.valid = false;
        $rootScope.$broadcast('settingsService.invalid');
      });
    }

    function syncWithServer() {
      $ionicLoading.show({template: '<i class="icon ion - looping loading-icon"></i>&nbsp;&nbsp;Syncing books ...'});
      inventoryService.syncRemote(true).then(function () {
        $ionicLoading.hide();
        readInventory();
      }, function (error) {
        $ionicLoading.hide();
        switch (error.status) {
          case 0:
            $rootScope.$broadcast('network.offline');
            break;
          case 400:
            $rootScope.$broadcast('sync.remoteError');
            break;
          case 401:
            $rootScope.$broadcast('login.failed');
            break;
          default:
            $rootScope.$broadcast('settings.invalid');
        }
      });
    }

    function saveSettings(redirect) {
      $log.debug('Saving settings to local storage');
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
      }
    }


    // autoload
    loadSettings();
    readLogs();

    // public methods
    $scope.load = loadSettings;
    $scope.save = function () {
      saveSettings(true);
    };
    $scope.sync = function () {
      saveSettings(false);
      syncWithServer();
    };
    $scope.showLogs = readLogs;
    $scope.clearLogs = clearLogDB;
    $scope.emailLogs = emailLogs;
    $scope.filterLogs = function () {
      if ($scope.logging.selectedLogLevel) {
        $ionicLoading.show();
        var logLevel = $scope.logging.selectedLogLevel.logLevel;
        logService.readLogData(logLevel).then(function (logData) {
          $scope.logs = logData;
          $ionicLoading.hide();
        }, function () {
          $ionicLoading.hide();
        });
      } else {
        readLogs();
      }
    };
  }
);
