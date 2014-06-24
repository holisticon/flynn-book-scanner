'use strict';

function errorDialogClosed($rootScope, $scope, $log) {

}

/**
 * Shows up the error dialog with the given error details
 * @param $rootScope root scope
 * @param $scope current scope
 * @param blockUI reference to remove blockUI
 * @param errorTitle title to use
 * @param errorCode error code to use
 * @param errorDetails message to display
 */
function showErrorDialog($rootScope, $scope, $log, blockUI, errorTitle, errorCode, errorDetails) {
    blockUI.start();
    navigator.notification.alert(errorCode + "\n" + errorDetails, errorDialogClosed($rootScope, $scope, $log), "Error - " + errorTitle);
    blockUI.stop();
}

var app = angular.module('flynnBookScannerApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'blockUI',
    'ngRoute',
    'ngTouch',
    'mobile-angular-ui',
    'LocalStorageModule'
]);

app.config(function($logProvider) {
    $logProvider.debugEnabled(true);
});


app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            redirectTo: '/books',
        }).when('/book', {
            templateUrl: 'views/bookView.html',
            controller: 'BookController'
        }).when('/settings', {
            templateUrl: 'views/settingsView.html',
            controller: 'SettingsController'
        }).when('/books', {
            templateUrl: 'views/booksView.html',
            controller: 'BooksController'
        }).when('/library', {
            templateUrl: 'views/libraryView.html',
            controller: 'BooksController'
        }).otherwise({
            redirectTo: '/book/search'
        });
});

app.config(['$httpProvider',
    function($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
]);

/**
 * Configure blockUI
 */
app.config(function(blockUIConfigProvider) {

    // Change the default overlay message
    blockUIConfigProvider.message('Loading ...');

    // Change the default delay to 50ms before the blocking is visible
    blockUIConfigProvider.delay(50);

});

/**
 * Creates a carousel to allow swipping between entries
 */
app.directive("carouselItem", function($rootScope, $swipe) {
    return function(scope, element, attrs) {
        var startX = null;
        var startY = null;
        var endAction = "cancel";
        var carouselId = element.parent().parent().attr("id");

        var translateAndRotate = function(x, y, z, deg) {
            element[0].style["-webkit-transform"] = "translate3d(" + x + "px," + y + "px," + z + "px) rotate(" + deg + "deg)";
            element[0].style["-moz-transform"] = "translate3d(" + x + "px," + y + "px," + z + "px) rotate(" + deg + "deg)";
            element[0].style["-ms-transform"] = "translate3d(" + x + "px," + y + "px," + z + "px) rotate(" + deg + "deg)";
            element[0].style["-o-transform"] = "translate3d(" + x + "px," + y + "px," + z + "px) rotate(" + deg + "deg)";
            element[0].style["transform"] = "translate3d(" + x + "px," + y + "px," + z + "px) rotate(" + deg + "deg)";
        }

        $swipe.bind(element, {
            start: function(coords) {
                startX = coords.x;
                startY = coords.y;
            },

            cancel: function(e) {
                translateAndRotate(0, 0, 0, 0);
                e.stopPropagation();
            },

            end: function(coords, e) {
                if (endAction == "prev") {
                    $rootScope.carouselPrev(carouselId);
                } else if (endAction == "next") {
                    $rootScope.carouselNext(carouselId);
                }
                translateAndRotate(0, 0, 0, 0);
                e.stopPropagation();
            },

            move: function(coords) {
                if (startX != null) {
                    var deltaX = coords.x - startX;
                    var deltaXRatio = deltaX / element[0].clientWidth;
                    if (deltaXRatio > 0.3) {
                        endAction = "next";
                    } else if (deltaXRatio < -0.3) {
                        endAction = "prev";
                    }
                    translateAndRotate(deltaXRatio * 200, 0, 0, deltaXRatio * 15);
                }
            }
        });
    }
});


/**
 * Controller for the app.
 */
app.controller('MainController', ['$scope', '$rootScope', '$location', 'blockUI', 'SettingsService', 'LogService',
    function($scope, $rootScope, $location, blockUI, $settings, $log) {

        $rootScope.$on("$routeChangeStart", function() {
            blockUI.start();
        });
        $rootScope.$on("$routeChangeSuccess", function() {
            blockUI.stop();
        });

        $rootScope.$on('settings.invalid', function(event) {
            showErrorDialog($rootScope, $scope, $log, blockUI, "Settings invalid", 1001, "Settings seems to be incorrect. Please correct or check network settings.");
        });

        $rootScope.$on('server.timeout', function(event) {
            showErrorDialog($rootScope, $scope, $log, blockUI, "Timeout", 2001, "No answer from server");
        });

        $rootScope.$on('server.error', function(event) {
            showErrorDialog($rootScope, $scope, $log, blockUI, "Books couldn't be loaded", 2002, "The server didn't respond. Please check your network settings.");
        });

        $rootScope.$on('login.failed', function(event) {
            showErrorDialog($rootScope, $scope, $log, blockUI, "Settings incorrect", 3001, "Please check your settings");
        });

        $rootScope.$on('barcode.error', function(event) {
            showErrorDialog($rootScope, $scope, $log, blockUI, "Barcode error", 4001, "Barcode reader not working. Did you enable camera access?");
        });

        $rootScope.$on('booksearch.invalid', function(event) {
            showErrorDialog($rootScope, $scope, $log, blockUI, "Book couldn't be loaded", 5001, "The book search wasn't successfull. Server didn't respond.");
        });

        $rootScope.$on('booksave.error', function(event) {
            showErrorDialog($rootScope, $scope, $log, blockUI, "Book couldn't be saved", 5101, "The book save wasn't successfull. Server didn't respond.");
        });

        $scope.userAgent = navigator.userAgent;

        //  show settings 
        var settings = $settings.load();
        if (settings && !settings.valid) {
            //timeout of 30 seconds
            settings.timeout = 30000;
            blockUI.stop();
            $location.path("/settings");
        } else {
            blockUI.stop();
        }
        $rootScope.settings = settings;
    }
]);