/**
 * @ngdoc service
 * @name settingsService
 *
 * @module flynnBookScannerApp
 *
 * @description
 * Provides access to the book inventory. Used PouchDB as backend.
 */
app.service('settingsService', ['$rootScope', 'localStorageService', 'logService',

    function($rootScope, localStorage, logService) {
        'use strict';
        return {
            save: function(pConfig) {
                localStorage.remove('flynn_app.settings');
                var config = pConfig;
                config.googleApiKey = 'AIzaSyC8qspKiGBqhXNqkeF6v-D72SrKO-SzCNY';
                config.timeout = 20000;
                localStorage.add('flynn_app.settings', config);
            },
            load: function() {
                logService.debug("Loading settings from local storage");
                var settings = localStorage.get('flynn_app.settings');
                // TODO check settings
                if (settings) {
                    settings.valid = true;
                } else {
                    settings = {};
                    settings.valid = false;
                    settings.activeProfileID = 0;
                    settings.profiles = [];
                    settings.profiles.push({});
                }
                settings.activeProfile = function() {
                    return settings.profiles[settings.activeProfileID];
                }
                $rootScope.settings = settings;
                return settings;
            },
            verify: function() {
                logService.debug("Verifying flynn settings");
                var config = this.load();
                var credentials = config.activeProfile();
                if (credentials.remotesync) {
                    return (credentials && credentials.owner && credentials.user && credentials.password && credentials.couchdb);
                } else {
                    return (credentials && credentials.owner);
                }

            }

        };

    }
]);