var cordova;

describe('main', function() {
	var logger;
	
    beforeEach(function() {
        module(function($provide) {
          $provide.constant('APP_CONFIG', {
            timeout: '10000',
            dev: false,
            debug: true,
          });
        });
      });
	

    beforeEach(module('flynnBookScannerApp'));
    
  describe("BookController", function() {

    var fakeFactory, deferred, q,
      controller,
      mockedBookService,
      mockedInventoryService,
      scope,
      httpBackend,
      settings;

    // define the mock book service
    beforeEach(function() {
      inject(function($injector,$controller, $q, $rootScope,$httpBackend) {
    	  q = $q;
        scope = $rootScope;
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
        mockedBookService = {
          search: function(searchQuery) {
            var deferred = $q.defer();
            var response = {};
            response.books = books;
            deferred.resolve(response);
            return deferred.promise;
          }
        }
        mockedInventoryService = {
          read: function() {
            var deferred = $q.defer();
            var response = {};
            response.books = books;
            deferred.resolve(response);
            return deferred.promise;
          }
        }
      httpBackend = $httpBackend;
      controller = $controller("BookController", {
        $scope: scope,
        googleBookService: mockedBookService,
        inventoryService: mockedInventoryService
      });
    })});

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