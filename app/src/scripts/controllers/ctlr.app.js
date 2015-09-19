/**
 * @ngdoc controller
 * @name AppController
 *
 * @description
 * Controller for the app
 *
 * @module flynnBookScannerApp
 */
app.controller('AppController', function ($scope, $rootScope, $log, $state, $window, $ionicLoading, settingsService) {
    'use strict';

    $ionicLoading.show();
    $rootScope.$on('settings.handleURL', function (event, args) { // jshint ignore:line
      settingsService.handleURL(args);
    });
    $rootScope.$on('settings.updated', function () {
      $window.location.reload(true);
    });
    $rootScope.$on('settings.invalid', function () {
      ngFlynnApp.showErrorDialog($rootScope, $scope, $ionicLoading, $log, 'Settings invalid', 1001, 'Settings seems to be incorrect. Please correct or check network settings.');
    });
    $rootScope.$on('network.offline', function () {
      ngFlynnApp.showErrorDialog($rootScope, $scope, $ionicLoading, $log, 'No network', 1002, 'Network connection seems to be not working. Please try again later.');
    });
    $rootScope.$on('settings.invalidHandleUrl', function () {
      ngFlynnApp.showErrorDialog($rootScope, $scope, $ionicLoading, $log, 'Settings invalid', 1003, 'Settings seems to be incorrect. Server did not respond.');
    });
    $rootScope.$on('server.timeout', function () {
      ngFlynnApp.showErrorDialog($rootScope, $scope, $ionicLoading, $log, 'Timeout', 2001, 'No answer from server');
    });
    $rootScope.$on('sync.remoteError', function () {
      ngFlynnApp.showErrorDialog($rootScope, $scope, $ionicLoading, $log, 'Server error', 1004, 'Server doesn\'t respone with valid answer. Check server backend and/or remote URL.');
    });
    $rootScope.$on('server.error', function () {
      ngFlynnApp.showErrorDialog($rootScope, $scope, $ionicLoading, $log, 'Books couldn\'t be loaded', 2002, 'The server didn\'t respond. Please check your network settings.');
    });
    $rootScope.$on('login.failed', function () {
      ngFlynnApp.showErrorDialog($rootScope, $scope, $ionicLoading, $log, 'Login error', 3001, 'Please check your sync user data.');
    });
    $rootScope.$on('barcode.error', function () {
      ngFlynnApp.showErrorDialog($rootScope, $scope, $ionicLoading, $log, 'Barcode error', 4001, 'Barcode reader not working. Did you enable camera access?');
    });
    $rootScope.$on('booksearch.invalid', function () {
      ngFlynnApp.showErrorDialog($rootScope, $scope, $ionicLoading, $log, 'Book couldn\'t be loaded', 5001, 'The book search wasn\'t successfull. Server didn\'t respond.');
    });
    $rootScope.$on('booksave.error', function () {
      ngFlynnApp.showErrorDialog($rootScope, $scope, $ionicLoading, $log, 'Book couldn\'t be saved', 5101, 'The book save wasn\'t successfull. Server didn\'t respond.');
    });

    $scope.userAgent = navigator.userAgent;

    //  show settings
    var config = settingsService.load();
    if (config && !config.valid) {
      $state.go('app.settings');
    } else {
      $ionicLoading.hide();
      $state.go('app.books');
    }
    $rootScope.settings = config;
  }
);
