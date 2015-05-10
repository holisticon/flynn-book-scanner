var cordova;

//load the app module
beforeEach(module('flynnBookScannerApp'));

beforeEach(function() {
  module(function($provide) {
    $provide.constant('APP_CONFIG', {
      timeout: 1000,
      dev: false,
      debug: false
    });
  });
});

describe("inventoryService", function() {

  var service,
    rootScope,
    httpBackend,
    config,
    mockedSettingsService;

  beforeEach(function() {
    config = {
      activeProfile: function() {
        return {
          remotesync: false,
          dbName: 'test_' + new Date().getMilliseconds(),
          timeout: 1000
        };
      }
    };
    module(function($provide) {
      $provide.value('settingsService', {
        load: function() {
          return config;
        }
      });
    });
    inject(function(inventoryService, $httpBackend, $rootScope) {
      service = inventoryService;
      rootScope = $rootScope;
      httpBackend = $httpBackend;
      // mock views, see https://github.com/driftyco/ionic/issues/2927
      httpBackend.when('GET', new RegExp('views/.*')).respond({});
    });
  });

  it('Use Authentication for Sync', function(done) {

    httpBackend.when('GET', 'http://M%C3%BCller:P%40assword!@remote_test/couchdb').respond({
      status: 400
    });
    config = {
      activeProfile: function() {
        return {
          remotesync: true,
          couchdb: 'http://remote_test/couchdb',
          dbName: 'test',
          user: 'Müller',
          password: 'P@assword!'
        }
      }
    };
    service.syncRemote(true).then(function(response) {
      fail();
    }, function(error) {
      done();
    });
    rootScope.$apply();
    httpBackend.flush();
  });
});