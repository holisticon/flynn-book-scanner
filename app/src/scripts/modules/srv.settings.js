/**
 * @ngdoc service
 * @name settingsService
 *
 * @module flynnBookScannerApp
 *
 * @description
 * Provides access to the book inventory. Used PouchDB as backend.
 */
app.service('settingsService', ['$rootScope', '$log', 'localStorageService', 'APP_CONFIG',
    function($rootScope, $log, localStorage, APP_CONFIG) {
        'use strict';

        function saveSettings(pConfig) {
            localStorage.remove('flynn_app.settings');
            var config = pConfig;
            localStorage.add('flynn_app.settings', config);
        }
        return {
            save: saveSettings,
            load: function() {
                $log.debug('Loading settings from local storage');
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
                if (!settings.timeout) {
                    settings.timeout = APP_CONFIG.timeout;
                    saveSettings(settings);
                }
                if (!settings.googleApiKey) {
                    settings.googleApiKey = APP_CONFIG.googleApiKey;
                    saveSettings(settings);
                }
                settings.activeProfile = function() {
                    return settings.profiles[settings.activeProfileID];
                };
                $rootScope.settings = settings;
                return settings;
            },
            verify: function() {
                $log.debug('Verifying flynn settings');
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