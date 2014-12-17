var dbLog = angular.module('dbLog', []);

/**
 * @ngdoc service
 * @name logService
 * @module dbLog
 * @description Provides logging service in browser db.
 */
dbLog.provider('logService', function LogServiceProvider() {
    var debug = false,
        trace,
        dbName,
        $log, $q;

    /**
     * @ngdoc function
     * @name logService#enableDebugLogging
     *
     * @param {boolean} value to configure if debug entries should be logged
     */
    this.enableDebugLogging = function(value) {
        debug = !!value;
    };
    /**
     * @ngdoc function
     * @name logService#enableTraceLogging
     *
     * @param {boolean} valuee to configure if trace entries should be logged
     */
    this.enableTraceLogging = function(value) {
        trace = !!value;
    };
    /**
     * @ngdoc function
     * @name logService#dbName
     *
     * @param {string} name of the database
     */
    this.dbName = function(name) {
        dbName = name;
    };

    var getDB = function() {
        var logDB = new PouchDB(dbName, {
            adapter: 'websql'
        });
        return logDB;
    }
    var writeLogEntry = function(pLogLevel, pMessage) {
        var timestamp = new Date(),
            db = getDB(),
            logs = [],
            logEntry =   {
                timestamp: timestamp,
                level: pLogLevel,
                details: pMessage
            };
        logs.push(logEntry);
        if (db && db.bulkDocs) {
            db.bulkDocs(logs, function(error, response) {
                if (error) {
                    console.error('Error during writing log entries: ' + error);
                }
            });
        }
    }
    var readLogs = function(pLoglevel) {
        var deferred = q.defer();
        var db = getDB();
        var logs = db.allDocs({
            include_docs: true
        }, function(err, response) {
            if (err) {
                console.error('Error during writing log entries: ' + response);
                deferred.reject(response);
            } else  {
                var logs = [];
                for (var id in response.rows) {
                    var logEntry = response.rows[id].doc;
                    if (pLoglevel) {
                        // filter
                        if (pLoglevel == logEntry.level) {
                            logs.push(logEntry);
                        }
                    } else {
                        // no filter
                        logs.push(logEntry);
                    }
                }
                if (logs.length == 0) {
                    logs = null;
                }
                deferred.resolve(logs);
            }
        });
        return deferred.promise;
    }
    var deleteLogs = function() {
        var deferred = q.defer();
        var db = getDB();
        db.destroy(function(err, response) {
            if (err) {
                console.error('Error during clearing log database: ' + response);
                deferred.reject(response);
            } else  {
                console.info('Sucessfully cleared log database.');
                deferred.resolve(response);
            }
        });
        return deferred.promise;
    }

    this.$get = function LogService($log, $q) {
        log = $log;
        q = $q;
        return {
            readLogData: function(pLoglevel) {
                return readLogs(pLoglevel);
            },
            clearLogData: function() {
                return deleteLogs();
            },
            info: function(pMsg) {
                if (window.cordova) {
                    console.info(pMsg);
                } else {
                    log.info(pMsg);
                }
                writeLogEntry('INFO', pMsg);
            },
            error: function(pMsg) {
                if (window.cordova) {
                    console.error(pMsg);
                } else {
                    log.error(pMsg);
                }
                writeLogEntry('ERROR', pMsg);
            },
            debug: function(pMsg) {
                if (debug) {
                    if (window.cordova) {
                        console.debug(pMsg);
                    } else {
                        log.debug(pMsg);
                    }
                    writeLogEntry('DEBUG', pMsg);
                }
            },
            trace: function(pMsg) {
                if (trace) {
                    if (window.cordova) {
                        console.trace(pMsg);
                    } else {
                        log.info(pMsg);
                    }
                    writeLogEntry('TRACE', pMsg);
                }
            }
        }
    };
});