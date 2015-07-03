/**
 * @ngdoc service
 * @name settingsService
 *
 * @module flynnBookScannerApp
 *
 * @description
 * Provides access to the book inventory. Used PouchDB as backend.
 */
app.service('settingsService', ['$rootScope', '$log', '$http', 'localStorageService', 'APP_CONFIG',
    function($rootScope, $log, $http, localStorage, APP_CONFIG) {
        'use strict';

        function saveSettings(pConfig) {
            localStorage.remove('flynn_app.settings');
            var config = pConfig;
            if (!config.appConfig || APP_CONFIG.update) {
                config.appConfig = APP_CONFIG;
            }
            localStorage.add('flynn_app.settings', config);
        }

        function loadSettings() {
            $log.debug('Loading settings from local storage');
            var settings = localStorage.get('flynn_app.settings');
            if (settings) {
                // validate settings
                if (settings.profiles && settings.profiles[settings.activeProfileID]) {
                    var activeProfile = settings.profiles[settings.activeProfileID];
                    if (activeProfile.dbName) {
                        settings.valid = true;
                    } else {
                        settings.valid = false;
                    }
                    if (activeProfile.remotesync) {
                        if (activeProfile.user && activeProfile.password) {
                            settings.valid = true;
                        } else {
                            settings.valid = false;
                        }
                    }
                } else {
                    settings.valid = false;
                }
            } else {
                settings = {};
                settings.valid = false;
                settings.appConfig = APP_CONFIG;
                settings.activeProfileID = 0;
                settings.profiles = [];
                settings.profiles.push({});
            }
            settings.activeProfile = function() {
                return settings.profiles[settings.activeProfileID];
            };
            $rootScope.settings = settings;
            return settings;
        }

        function parseJSON(pStringValue) {
            return (pStringValue === 'false' || pStringValue === 'true') ? JSON.parse(pStringValue) : pStringValue;
        }


        function overwriteConfig(pCurrentConfig, pConfig) {
            var updatedConfig = pCurrentConfig;
            updatedConfig.valid = false;
            $log.debug('Overwriting profile data');
            // if (Array.isArray(pConfig)) {
            for (var property in pConfig) {
                switch (property) {
                    case 'profiles':
                        for (var profileProperty in pConfig.profiles[0]) {
                            if (!pCurrentConfig.profiles) {
                                updatedConfig.profiles = [];
                            }
                            updatedConfig.profiles[0][profileProperty] = parseJSON(decodeURIComponent(pConfig.profiles[0][profileProperty]));
                        }
                        break;
                    case 'appConfig':
                        for (var appConfProperty in pConfig.appConfig) {
                            updatedConfig.appConfig[appConfProperty] = parseJSON(decodeURIComponent(pConfig.appConfig[appConfProperty]));
                        }
                        break;
                    default:
                        updatedConfig[property] = parseJSON(pConfig[property]);
                        break;
                }
            }
            // } else {
            //    updatedConfig = pConfig;
            //}
            $log.debug('Saving overwrite profile data');
            saveSettings(updatedConfig);
            $rootScope.$broadcast('settings.updated');
        }

        function handleURL(pConfig) {
            $log.debug('Handling URL config data');
            var currentSettings = loadSettings();
            if (pConfig.url) {
                $log.debug('loading profile data from remote URL');
                $http({
                    method: 'GET',
                    url: pConfig.url,
                    timeout: 2000
                }).success(function(data, status, headers, config) {
                    if (status === 200) {
                        overwriteConfig(currentSettings, data);
                    } else {
                        $log.error('Could not read remote profile data.');
                        $rootScope.$broadcast('settings.invalidHandleUrl', args);
                    }
                }).error(function(data, status, headers, config) {
                    $log.error('Could not read remote profile data.');
                    $rootScope.$broadcast('settings.invalidHandleUrl', args);
                });
            } else {
                if (pConfig.profile) {
                    $log.debug('Using passed URL data');
                    overwriteConfig(currentSettings, {
                        profiles: [pConfig]
                    });
                } else {
                    $log.debug('Using passed URL data');
                    overwriteConfig(currentSettings, {
                        appConfig: pConfig
                    });
                }
            }
        }
        return {
            handleURL: handleURL,
            save: saveSettings,
            load: loadSettings,
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