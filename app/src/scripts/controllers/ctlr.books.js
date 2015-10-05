/**
 * @ngdoc controller
 * @name BooksController
 * @module flynnBookScannerApp
 *
 * @description
 * Interacts with inventory backend to show up book details
 */
app.controller('BooksController', function ($rootScope, $scope, $state, $filter, $log, $ionicScrollDelegate, $ionicListDelegate, $ionicLoading, $ionicHistory, $http, $ionicModal, $ionicActionSheet, settingsService, inventoryService) {
    'use strict';

    var config = settingsService.load(),
      allBooks;

    function init() {
      initModal();
      $scope.filter = {};
      $scope.filter.selectedOrder = $scope.filterModes[0].value;
      load(true);
      $rootScope.$on('inventory.refresh', function () {
        load(false);
      });
    }

    function initModal() {
      $ionicModal.fromTemplateUrl('filter_modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
      });
      $scope.openModal = function () {
        $scope.modal.show();
      };
      $scope.closeModal = function () {
        $scope.modal.hide();
      };
      //Cleanup the modal when we're done with it!
      $scope.$on('$destroy', function () {
        $scope.modal.remove();
      });
      $scope.filterModes = [{
        label: 'sort by title',
        value: 'value.volumeInfo.title'
      }, {
        label: 'sort by author',
        value: 'authorInfo'
      }];
    }

    function syncWithServer() {
      $ionicLoading.show({
        template: '<ion-spinner></ion-spinner> <br> Syncing books ...'
      });
      inventoryService.syncRemote().then(function () {
        $ionicLoading.hide();
      }, function (error) {
        $ionicLoading.hide();
        if (error.status === 401) {
          $rootScope.$broadcast('login.failed');
        } else {
          $rootScope.$broadcast('settings.invalid');
        }
      });
    }

    /**
     * load data via inventory service
     *
     */
    function load(pDontSync) {
      $ionicLoading.show();
      $scope.searchQuery = {};
      inventoryService.read().then(function (response) {
        if (response.books && response.books.length > 0) {
          allBooks = ngFlynnApp.enrichDbData(response.books);
          $scope.books = ngFlynnApp.enrichDbData(response.books);
          // sync if server was added
          if (config.activeProfile().remotesync && !pDontSync) {
            syncWithServer();
          }
          $ionicScrollDelegate.scrollTop();
          // Stop the ion-refresher from spinning
          $scope.$broadcast('scroll.refreshComplete');
        } else {
          $scope.msg = 'No books found.';
        }
        $ionicLoading.hide();
      }, function () {
        $rootScope.$broadcast('server.error');
        $scope.searchQuery = {};
        $ionicLoading.hide();
      });
    }

    function doSearch() {
      $scope.books = $filter('bookFilter')(allBooks, $scope.searchQuery.fullTextSearch);
    }

    function resetSearch() {
      $scope.searchQuery = {};
      $scope.books = allBooks;
    }

    function removeBook(pBookToRemove) {
      inventoryService.remove(pBookToRemove).then(function () {
        $scope.books.splice($scope.books.indexOf(pBookToRemove), 1);
        $rootScope.$broadcast('inventory.refresh');
        $state.go('app.books', {}, {
          reload: true
        });
      }, function () {
        $ionicLoading.hide();
        $rootScope.$broadcast('server.error');
      });
    }

    function showFilterModal() {
      $scope.openModal();
    }

    function applyFilter() {
      $scope.closeModal();
    }

    function showBookDetails(pBook) {
      $log.debug('Showing details for book: ' + pBook.value.volumeInfo.title);
      $state.go('app.book_show', {'book': pBook});
    }

    function showActionMenu(book) {
      $scope.book = book;
      // Show the action sheet
      $ionicActionSheet.show({
        buttons: [{
          text: '<b>Edit</b>'
        }],
        destructiveText: 'Delete',
        titleText: 'Modify book entry',
        cancelText: 'Cancel',
        cancel: function () {
        },
        buttonClicked: function () {
          $state.go('app.book_edit', {'bookId': book.value.id});
          return true;
        },
        destructiveButtonClicked: function () {
          // TODO move to wrapper
          if (typeof cordova != 'undefined') {
            navigator.notification.confirm('Really remove book ' + $scope.book.value.volumeInfo.title + ' ?', function (buttonIndex) {
              if (buttonIndex === 1) {
                removeBook($scope.book);
              }
              $ionicListDelegate.closeOptionButtons();
            });
          } else {
            if (confirm('Really remove book ' + $scope.book.value.volumeInfo.title + ' ?')) {
              removeBook($scope.book);
              $ionicListDelegate.closeOptionButtons();
            }
          }
          return true;
        }
      });
    }

    init();

    // public methods
    $scope.load = load;
    $scope.showFilterModal = showFilterModal;
    $scope.applyFilter = applyFilter;
    $scope.showBookDetails = showBookDetails;
    $scope.showActionMenu = showActionMenu;
    $scope.resetSearch = resetSearch;
    $scope.doSearch = doSearch;

  }
);
