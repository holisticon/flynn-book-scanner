var cordova,
  PouchDB;

describe('main', function() {

  // load the controller's module
  beforeEach(module('flynnBookScannerApp'));

  describe("BookController", function() {

    var fakeFactory, deferred, q,
      controller,
      bookService,
      inventoryService,
      scope,
      httpBackend,
      settings;

    // define the mock book service
    beforeEach(function() {
      inject(function($injector, $controller, $q, $rootScope) {
        q = $q;
        scope = $rootScope;
        PouchDB = function(dbname) {

          return {
            allDocs: function() {
              return [];
            }
          }
        };
        var books = [{
          "kind": "books#volumes",
          "totalItems": 77,
          "items": [{
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
            }
          }]
        }];
        bookService = {
          search: function(searchQuery) {
            var deferred = $q.defer();
            var response = {};
            response.books = books;
            deferred.resolve(response);
            return deferred.promise;
          }
        }
        inventoryService = {
          read: function() {
            var deferred = $q.defer();
            var response = {};
            response.books = books;
            deferred.resolve(response);
            return deferred.promise;
          }
        }
      });
    });

    // Initialize the controller and a mock scope
    beforeEach(inject(function($rootScope, $controller, GoogleBookService, InventoryService, $q, $httpBackend) {
      scope = $rootScope.$new();
      q = $q;
      httpBackend = $httpBackend;
      controller = $controller("BookController", {
        $scope: scope,
        GoogleBookService: bookService,
        InventoryService: inventoryService
      });
    }));

    it('Init module failed', function() {
      expect(true).toBe(true);
    });

    it('do empty search', function() {
      scope.searchQuery = null;
      scope.search();
    });

    it('do isbn search - update existing', function() {
      httpBackend.when('GET', 'book_modal.html').respond('');
      httpBackend.when('GET', 'views/navbarView.html').respond('');
      scope.searchQuery = {};
      scope.searchQuery.isbn = "9783898646123";
      scope.search();
      scope.$apply();
      expect(scope.books.length).toEqual(1);
    });

    it('do isbn search - add new', function() {
      httpBackend.when('GET', 'book_modal.html').respond('');
      httpBackend.when('GET', 'views/navbarView.html').respond('');
      scope.searchQuery = {};
      scope.searchQuery.isbn = "9783898646123";
      scope.search();
      scope.$apply();
      expect(scope.books.length).toEqual(1);
    });
  });
});