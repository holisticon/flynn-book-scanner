var cordova;

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
      inject(function(GoogleBookService,InventoryService, $q, $rootScope) {
        q = $q;
        deferred = $q.defer();
        scope = $rootScope;
        bookService = GoogleBookService;
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
        inventoryService = InventoryService;
        var response = {};
        response.books = books;
        deferred.resolve(response);
        spyOn(bookService, 'search').andReturn(deferred.promise);
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
      httpBackend.when("GET", "undefined/_design/books/_view/all").respond({"id":"e1f8351fa02fa6482ec59af84900191c","key":null,"value":{"_id":"e1f8351fa02fa6482ec59af84900191c","_rev":"2-322e0ccef85eca8b4f77a6a111073e7d","kind":"books#volume","id":"lwz8ZwEACAAJ","etag":"b3Rk7DgfRR8","selfLink":"https://www.googleapis.com/books/v1/volumes/lwz8ZwEACAAJ","volumeInfo":{"title":"EJB 3.1 professionell","subtitle":"Grundlagen- und Expertenwissen zu Enterprise JavaBeans 3.1 - inkl. JPA 2.0","publishedDate":"2011","industryIdentifiers":[{"type":"ISBN_10","identifier":"3898646122"},{"type":"ISBN_13","identifier":"9783898646123"}],"readingModes":{"text":false,"image":false},"pageCount":592,"printType":"BOOK","contentVersion":"preview-1.0.0","language":"de","previewLink":"http://books.google.de/books?id=lwz8ZwEACAAJ&dq=:isbn%3D3898646122&hl=&cd=1&source=gbs_api","infoLink":"http://books.google.de/books?id=lwz8ZwEACAAJ&dq=:isbn%3D3898646122&hl=&source=gbs_api","canonicalVolumeLink":"http://books.google.de/books/about/EJB_3_1_professionell.html?hl=&id=lwz8ZwEACAAJ"},"saleInfo":{"country":"DE","saleability":"NOT_FOR_SALE","isEbook":false},"accessInfo":{"country":"DE","viewability":"NO_PAGES","embeddable":false,"publicDomain":false,"textToSpeechPermission":"ALLOWED","epub":{"isAvailable":false},"pdf":{"isAvailable":false},"webReaderLink":"http://books.google.de/books/reader?id=lwz8ZwEACAAJ&hl=&printsec=frontcover&output=reader&source=gbs_api","accessViewStatus":"NONE","quoteSharingAllowed":false},"count":42,"authorInfo":""}});
      scope.searchQuery = {};
      scope.searchQuery.isbn = "9783898646123";
      scope.search();
      scope.$apply();
      httpBackend.flush();
      expect(scope.books.length).toEqual(1);
    });

    it('do isbn search - add new', function() {
      httpBackend.when("GET", "undefined/_design/books/_view/all").respond({});
      scope.searchQuery = {};
      scope.searchQuery.isbn = "9783898646123";
      scope.search();
      scope.$apply();
      httpBackend.flush();
      expect(scope.books.length).toEqual(1);
    });
  });
});