// declare namespace
var ngFlynnApp = ngFlynnApp || {};// jshint ignore:line

/**
 * @ngdoc function
 * @name errorDialogClosed
 * @description Called after error dialog is closed.
 * @param {object} root scope
 * @param {object} current scope
 * @param {object} reference to log service
 */
ngFlynnApp.errorDialogClosed = function ($rootScope, $scope, log) {// jshint ignore:line
  'use strict';

  log.debug('Error dialog closed.');
};

/**
 * @ngdoc function
 * @name showErrorDialog
 * @description Shows up the error dialog with the given error details
 * @param {object} root scope
 * @param {object} current scope
 * @param {object} reference to loading indicator
 * @param {object} reference to log service
 * @param {object} title to use
 * @param {object} error code to use
 * @param {object} message to display
 */
ngFlynnApp.showErrorDialog = function ($rootScope, $scope, $ionicLoading, log, errorTitle, errorCode, errorDetails) { // jshint ignore:line
  'use strict';

  $ionicLoading.show();
  if (navigator.notification) {
    navigator.notification.alert(errorCode + '\n' + errorDetails, ngFlynnApp.errorDialogClosed($rootScope, $scope, log), 'Error - ' + errorTitle);
  } else {
    window.alert(errorCode + '\n' + errorDetails);
    ngFlynnApp.errorDialogClosed($rootScope, $scope, log);
  }
  $ionicLoading.hide();
};


/**
 * @ngdoc function
 * @name isMobileDevice
 * @description returns true if running on a mobile device, otherwise false
 */
ngFlynnApp.isMobileDevice = function () {
  'use strict';

  if (window.cordova) {
    return true;
  } else {
    return false; //this is the browser
  }
};

/**
 * @ngdoc function
 * @name openExternalLink
 * @param {string} url to open
 * @description open external url in browser app on mobile device, otherwise in a new tab on desktop device
 */
ngFlynnApp.openExternalLink = function (pUrl) { // jshint ignore:line
  'use strict';

  if (ngFlynnApp.isMobileDevice()) {
    window.open(pUrl, '_system', 'location=yes');
  } else {
    window.open(pUrl, '_blank');
  }
};

/**
 * @ngdoc function
 * @name handleOpenURL
 * @description redirect app url handler to app
 */
function handleOpenURL(url) { // jshint ignore:line
  'use strict';

  setTimeout(function () {
    if (url.toLowerCase().search('flynnapp') > -1) {
      var type = url.substring(url.indexOf('//') + 2, url.indexOf('?')),
        params = url.substring(url.indexOf('?') + 1).split('&');
      // create JSON object
      var args = {};
      for (var i = 0, len = params.length; i < len; i++) {
        var paramData = params[i].split('=');
        args[paramData[0]] = paramData[1];
      }
      // get Angular scope from the known DOM element
      var scope = angular.element(document.body).scope();
      // broadcast URL data
      switch (type) {
        case 'config':
          scope.$root.$broadcast('settings.handleURL', args);
          break;
      }
    }
  }, 0);
}

ngFlynnApp.configureLogging = function (loggerProvider, config) {
  'use strict';

  if (config) {
    loggerProvider.dbName('flynnDB_logs');
    loggerProvider.outputOnly(!config.dbLogging);
    loggerProvider.debugLogging(config.debug);
    if (config.debug) {
      // enable couchDB debug
      PouchDB.debug.enable('*');
      PouchDB.debug.enable('pouchdb:find');
    } else {
      PouchDB.debug.disable();
      PouchDB.debug.disable('pouchdb:find');
    }
    loggerProvider.traceLogging(config.trace);
  }
};

/**
 * @ngdoc function
 * @name onDeviceReady
 * @description Called after device is ready to use
 */
ngFlynnApp.onDeviceReady = function () {
  'use strict';

  var $http = angular.injector(['ng']).get('$http'),
    settingsLS = localStorage['ls.flynn_app.settings'];
  $http.get('config.json').success(function (data, status, headers, config) {
    var appConf;
    if (settingsLS) {
      var settings = JSON.parse(settingsLS);
      if (settings.appConfig) {
        appConf = settings.appConfig;
        // overwrite if needed
        if (data.overwrite) {
          for (var configEntry in data.config) {
            appConf[configEntry] = data.config[configEntry];
          }
          appConf.update = true;
        }
      } else {

        // without settings use template from config.json
        appConf = data.config;
      }
    } else {
      // without settings use template from config.json
      appConf = data.config;
    }
    app.constant('APP_CONFIG', appConf);
    app.constant('APP_INFO', data.info);
    if (config.dev === true) {
      navigator.notification.alert('Running in dev mode!', null, 'Info');
    }
    // bootstrap app:
    angular.bootstrap(document.body, ['flynnBookScannerApp']);

  }).error(function (data, status, headers, config) { // jshint ignore:line
    console.error('Did not get valid config.json file.');
    navigator.notification.alert('Server did not show valid response.', null, 'Server Error');
  });
};

// on dev fire up event directly
if (ngFlynnApp.isMobileDevice()) {
  document.addEventListener('deviceready', ngFlynnApp.onDeviceReady, false);
} else {
  ngFlynnApp.onDeviceReady();
}

/**
 * @ngdoc object
 * @name app declaration
 * @description  declares flynn app
 * @module flynnBookScannerApp
 */
var app = angular.module('flynnBookScannerApp', [ // jshint ignore:line
  'ui.bootstrap',
  'LocalStorageModule',
  'ngCookies',
  'ngFileUpload',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ngTouch',
  'ionic',
  'dbLog',
  'webWorkerPool'
]);

/**
 * @ngdoc filter
 * @name reverse
 * @module flynnBookScannerApp
 * @description Reverse list in order
 */
