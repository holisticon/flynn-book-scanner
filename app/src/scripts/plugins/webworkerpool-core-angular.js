/**
 * @license webworkerpool.js 1.0.1
 * Created by http://www.bjoerne.com
 * License: GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
(function() {
	WebWorkerPoolFactory = function(q) {
		this.q = q;
	};
	WebWorkerPoolFactory.prototype.createPool = function(workerUrl, capacity) {
		return new WebWorkerPool(this.q, workerUrl, capacity);
	};

	WebWorkerPool = function(q, workerUrl, capacity) {
		this.q = q;
		this.workerUrl = workerUrl;
		this.capacity = capacity;
		this.availableWorkers = capacity;
		this.workers = [];
		this.queue = [];
		this.runningWorkers = 0;
	};
	WebWorkerPool.prototype.postMessage = function(msg) {
		var deferred = this.q.defer(),
			worker;
		if (this.availableWorkers == 0) {
			this._queue(deferred, msg);
		} else {
			this._execute(deferred, msg);
		}
		return deferred.promise;
	};

	WebWorkerPool.prototype._execute = function(deferred, msg) {
		var that = this,
			worker = this._getWorker();
		this.availableWorkers--;
		worker.onmessage = function(event) {
			that._releaseWorker(worker);
			that.runningWorkers--;
			that._next();
			deferred.resolve(event);
		};
		worker.postMessage(msg);
		this.runningWorkers++;
	};

	WebWorkerPool.prototype._getWorker = function() {
		var worker;
		if (this.workers.length == 0) {
			worker = new Worker(this.workerUrl);
			return worker;
		} else {
			return this.workers.pop();
		}
	};

	WebWorkerPool.prototype._releaseWorker = function(worker) {
		worker.onmessage = null;
		this.workers.push(worker);
		this.availableWorkers++;
	};

	WebWorkerPool.prototype._queue = function(deferred, msg) {
			deferred.msg = msg;
			this.queue.push(deferred);
		},

		WebWorkerPool.prototype._next = function() {
			if (this.queue.length == 0) {
				return;
			}
			var deferred = this.queue.shift();
			this._execute(deferred, deferred.msg);
		};

	WebWorkerPool.prototype.clearQueue = function() {
		for (var i = 0; i < this.queue.length; i++) {
			this.queue[i].reject('Web worker queue has been cleared');
		}
		this.queue = [];
	};

	WebWorkerPool.prototype.clearWorkers = function() {
		this.workers = [];
		this.availableWorkers = this.capacity;
	};
})();
/**
 * @license webworkerpool.js 1.0.1
 * Created by http://www.bjoerne.com
 * License: GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
(function() {
	var module = angular.module('webWorkerPool', ['ng']);

	module.service('webWorkerPoolFactory', ['$q',
		function($q) {
			return new WebWorkerPoolFactory($q);
		}
	]);

	module.provider('webWorkerPool', function() {
		this.$get = ['$q',
			function($q) {
				return new WebWorkerPool($q, this.workerUrl, this.capacity);
			}
		];
		this.workerUrl = function(workerUrl) {
			this.workerUrl = workerUrl;
		};
		this.capacity = function(capacity) {
			this.capacity = capacity;
		};
	});
})();