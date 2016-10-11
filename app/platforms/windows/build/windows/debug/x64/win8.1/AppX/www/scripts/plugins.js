﻿function getDB(a){"use strict";var b;return b||(b="undefined"!=typeof cordova&&"android"===cordova.platformId?new PouchDB(a,{adapter:"idb"}):new PouchDB(a,{adapter:"websql",location:"default"})),b}var WebWorkerPoolFactory=WebWorkerPoolFactory||{},WebWorkerPool=WebWorkerPool||{};!function(){"use strict";WebWorkerPoolFactory=function(a){this.q=a},WebWorkerPoolFactory.prototype.createPool=function(a,b){return new WebWorkerPool(this.q,a,b)},WebWorkerPool=function(a,b,c){this.q=a,this.workerUrl=b,this.capacity=c,this.availableWorkers=c,this.workers=[],this.queue=[],this.runningWorkers=0},WebWorkerPool.prototype.postMessage=function(a){var b=this.q.defer();return 0===this.availableWorkers?this._queue(b,a):this._execute(b,a),b.promise},WebWorkerPool.prototype._execute=function(a,b){var c=this,d=this._getWorker();this.availableWorkers--,d.onmessage=function(b){c._releaseWorker(d),c.runningWorkers--,c._next(),a.resolve(b)},d.postMessage(b),this.runningWorkers++},WebWorkerPool.prototype._getWorker=function(){var a;return 0===this.workers.length?a=new Worker(this.workerUrl):this.workers.pop()},WebWorkerPool.prototype._releaseWorker=function(a){a.onmessage=null,this.workers.push(a),this.availableWorkers++},WebWorkerPool.prototype._queue=function(a,b){a.msg=b,this.queue.push(a)},WebWorkerPool.prototype._next=function(){if(0!==this.queue.length){var a=this.queue.shift();this._execute(a,a.msg)}},WebWorkerPool.prototype.clearQueue=function(){for(var a=0;a<this.queue.length;a++)this.queue[a].reject("Web worker queue has been cleared");this.queue=[]},WebWorkerPool.prototype.clearWorkers=function(){this.workers=[],this.availableWorkers=this.capacity}}(),function(){"use strict";var a=angular.module("webWorkerPool",["ng"]);a.service("webWorkerPoolFactory",["$q",function(a){return new WebWorkerPoolFactory(a)}]),a.provider("webWorkerPool",function(){this.$get=["$q",function(a){return new WebWorkerPool(a,this.workerUrl,this.capacity)}],this.workerUrl=function(a){this.workerUrl=a},this.capacity=function(a){this.capacity=a}})}(),!function(a){"object"==typeof exports?module.exports=a():"function"==typeof define&&define.amd?define(a):"undefined"!=typeof window?window.blobUtil=a():"undefined"!=typeof global?global.blobUtil=a():"undefined"!=typeof self&&(self.blobUtil=a())}(function(){return function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);throw new Error("Cannot find module '"+g+"'")}var j=c[g]={exports:{}};b[g][0].call(j.exports,function(a){var c=b[g][1][a];return e(c?c:a)},j,j.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b){"use strict";function c(a){for(var b=a.length,c=new ArrayBuffer(b),d=new Uint8Array(c),e=-1;++e<b;)d[e]=a.charCodeAt(e);return c}function d(a){for(var b="",c=new Uint8Array(a),d=c.byteLength,e=-1;++e<d;)b+=String.fromCharCode(c[e]);return b}function e(a,b){return new v(function(c,d){var e=new Image;b&&(e.crossOrigin=b),e.onload=function(){c(e)},e.onerror=d,e.src=a})}function f(a){var b=document.createElement("canvas");b.width=a.width,b.height=a.height;var c=b.getContext("2d");return c.drawImage(a,0,0,a.width,a.height,0,0,a.width,a.height),b}function g(a,b){return b=b||{},"string"==typeof b&&(b={type:b}),new u(a,b)}function h(a){return(window.URL||window.webkitURL).createObjectURL(a)}function i(a){return(window.URL||window.webkitURL).revokeObjectURL(a)}function j(a){return new v(function(b,c){var e=new FileReader,f="function"==typeof e.readAsBinaryString;e.onloadend=function(a){var c=a.target.result||"";return f?b(c):void b(d(c))},e.onerror=c,f?e.readAsBinaryString(a):e.readAsArrayBuffer(a)})}function k(a,b){return v.resolve().then(function(){var d=[c(atob(a))];return b?g(d,{type:b}):g(d)})}function l(a,b){return v.resolve().then(function(){return k(btoa(a),b)})}function m(a){return j(a).then(function(a){return btoa(a)})}function n(a){return v.resolve().then(function(){var b=a.match(/data:([^;]+)/)[1],d=a.replace(/^[^,]+,/,""),e=c(atob(d));return g([e],{type:b})})}function o(a,b,c){return b=b||"image/jpeg",e(a,c).then(function(a){return f(a)}).then(function(a){return a.toDataURL(b)})}function p(a,b){return v.resolve().then(function(){return"function"==typeof a.toBlob?new v(function(c){a.toBlob(c,b)}):n(a.toDataURL(b))})}function q(a,b,c){return b=b||"image/jpeg",e(a,c).then(function(a){return f(a)}).then(function(a){return p(a,b)})}function r(a,b){return v.resolve().then(function(){return g([a],b)})}function s(a){return j(a).then(function(a){return c(a)})}var t=a("./utils"),u=a("blob"),v=t.Promise;b.exports={createBlob:g,createObjectURL:h,revokeObjectURL:i,imgSrcToBlob:q,imgSrcToDataURL:o,canvasToBlob:p,dataURLToBlob:n,blobToBase64String:m,base64StringToBlob:k,binaryStringToBlob:l,blobToBinaryString:j,arrayBufferToBlob:r,blobToArrayBuffer:s}},{"./utils":2,blob:3}],2:[function(a,b,c){var d="undefined"!=typeof self?self:"undefined"!=typeof window?window:{},e="function"==typeof d.Promise?d.Promise:a("lie");c.Promise=e},{lie:8}],3:[function(a,b){function c(a){for(var b=0;b<a.length;b++){var c=a[b];if(c.buffer instanceof ArrayBuffer){var d=c.buffer;if(c.byteLength!==d.byteLength){var e=new Uint8Array(c.byteLength);e.set(new Uint8Array(d,c.byteOffset,c.byteLength)),d=e.buffer}a[b]=d}}}function d(a,b){b=b||{};var d=new g;c(a);for(var e=0;e<a.length;e++)d.append(a[e]);return b.type?d.getBlob(b.type):d.getBlob()}function e(a,b){return c(a),new Blob(a,b||{})}var f="undefined"!=typeof self?self:"undefined"!=typeof window?window:{},g=f.BlobBuilder||f.WebKitBlobBuilder||f.MSBlobBuilder||f.MozBlobBuilder,h=function(){try{var a=new Blob(["hi"]);return 2===a.size}catch(b){return!1}}(),i=h&&function(){try{var a=new Blob([new Uint8Array([1,2])]);return 2===a.size}catch(b){return!1}}(),j=g&&g.prototype.append&&g.prototype.getBlob;b.exports=function(){return h?i?f.Blob:e:j?d:void 0}()},{}],4:[function(){},{}],5:[function(a,b){"use strict";function c(){}b.exports=c},{}],6:[function(a,b){"use strict";function c(a){function b(a,b){function d(a){j[b]=a,++k===c&!i&&(i=!0,h.resolve(m,j))}f(a).then(d,function(a){i||(i=!0,h.reject(m,a))})}if("[object Array]"!==Object.prototype.toString.call(a))return e(new TypeError("must be an array"));var c=a.length,i=!1;if(!c)return f([]);for(var j=new Array(c),k=0,l=-1,m=new d(g);++l<c;)b(a[l],l);return m}var d=a("./promise"),e=a("./reject"),f=a("./resolve"),g=a("./INTERNAL"),h=a("./handlers");b.exports=c},{"./INTERNAL":5,"./handlers":7,"./promise":9,"./reject":12,"./resolve":13}],7:[function(a,b,c){"use strict";function d(a){var b=a&&a.then;return a&&"object"==typeof a&&"function"==typeof b?function(){b.apply(a,arguments)}:void 0}var e=a("./tryCatch"),f=a("./resolveThenable"),g=a("./states");c.resolve=function(a,b){var h=e(d,b);if("error"===h.status)return c.reject(a,h.value);var i=h.value;if(i)f.safely(a,i);else{a.state=g.FULFILLED,a.outcome=b;for(var j=-1,k=a.queue.length;++j<k;)a.queue[j].callFulfilled(b)}return a},c.reject=function(a,b){a.state=g.REJECTED,a.outcome=b;for(var c=-1,d=a.queue.length;++c<d;)a.queue[c].callRejected(b);return a}},{"./resolveThenable":14,"./states":15,"./tryCatch":16}],8:[function(a,b,c){b.exports=c=a("./promise"),c.resolve=a("./resolve"),c.reject=a("./reject"),c.all=a("./all"),c.race=a("./race")},{"./all":6,"./promise":9,"./race":11,"./reject":12,"./resolve":13}],9:[function(a,b){"use strict";function c(a){if(!(this instanceof c))return new c(a);if("function"!=typeof a)throw new TypeError("reslover must be a function");this.state=g.PENDING,this.queue=[],this.outcome=void 0,a!==e&&f.safely(this,a)}var d=a("./unwrap"),e=a("./INTERNAL"),f=a("./resolveThenable"),g=a("./states"),h=a("./queueItem");b.exports=c,c.prototype["catch"]=function(a){return this.then(null,a)},c.prototype.then=function(a,b){if("function"!=typeof a&&this.state===g.FULFILLED||"function"!=typeof b&&this.state===g.REJECTED)return this;var f=new c(e);if(this.state!==g.PENDING){var i=this.state===g.FULFILLED?a:b;d(f,i,this.outcome)}else this.queue.push(new h(f,a,b));return f}},{"./INTERNAL":5,"./queueItem":10,"./resolveThenable":14,"./states":15,"./unwrap":17}],10:[function(a,b){"use strict";function c(a,b,c){this.promise=a,"function"==typeof b&&(this.onFulfilled=b,this.callFulfilled=this.otherCallFulfilled),"function"==typeof c&&(this.onRejected=c,this.callRejected=this.otherCallRejected)}var d=a("./handlers"),e=a("./unwrap");b.exports=c,c.prototype.callFulfilled=function(a){d.resolve(this.promise,a)},c.prototype.otherCallFulfilled=function(a){e(this.promise,this.onFulfilled,a)},c.prototype.callRejected=function(a){d.reject(this.promise,a)},c.prototype.otherCallRejected=function(a){e(this.promise,this.onRejected,a)}},{"./handlers":7,"./unwrap":17}],11:[function(a,b){"use strict";function c(a){function b(a){f(a).then(function(a){i||(i=!0,h.resolve(k,a))},function(a){i||(i=!0,h.reject(k,a))})}if("[object Array]"!==Object.prototype.toString.call(a))return e(new TypeError("must be an array"));var c=a.length,i=!1;if(!c)return f([]);for(var j=-1,k=new d(g);++j<c;)b(a[j]);return k}var d=a("./promise"),e=a("./reject"),f=a("./resolve"),g=a("./INTERNAL"),h=a("./handlers");b.exports=c},{"./INTERNAL":5,"./handlers":7,"./promise":9,"./reject":12,"./resolve":13}],12:[function(a,b){"use strict";function c(a){var b=new d(e);return f.reject(b,a)}var d=a("./promise"),e=a("./INTERNAL"),f=a("./handlers");b.exports=c},{"./INTERNAL":5,"./handlers":7,"./promise":9}],13:[function(a,b){"use strict";function c(a){if(a)return a instanceof d?a:f.resolve(new d(e),a);var b=typeof a;switch(b){case"boolean":return g;case"undefined":return i;case"object":return h;case"number":return j;case"string":return k}}var d=a("./promise"),e=a("./INTERNAL"),f=a("./handlers");b.exports=c;var g=f.resolve(new d(e),!1),h=f.resolve(new d(e),null),i=f.resolve(new d(e),void 0),j=f.resolve(new d(e),0),k=f.resolve(new d(e),"")},{"./INTERNAL":5,"./handlers":7,"./promise":9}],14:[function(a,b,c){"use strict";function d(a,b){function c(b){h||(h=!0,e.reject(a,b))}function d(b){h||(h=!0,e.resolve(a,b))}function g(){b(d,c)}var h=!1,i=f(g);"error"===i.status&&c(i.value)}var e=a("./handlers"),f=a("./tryCatch");c.safely=d},{"./handlers":7,"./tryCatch":16}],15:[function(a,b,c){c.REJECTED=["REJECTED"],c.FULFILLED=["FULFILLED"],c.PENDING=["PENDING"]},{}],16:[function(a,b){"use strict";function c(a,b){var c={};try{c.value=a(b),c.status="success"}catch(d){c.status="error",c.value=d}return c}b.exports=c},{}],17:[function(a,b){"use strict";function c(a,b,c){d(function(){var d;try{d=b(c)}catch(f){return e.reject(a,f)}d===a?e.reject(a,new TypeError("Cannot resolve promise with itself")):e.resolve(a,d)})}var d=a("immediate"),e=a("./handlers");b.exports=c},{"./handlers":7,immediate:18}],18:[function(a,b){"use strict";function c(){e=!0;for(var a,b,c=h.length;c;){for(b=h,h=[],a=-1;++a<c;)b[a]();c=h.length}e=!1}function d(a){1!==h.push(a)||e||f()}for(var e,f,g=[a("./nextTick"),a("./mutation.js"),a("./messageChannel"),a("./stateChange"),a("./timeout")],h=[],i=-1,j=g.length;++i<j;)if(g[i]&&g[i].test&&g[i].test()){f=g[i].install(c);break}b.exports=d},{"./messageChannel":19,"./mutation.js":20,"./nextTick":4,"./stateChange":21,"./timeout":22}],19:[function(a,b,c){var d="undefined"!=typeof self?self:"undefined"!=typeof window?window:{};c.test=function(){return d.setImmediate?!1:"undefined"!=typeof d.MessageChannel},c.install=function(a){var b=new d.MessageChannel;return b.port1.onmessage=a,function(){b.port2.postMessage(0)}}},{}],20:[function(a,b,c){var d="undefined"!=typeof self?self:"undefined"!=typeof window?window:{},e=d.MutationObserver||d.WebKitMutationObserver;c.test=function(){return e},c.install=function(a){var b=0,c=new e(a),f=d.document.createTextNode("");return c.observe(f,{characterData:!0}),function(){f.data=b=++b%2}}},{}],21:[function(a,b,c){var d="undefined"!=typeof self?self:"undefined"!=typeof window?window:{};c.test=function(){return"document"in d&&"onreadystatechange"in d.document.createElement("script")},c.install=function(a){return function(){var b=d.document.createElement("script");return b.onreadystatechange=function(){a(),b.onreadystatechange=null,b.parentNode.removeChild(b),b=null},d.document.documentElement.appendChild(b),a}}},{}],22:[function(a,b,c){"use strict";c.test=function(){return!0},c.install=function(a){return function(){setTimeout(a,0)}}},{}]},{},[1])(1)});var ngFlynnApp=ngFlynnApp||{};ngFlynnApp.parseDate=function(a){"use strict";var b;if("date"==typeof a)return a;if(a&&a.length>=4)if(b=new Date,4===a.length)b.setFullYear(a),b.setMonth(0),b.setDate(1);else if(7===a.length){var c=a.split("-",2);b.setFullYear(c[0]),b.setMonth(c[1]),b.setDate(1)}else if(10===a.length){var d=a.split("-",3);b.setFullYear(d[0]),b.setMonth(d[1]),b.setDate(d[2])}else b=new Date(a);return b},String.prototype.hashCode=function(){"use strict";var a,b,c,d=0;if(0===this.length)return d;for(a=0,c=this.length;c>a;a++)b=this.charCodeAt(a),d=(d<<5)-d+b,d|=0;return d},ngFlynnApp.enrichSingleDbEntry=function(a){"use strict";var b,c,d={};if(d.value=a.value,d.image=a.image,a.value.volumeInfo.authors){b="";var e=a.value.volumeInfo.authors.length;for(var f in a.value.volumeInfo.authors)b+=a.value.volumeInfo.authors[f],e-1>f&&(b+=",");d.authorInfo=b}if(a.value.volumeInfo.publishedDate){var g=ngFlynnApp.parseDate(a.value.volumeInfo.publishedDate);d.value.volumeInfo.publishedDate=g}if(a.value.volumeInfo.industryIdentifiers){c="";var h=a.value.volumeInfo.industryIdentifiers.length;for(var i in a.value.volumeInfo.industryIdentifiers)c+=a.value.volumeInfo.industryIdentifiers[i].identifier,h-1>i&&(c+=",");d.isbnInfo=c}return d},ngFlynnApp.enrichDbData=function(a){"use strict";var b=!1,c={},d=!1;if(a){for(var e in a){var f=ngFlynnApp.enrichSingleDbEntry(a[e]);if(f.value&&f.value.volumeInfo){var g=f.value.id;c[g]?(c[g].count++,c[g].docs.push(f)):(c[g]=f,c[g].count=1,c[g].docs=[],c[g].docs.push(f),d=!0)}}if(d){b=[];for(var h in c)b.push(c[h])}}return b};var dbLog=angular.module("dbLog",[]);dbLog.provider("logService",function(){"use strict";var a,b,c,d=function(b){var d=a.defer(),e=getDB(c.dbName);return e.allDocs({include_docs:!0},function(a,c){if(a)console.error("Error during writing log entries: "+c),d.reject(c);else{var e=[];for(var f in c.rows){var g=c.rows[f].doc;b?b==g.level&&e.push(g):e.push(g)}0===e.length&&(e=null),d.resolve(e)}}),d.promise},e=function(){var b=a.defer(),d=getDB(c.dbName);return d.destroy(function(a,c){a?(console.error("Error during clearing log database: "+c),b.reject(c)):(console.info("Sucessfully cleared log database."),b.resolve(c))}),b.promise};this.$get=["$q","$log",function(f,g){return a=f,b=g,c=b.getConfig(),{readLogData:function(a){return d(a)},clearLogData:function(){return e()}}}]}),dbLog.provider("logger",function(){"use strict";var a,b={};b.debug=!1,b.outputOnly=!1,b.trace=!1,b.dbName="log",this.outputOnly=function(a){b.outputOnly=!!a},this.debugLogging=function(a){b.debug=!!a},this.traceLogging=function(a){b.trace=!!a},this.dbName=function(a){b.dbName=a};var c=function(c,d){var e=d[0];if(!b.outputOnly){var f=new Date,g=getDB(b.dbName),h={timestamp:f,level:c,details:""+e};g&&g.bulkDocs&&(h._id=""+f.getTime(),g.put(h,function(b){b&&a.error("Error during writing log entry: "+b)}))}};this.$get=["$delegate",function(d){return a=d,{getConfig:function(){return b},log:function(){a.info(arguments),c("INFO",arguments)},warn:function(){a.warn(arguments),c("TRACE",arguments)},info:function(){a.info(arguments),c("INFO",arguments)},error:function(){a.error(arguments),c("ERROR",arguments)},debug:function(){b.debug&&(a.debug(arguments),c("DEBUG",arguments))},trace:function(){b.trace&&(a.trace(arguments),c("TRACE",arguments))}}}]});