app.filter('reverse', function () {
  'use strict';

  return function (items) {
    if (items) {
      return items.slice().reverse();
    } else {
      return;
    }
  };
});

/**
 * @ngdoc filter
 * @name bookFilter
 * @module flynnBookScannerApp
 * @description book filter
 */
app.filter('bookFilter', [function () {
  'use strict';

  /**
   * Search in list for text
   */
  function searchList(pList, pSearchText) {
    for (var i = 0, len = pList.length; i < len; i++) {
      var entry = pList[i].toUpperCase();
      if (entry.indexOf(pSearchText) > -1) {
        return true;
      }
    }
    return false;
  }

  return function (pBooks, pSearchText) {
    if (pSearchText) {
      var found = false,
        filtered,
        searchText = pSearchText.toUpperCase();
      for (var i = 0, len = pBooks.length; i < len; i++) {
        var book = pBooks[i];
        if (book.value.volumeInfo.title.toUpperCase() === searchText) { // matches whole word
          found = true;
        } else {
          if (book.value.volumeInfo.title.toUpperCase().indexOf(searchText) > -1) {
            found = true;
          } else {
            if (book.value.volumeInfo.subtitle && book.value.volumeInfo.subtitle.toUpperCase().indexOf(searchText) > -1) {
              found = true;
            } else {
              if (book.value.volumeInfo.description && book.value.volumeInfo.description.toUpperCase().indexOf(searchText) > -1) {
                found = true;
              } else {
                if (book.value.volumeInfo.publishedDate && book.value.volumeInfo.publishedDate.toString().toUpperCase().indexOf(searchText) > -1) {
                  found = true;
                } else {
                  if (book.value.volumeInfo.authors && searchList(book.value.volumeInfo.authors, searchText)) {
                    found = true;
                  }
                }
              }
            }
          }
        }
        if (found) {
          if (!filtered) {
            filtered = [];
          }
          filtered.push(book);
          // reset
          found = false;
        }
      }

      return filtered;
    } else {
      return pBooks;
    }
  };
}]);

app.filter('unsafe', function ($sce) {
  'use strict';

  return function (val) {
    return $sce.trustAsHtml(val);
  };
});

/**
 * @ngdoc function
 * @name constant
 * @module flynnBookScannerApp
 * @description  Set loading text
 */
app.constant('$ionicLoadingConfig', {
  template: '<ion-spinner></ion-spinner> <br> Loading '
});


/**
 * @ngdoc function
 * @name run
 * @module flynnBookScannerApp
 * @description  init ionic
 */
app.run(function ($ionicPlatform) {
  'use strict';

  $ionicPlatform.ready(function () {
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
    }
  });
});


/**
 * @ngdoc function
 * @name config
 * @module flynnBookScannerApp
 * @description configure app
 */
app.config(function ($urlRouterProvider, $provide, $compileProvider, $httpProvider, $stateProvider, $ionicConfigProvider, webWorkerPoolProvider, loggerProvider, APP_CONFIG) {
  'use strict';

  // fix wp8 cordova errors
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|ghttps?|ms-appx|x-wmapp0):/);
  // limit webworker threads
  webWorkerPoolProvider.workerUrl('scripts/webworker.renderImage.js');
  webWorkerPoolProvider.capacity(4);
  // places them at the bottom for all OS
  $ionicConfigProvider.tabs.position('bottom');
  // makes them all look the same across all OS
  $ionicConfigProvider.tabs.style('standard');
  // configure caching
  $ionicConfigProvider.views.maxCache(5);
  $ionicConfigProvider.templates.maxPrefetch(3);
  // configure logging
  ngFlynnApp.configureLogging(loggerProvider, APP_CONFIG);
  $provide.decorator('$log', ['$delegate', function ($delegate) {
    if (loggerProvider.$get.length > 1) {
      // solve uglify error
      return loggerProvider.$get[1]($delegate);
    } else {
      return loggerProvider.$get($delegate);
    }
  }]);
  // configure routes and states
  $stateProvider
    .state('app', {
      url: '/app',
      templateUrl: 'views/navbarView.html',
      controller: 'AppController'
    })
    .state('app.settings', {
      url: '/settings',
      views: {
        'menuContent': {
          templateUrl: 'views/settingsView.html',
          controller: 'SettingsController'
        }
      }
    })
    .state('app.book_add', {
      url: '/book/add',
      views: {
        'menuContent': {
          templateUrl: 'views/addBookView.html',
          controller: 'BookController'
        }
      }
    })
    .state('app.books', {
      url: '/books',
      views: {
        'menuContent': {
          templateUrl: 'views/booksView.html',
          controller: 'BooksController'
        }
      }
    })
    .state('app.book_show', {
      url: '/book/show/',
      params: {book: null},
      views: {
        'menuContent': {
          templateUrl: 'views/bookView.html',
          controller: 'BookDetailsController'
        }
      }
    })
    .state('app.book_edit', {
      url: '/book/edit/',
      params: {book: null},
      views: {
        'menuContent': {
          templateUrl: 'views/editBookView.html',
          controller: 'BookEditController'
        }
      }
    })
    .state('app.book_upload', {
      url: '/book/upload/',
      params: {book: null},
      views: {
        'menuContent': {
          templateUrl: 'views/uploadView.html',
          controller: 'BookUploadController'
        }
      }
    })
    .state('app.about', {
      url: '/about',
      views: {
        'menuContent': {
          templateUrl: 'views/aboutView.html',
          controller: 'AboutController'
        }
      }
    })
    .state('app.dev', {
      url: '/dev',
      views: {
        'menuContent': {
          templateUrl: 'views/devView.html',
          controller: 'DevController'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app');
  // configure http provider for cross-domain
  $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
});
