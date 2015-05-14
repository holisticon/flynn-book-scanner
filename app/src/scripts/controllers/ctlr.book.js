/**
 * @ngdoc controller
 * @name BookController
 * @module flynnBookScannerApp
 *
 * @description
 * Controller to add new book entries to inventory
 */
app.controller('BookController', ['$rootScope', '$scope', '$ionicLoading', '$log', '$http', '$filter', '$q', '$state', '$resource', '$ionicModal', '$ionicHistory', 'settingsService', 'inventoryService', 'googleBookService',
	function($rootScope, $scope, $ionicLoading, $log, $http, $filter, $q, $state, $resource, $ionicModal, $ionicHistory, settingsService, inventoryService, googleBookService) {
		var booksInventory, credentials = settingsService
			.load().activeProfile();

		function init() {
			$ionicModal.fromTemplateUrl('book_modal.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				$scope.modal = modal;
			});
			$scope.openModal = function() {
				$scope.modal.show();
			};
			$scope.closeModal = function() {
				$scope.modal.hide();
			};
			//Cleanup the modal when we're done with it!
			$scope.$on('$destroy', function() {
				$scope.modal.remove();
			});
			$scope.barcodeSupported = isMobileDevice();
		}

		/**
		 * Scan book via ISBN barcode
		 */
		function scan() {
			$ionicLoading.show();
			cordova.plugins.barcodeScanner.scan(function(result) {
				if (!result.cancelled) {
					$log.debug('We got a barcode\n' + 'Result: ' + result.text + '\n' + 'Format: ' + result.format + '\n');
					$scope.searchQuery.isbn = result.text;
					search();
				}
				$ionicLoading.hide();
			}, function(error) {
				$log.error("Scanning failed.");
				$rootScope.$broadcast("barcode.error");
				$ionicLoading.hide();
			});
		}

		// TODO_#21_take book image
		function takePicture() {
			navigator.camera.getPicture(function(imageURI) {
				// imageURI is the URL of the image that we can use for
				// an <img> element or backgroundImage.
			}, function(err) {
				// Ruh-roh, something bad happened
			}, cameraOptions);
		}

		/**
		 * Search a book to add via Google Book Search.
		 * Currently only isbn search is implemented.
		 *
		 */
		function search() {
			$scope.books = null;
			// hide keyboard
			if (typeof cordova != 'undefined') {
				cordova.plugins.Keyboard.close();
			}
			var searchQuery = $scope.searchQuery;
			if (searchQuery && (searchQuery.isbn || searchQuery.keyword)) {
				// reset search
				booksInventory = {};
				inventoryService.read().then(function(response) {
						booksInventory = response.books;
						$log.debug('Start searching with criteria:');
						retrieve(searchQuery);
					},
					function(response) {
						$log.error('Error during reading inventory for search with critera ' + JSON.stringify(searchQuery) + ':' + JSON.stringify(response));
					});
			} else {
				navigator.notification.alert('Please enter search details.', null, 'Info');
			}
		}

		function addManual($event) {
			// our function body
			$event.preventDefault();
			var book = {};
			book.value = {};
			book.value.id = Date.now();
			book.value.volumeInfo = {};
			book.value.volumeInfo.industryIdentifiers = [];
			book.value.volumeInfo.authors = [];
			book.value.volumeInfo.industryIdentifiers = [];
			book.value.volumeInfo.industryIdentifiers.push('');
			book.value.volumeInfo.industryIdentifiers.push('');
			book.value.volumeInfo.authors.push('');
			selectBook(book);
		}

		/**
		 * Perform Google Book Search
		 *
		 */
		function retrieve(pSearchQuery) {
			$ionicLoading.show();
			googleBookService.search(pSearchQuery).then(function(response) {
					$log.info('Got valid service response');
					$scope.books = enrichDbData(response.books);
					$ionicLoading.hide();
				},
				function(response) {
					$rootScope.$broadcast('booksearch.invalid');
					$ionicLoading.hide();
				});
		}

		function reset() {
			$scope.books = null;
			$scope.searchQuery = null;
			$scope.selectedBook = null;
			$scope.searchQuery = {};
			$scope.closeModal();
		}

		/**
		 * Triggered from the UI if user selects a book which he wants to add.
		 *
		 */
		function selectBook(pSelectedBookValue) {
			$ionicLoading.show();
			var newEntry = true,
				bookToAdd = pSelectedBookValue,
				books = booksInventory,
				authorInfo = "";
			$log.debug('Showing details for book: ' + pSelectedBookValue.value.volumeInfo.title);
			for (var itemIndex in pSelectedBookValue.value.volumeInfo.authors) {
				var authorsInfo = pSelectedBookValue.value.volumeInfo.authors;
				if (authorsInfo) {
					var authorCount = authorsInfo.length;
					authorInfo += authorsInfo[itemIndex];
					if (itemIndex < authorCount - 1) {
						authorInfo += ", ";
					}
				}
			}
			var count = 0;
			if (books) {
				var isbn0;
				if (pSelectedBookValue.value.volumeInfo.industryIdentifiers) {
					var indIDs = pSelectedBookValue.value.volumeInfo.industryIdentifiers;
					if (indIDs[0]) {
						isbn0 = indIDs[0].identifier;
					}
				}
				for (var id in books) {
					var bookEntry = books[id],
						currentISBN = bookEntry.value.volumeInfo.industryIdentifiers[0].identifier;
					// only add complete entries to results
					if (isbn0 && currentISBN == isbn0) {
						$log.debug('Already found a saved book entry: ' + bookEntry.value.volumeInfo.title);
						bookToAdd = bookEntry;
						count++;
					}
				}
			}
			if (count > 0) {
				$log.debug('Found already entry in couchdb');
				bookToAdd.infoMsg = 'Book is already added to library. Please update amount.';
			} else {
				$log.debug('Found no existing entry in couchdb');
				bookToAdd.infoMsg = null;
				// set default count to 1
				count = 1;
				bookToAdd.value.bookshelf = credentials.lastBookshelf;
			}
			bookToAdd.count = count;
			bookToAdd.authorInfo = authorInfo;
			bookToAdd.value.owner = bookToAdd.value.owner || credentials.owner;
			$scope.selectedBook = bookToAdd;
			$ionicLoading.hide();
			$scope.openModal();
		}

		function save(book) {
			$ionicLoading.show();
			$log.debug('Starting save for book');
			// remember last bookshelf
			var config = settingsService.load();
			config.activeProfile().lastBookshelf = book.value.bookshelf;
			settingsService.save(config);
			// TODO_#65
			// move to service
			// Author info
			if (book.authorInfo) {
				var authors = book.authorInfo.split(',');
				if (authors.length > 0) {
					book.value.volumeInfo.authors = [];
					for (var index in authors) {
						var author = authors[index];
						book.value.volumeInfo.authors.push(author);
					}
				}
			}
			// TODO_#65
			// move to service
			if (book.isbnInfo) {
				var isbns = book.isbnInfo.split(',');
				if (isbns.length > 0) {
					book.value.volumeInfo.industryIdentifiers = [];
					for (var index in isbns) {
						var isbn = isbns[index];
						book.value.volumeInfo.industryIdentifiers.push({
							identifier: isbn
						});
					}
				}
			}

			var imgElement = document.getElementById(book.value.id).getElementsByClassName('img-thumbnail');
			if (imgElement && imgElement[0].src) {
				var bookImage = imgElement[0];
				// extract image info
				blobUtil.imgSrcToBlob(bookImage.src).then(function(blob) {
					var reader = new window.FileReader();
					reader.readAsDataURL(blob);
					reader.onloadend = function() {
						var image = {};
						image.name = 'thumbnail_' + book.value.id;
						image.content_type = blob.type;
						image.data = reader.result.replace('data:image/jpeg;base64,', '');
						book.image = image;
						inventoryService.save(book).then(onSuccess, onError);
					}
				});
			} else {
				inventoryService.save(book).then(onSuccess,
					onError);
			}

			function onSuccess(response) {
				$log.info('Successfully added book');
				if (response.noUpdate) {
					navigator.notification.alert('Book already added. Please increase amount.');
				} else {
					// sync on save
					if (config.activeProfile().remotesync) {
						inventoryService.syncRemote().then(function(response) {
								$log.info('Remote sync completed');
							},
							function(error) {
								$log.error('Remote sync not completed due to errors.');
								$rootScope.$broadcast('settings.invalid');
								$state.go('app.settings');
							});
					}
					$ionicLoading.hide();
					navigator.notification.alert('Book successfully added.', reset(), 'Book');
	                $rootScope.$broadcast('inventory.refresh');
                	$state.go('app.books');
				}
			}

			function onError(response) {
				$ionicLoading.hide();
				$rootScope.$broadcast('booksave.error');
				$log.error('Error during book saving');
			}
		}

		init();

		$scope.searchQuery = {};

		// public methods
		$scope.scan = scan;
		$scope.save = save;
		$scope.selectBook = selectBook;
		$scope.search = search;
		$scope.manual = addManual;
	}
]);