'use strict';

var cordova;// jshint ignore:line

//load the app module
beforeEach(module('flynnBookScannerApp'));

describe('inventoryService', function () {

  var service,
    rootScope,
    httpBackend,
    config;

  beforeEach(function () {
    config = {
      activeProfile: function () {
        return {
          remotesync: false,
          dbName: 'test_' + new Date().getMilliseconds(),
          appConfig: {
            timeout: 1000,
            dev: false,
            debug: false
          }
        };
      }
    };
    module(function ($provide) {
      $provide.value('settingsService', {
        load: function () {
          return config;
        }
      });
    });
    inject(function (inventoryService, $httpBackend, $rootScope) {
      service = inventoryService;
      rootScope = $rootScope;
      httpBackend = $httpBackend;
      // mock views, see https://github.com/driftyco/ionic/issues/2927
      httpBackend.when('GET', new RegExp('views/.*')).respond({});
    });
  });

  it('should use Authentication for Sync', function (done) {

    httpBackend.when('GET', 'http://M%C3%BCller:P%40assword!@remote_test/couchdb').respond({
      status: 400
    });
    config = {
      activeProfile: function () {
        return {
          remotesync: true,
          couchdb: 'http://remote_test/couchdb',
          dbName: 'test',
          user: 'Müller',
          password: 'P@assword!',
          appConfig: {
            timeout: 100,
            dev: false,
            debug: false,
            sync: {}
          }
        };
      }
    };
    service.syncRemote(true).then(function () {
      fail();// jshint ignore:line
    }, function () {
      done();
    });
    rootScope.$apply();
    httpBackend.flush();
  });

  it('should save book', function (done) {
    httpBackend.when('GET', 'http://M%C3%BCller:P%40assword!@remote_test/couchdb').respond({
      status: 400
    });
    var book = {
      value: {
        id: 'book_' + new Date().getMilliseconds(),
        volumeInfo: {
          title: 'test'
        }
      }
    };

    service.save(book).then(function () {
      done();
    });
    rootScope.$apply();
    httpBackend.flush();
  });

  it('should save ebook for book', function (done) {
    httpBackend.when('GET', 'http://M%C3%BCller:P%40assword!@remote_test/couchdb').respond({
      status: 400
    });
    var book = {
      value: {
        id: 'book_' + new Date().getMilliseconds(),
        volumeInfo: {
          title: 'test'
        }
      },
      ebook: {
        'content_type': 'image/png',
        data: new Blob()
      }
    };
    rootScope.$apply(function () {
      service.save(book).then(function () {
        service.updateIndex();
        //  wait for index update
        setTimeout(function () {
          service.read().then(function (foundBook) {
            expect(foundBook).toBeDefined();
            done();
          });
        }, 500);
      });
    });
  });
});
