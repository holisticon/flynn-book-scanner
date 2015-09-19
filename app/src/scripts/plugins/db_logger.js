var dbLog = angular.module('dbLog', []);

function getDB(pDbName) {
  'use strict';

  var logDB;
  if (!logDB) {
    if (typeof cordova != 'undefined' && cordova.platformId === 'android') {
      // for performance use indexedDB on Android
      logDB = new PouchDB(pDbName, {
        adapter: 'idb'
      });
    } else {
      // default use websql
      logDB = new PouchDB(pDbName, {
        adapter: 'websql'
      });
    }
  }
  return logDB;
}


/**
 * @ngdoc service
 * @name logService
 * @module dbLog
 * @description Provides access to logging db.
 */
dbLog.provider('logService', function LogServiceProvider() {
  'use strict';

  var q, logger, logConfig;
  var readLogs = function (pLoglevel) {
    var deferred = q.defer(),
      db = getDB(logConfig.dbName);
    db.allDocs({
      include_docs: true
    }, function (err, response) {
      if (err) {
        console.error('Error during writing log entries: ' + response);
        deferred.reject(response);
      } else {
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
        if (logs.length === 0) {
          logs = null;
        }
        deferred.resolve(logs);
      }
    });
    return deferred.promise;
  };
  var deleteLogs = function () {
    var deferred = q.defer();
    var db = getDB(logConfig.dbName);
    db.destroy(function (err, response) {
      if (err) {
        console.error('Error during clearing log database: ' + response);
        deferred.reject(response);
      } else {
        console.info('Sucessfully cleared log database.');
        deferred.resolve(response);
      }
    });
    return deferred.promise;
  };

  this.$get = function LogService($q, $log) {
    q = $q;
    logger = $log;
    logConfig = logger.getConfig();
    return {
      readLogData: function (pLoglevel) {
        return readLogs(pLoglevel);
      },
      clearLogData: function () {
        return deleteLogs();
      }
    };
  };
});

/**
 * @ngdoc service
 * @name logger
 * @module dbLog
 * @description Provides logging service in browser db.
 */
dbLog.provider('logger', function loggerProvider() {
  'use strict';

  var config = {},
    log;
  config.debug = false;
  config.outputOnly = false;
  config.trace = false;
  config.dbName = 'log';

  /**
   * @ngdoc function
   * @name logService#outputOnly
   *
   * @param {boolean} value to write to console only and not write to database (useful for testing)
   */
  this.outputOnly = function (value) {
    config.outputOnly = !!value;
  };

  /**
   * @ngdoc function
   * @name logService#debugLogging
   *
   * @param {boolean} value to configure if debug entries should be logged
   */
  this.debugLogging = function (value) {
    config.debug = !!value;
  };
  /**
   * @ngdoc function
   * @name logService#traceLogging
   *
   * @param {boolean} value to configure if trace entries should be logged
   */
  this.traceLogging = function (value) {
    config.trace = !!value;
  };
  /**
   * @ngdoc function
   * @name logService#dbName
   *
   * @param {string} name of the database
   */
  this.dbName = function (name) {
    config.dbName = name;
  };
  var writeLogEntry = function (pLogLevel, pArguments) {
    var message = pArguments[0];
    if (!config.outputOnly) {
      var timestamp = new Date(),
        db = getDB(config.dbName),
        logEntry = {
          timestamp: timestamp,
          level: pLogLevel,
          details: '' + message
        };
      if (db && db.bulkDocs) {
        logEntry._id = '' + timestamp.getTime();
        db.put(logEntry, function (error) {
          if (error) {
            log.error('Error during writing log entry: ' + error);
          }
        });
      }
    }
  };
  this.$get = function Logger($delegate) {
    log = $delegate;
    return {
      getConfig: function () {
        return config;
      },
      log: function () {
        log.info(arguments);
        writeLogEntry('INFO', arguments);
      },
      warn: function () {
        log.warn(arguments);
        writeLogEntry('TRACE', arguments);
      },
      info: function () {
        log.info(arguments);
        writeLogEntry('INFO', arguments);
      },
      error: function () {
        log.error(arguments);
        writeLogEntry('ERROR', arguments);
      },
      debug: function () {
        if (config.debug) {
          log.debug(arguments);
          writeLogEntry('DEBUG', arguments);
        }
      },
      trace: function () {
        if (config.trace) {
          log.trace(arguments);
          writeLogEntry('TRACE', arguments);
        }
      }
    };
  };
});
