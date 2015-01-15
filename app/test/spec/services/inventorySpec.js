var cordova;

// load the controller's module


describe("inventoryService", function() {
  beforeEach(function() {
    module(function($provide) {
      $provide.constant('APP_CONFIG', {
        timeout: '10000',
        dev: false,
        debug: true,
      });
    });
  });
  var service,
    rootScope,
    httpBackend,
    config,
    mockedSettingsService;

  beforeEach(module('flynnBookScannerApp'));

  beforeEach(function() {
    //  new PouchDB('test').destroy(function(err, info) { });
    config = {
      activeProfile: function() {
        return {
          remotesync: false,
          dbName: 'test',
        }
      }
    };
    module(function($provide) {
      $provide.value('settingsService', {
        load: function() {
          return config;
        }
      });
    })
    inject(function(inventoryService, $httpBackend, $rootScope) {
      service = inventoryService;
      rootScope = $rootScope;
      httpBackend = $httpBackend;
      // mock views, see https://github.com/driftyco/ionic/issues/2927
      httpBackend.when('GET', new RegExp('views/.*')).respond({});
    })
  });

  it('Read empty inventory', function(done) {
    new PouchDB(config.activeProfile().dbName).destroy(function(err, info) {
      var promise = service.read(),
        books = null;
      promise.then(function(response) {
        expect(response.books).toBeNull();
        done();
      });
      rootScope.$apply();
    });
  });

  it('Save inventory', function(done) {
    var books = null,
      validBookEntry = {
        "kind": "books#volume",
        "id": "lwz8ZwEACAAJ",
        "etag": "b3Rk7DgfRR8",
        "selfLink": "https://www.googleapis.com/books/v1/volumes/lwz8ZwEACAAJ",
        "volumeInfo": {
          "title": "EJB 3.1 professionell",
          "subtitle": "Grundlagen- und Expertenwissen zu Enterprise JavaBeans 3.1 - inkl. JPA 2.0",
          "publishedDate": "2011",
          "industryIdentifiers": [{
            "type": "ISBN_10",
            "identifier": "3898646122"
          }, {
            "type": "ISBN_13",
            "identifier": "9783898646123"
          }],
          "readingModes": {
            "text": false,
            "image": false
          },
          "pageCount": 592,
          "printType": "BOOK",
          "contentVersion": "preview-1.0.0",
          "language": "de",
          "previewLink": "http://books.google.de/books?id=lwz8ZwEACAAJ&dq=:isbn%3D3898646122&hl=&cd=1&source=gbs_api",
          "infoLink": "http://books.google.de/books?id=lwz8ZwEACAAJ&dq=:isbn%3D3898646122&hl=&source=gbs_api",
          "canonicalVolumeLink": "http://books.google.de/books/about/EJB_3_1_professionell.html?hl=&id=lwz8ZwEACAAJ"
        }
      };
    var bookToSave = {
      value: validBookEntry
    }
    new PouchDB(config.activeProfile().dbName).destroy(function(err, info) {
      service.save(bookToSave).then(function(response) {
        books = response.books;
        expect(books.length).toEqual(1);
        service.remove(bookToSave).then(function(response) {
          done();
        });
      });
      rootScope.$apply();
    })
  });

  it('remove book in inventory', function(done) {
    var books = null,
      validBookEntry = {
        "kind": "books#volume",
        "id": "lwz8ZwEACAAJ",
        "etag": "b3Rk7DgfRR8",
        "selfLink": "https://www.googleapis.com/books/v1/volumes/lwz8ZwEACAAJ",
        "volumeInfo": {
          "title": "EJB 3.1 professionell",
          "subtitle": "Grundlagen- und Expertenwissen zu Enterprise JavaBeans 3.1 - inkl. JPA 2.0",
          "publishedDate": "2011",
          "industryIdentifiers": [{
            "type": "ISBN_10",
            "identifier": "3898646122"
          }, {
            "type": "ISBN_13",
            "identifier": "9783898646123"
          }],
          "readingModes": {
            "text": false,
            "image": false
          },
          "pageCount": 592,
          "printType": "BOOK",
          "contentVersion": "preview-1.0.0",
          "language": "de",
          "previewLink": "http://books.google.de/books?id=lwz8ZwEACAAJ&dq=:isbn%3D3898646122&hl=&cd=1&source=gbs_api",
          "infoLink": "http://books.google.de/books?id=lwz8ZwEACAAJ&dq=:isbn%3D3898646122&hl=&source=gbs_api",
          "canonicalVolumeLink": "http://books.google.de/books/about/EJB_3_1_professionell.html?hl=&id=lwz8ZwEACAAJ"
        }
      };
    var bookToSave = {
      value: validBookEntry
    }
    new PouchDB(config.activeProfile().dbName).destroy(function(err, info) {
      service.save(bookToSave).then(function(response) {
        expect(response.books.length).toEqual(1);
        service.remove(bookToSave).then(function(response) {
          service.read().then(function(readResponse) {
            expect(readResponse.books).toBeNull();
            done();
          });
        });
      });
      rootScope.$apply();
    });
  });

  it('increase amount in inventory', function(done) {
    var books = null,
      validBookEntry = {
        "kind": "books#volume",
        "id": "lwz8ZwEACAAJ",
        "etag": "b3Rk7DgfRR8",
        "selfLink": "https://www.googleapis.com/books/v1/volumes/lwz8ZwEACAAJ",
        "volumeInfo": {
          "title": "EJB 3.1 professionell",
          "subtitle": "Grundlagen- und Expertenwissen zu Enterprise JavaBeans 3.1 - inkl. JPA 2.0",
          "publishedDate": "2011",
          "industryIdentifiers": [{
            "type": "ISBN_10",
            "identifier": "3898646122"
          }, {
            "type": "ISBN_13",
            "identifier": "9783898646123"
          }],
          "readingModes": {
            "text": false,
            "image": false
          },
          "pageCount": 592,
          "printType": "BOOK",
          "contentVersion": "preview-1.0.0",
          "language": "de",
          "previewLink": "http://books.google.de/books?id=lwz8ZwEACAAJ&dq=:isbn%3D3898646122&hl=&cd=1&source=gbs_api",
          "infoLink": "http://books.google.de/books?id=lwz8ZwEACAAJ&dq=:isbn%3D3898646122&hl=&source=gbs_api",
          "canonicalVolumeLink": "http://books.google.de/books/about/EJB_3_1_professionell.html?hl=&id=lwz8ZwEACAAJ"
        }
      };
    var bookToSave = {
      value: validBookEntry
    }
    new PouchDB(config.activeProfile().dbName).destroy(function(err, info) {
      service.save(bookToSave).then(function(response) {
        books = response.books;
        expect(books.length).toEqual(1);
        var updatedEntry = {
          count: 4,
          value: validBookEntry
        }
        service.save(updatedEntry).then(function(saveResponse) {
          service.read().then(function(readResponse) {
            expect(readResponse.books.length).toEqual(4);
            service.remove(updatedEntry).then(function(response) {
              done();
            });
          });
        });
      });
      rootScope.$apply();
    });
  });


  it('Reduce amount in inventory', function(done) {
    var books = null,
      validBookEntry = {
        "kind": "books#volume",
        "id": "lwz8ZwEACAAJ",
        "etag": "b3Rk7DgfRR8",
        "selfLink": "https://www.googleapis.com/books/v1/volumes/lwz8ZwEACAAJ",
        "volumeInfo": {
          "title": "EJB 3.1 professionell",
          "subtitle": "Grundlagen- und Expertenwissen zu Enterprise JavaBeans 3.1 - inkl. JPA 2.0",
          "publishedDate": "2011",
          "industryIdentifiers": [{
            "type": "ISBN_10",
            "identifier": "3898646122"
          }, {
            "type": "ISBN_13",
            "identifier": "9783898646123"
          }],
          "readingModes": {
            "text": false,
            "image": false
          },
          "pageCount": 592,
          "printType": "BOOK",
          "contentVersion": "preview-1.0.0",
          "language": "de",
          "previewLink": "http://books.google.de/books?id=lwz8ZwEACAAJ&dq=:isbn%3D3898646122&hl=&cd=1&source=gbs_api",
          "infoLink": "http://books.google.de/books?id=lwz8ZwEACAAJ&dq=:isbn%3D3898646122&hl=&source=gbs_api",
          "canonicalVolumeLink": "http://books.google.de/books/about/EJB_3_1_professionell.html?hl=&id=lwz8ZwEACAAJ"
        }
      };
    var bookToSave = {
      count: 4,
      value: validBookEntry
    }
    new PouchDB(config.activeProfile().dbName).destroy(function(err, info) {
      service.save(bookToSave).then(function(response) {
        books = response.books;
        expect(books.length).toEqual(4);
        var updatedEntry = {
          count: 1,
          value: validBookEntry
        }
        service.save(updatedEntry).then(function(saveResponse) {
          service.read().then(function(readResponse) {
            expect(readResponse.books.length).toEqual(1);
            done();
          });
        });
      });
      rootScope.$apply();
    });
  });
});