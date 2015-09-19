/* jshint ignore:start */
!function (e) {
  "object" == typeof exports ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : "undefined" != typeof window ? window.blobUtil = e() : "undefined" != typeof global ? global.blobUtil = e() : "undefined" != typeof self && (self.blobUtil = e())
}(function () {
  return function e(t, n, r) {
    function o(u, a) {
      if (!n[u]) {
        if (!t[u]) {
          var s = "function" == typeof require && require;
          if (!a && s)return s(u, !0);
          if (i)return i(u, !0);
          throw new Error("Cannot find module '" + u + "'")
        }
        var f = n[u] = {exports: {}};
        t[u][0].call(f.exports, function (e) {
          var n = t[u][1][e];
          return o(n ? n : e)
        }, f, f.exports, e, t, n, r)
      }
      return n[u].exports
    }

    for (var i = "function" == typeof require && require, u = 0; u < r.length; u++)o(r[u]);
    return o
  }({
    1: [function (e, t) {
      "use strict";
      function n(e) {
        for (var t = e.length, n = new ArrayBuffer(t), r = new Uint8Array(n), o = -1; ++o < t;)r[o] = e.charCodeAt(o);
        return n
      }

      function r(e) {
        for (var t = "", n = new Uint8Array(e), r = n.byteLength, o = -1; ++o < r;)t += String.fromCharCode(n[o]);
        return t
      }

      function o(e, t) {
        return new L(function (n, r) {
          var o = new Image;
          t && (o.crossOrigin = t), o.onload = function () {
            n(o)
          }, o.onerror = r, o.src = e
        })
      }

      function i(e) {
        var t = document.createElement("canvas");
        t.width = e.width, t.height = e.height;
        var n = t.getContext("2d");
        return n.drawImage(e, 0, 0, e.width, e.height, 0, 0, e.width, e.height), t
      }

      function u(e, t) {
        return t = t || {}, "string" == typeof t && (t = {type: t}), new g(e, t)
      }

      function a(e) {
        return (window.URL || window.webkitURL).createObjectURL(e)
      }

      function s(e) {
        return (window.URL || window.webkitURL).revokeObjectURL(e)
      }

      function f(e) {
        return new L(function (t, n) {
          var o = new FileReader, i = "function" == typeof o.readAsBinaryString;
          o.onloadend = function (e) {
            var n = e.target.result || "";
            return i ? t(n) : void t(r(n))
          }, o.onerror = n, i ? o.readAsBinaryString(e) : o.readAsArrayBuffer(e)
        })
      }

      function c(e, t) {
        return L.resolve().then(function () {
          var r = [n(atob(e))];
          return t ? u(r, {type: t}) : u(r)
        })
      }

      function l(e, t) {
        return L.resolve().then(function () {
          return c(btoa(e), t)
        })
      }

      function d(e) {
        return f(e).then(function (e) {
          return btoa(e)
        })
      }

      function h(e) {
        return L.resolve().then(function () {
          var t = e.match(/data:([^;]+)/)[1], r = e.replace(/^[^,]+,/, ""), o = n(atob(r));
          return u([o], {type: t})
        })
      }

      function p(e, t, n) {
        return t = t || "image/jpeg", o(e, n).then(function (e) {
          return i(e)
        }).then(function (e) {
          return e.toDataURL(t)
        })
      }

      function v(e, t) {
        return L.resolve().then(function () {
          return "function" == typeof e.toBlob ? new L(function (n) {
            e.toBlob(n, t)
          }) : h(e.toDataURL(t))
        })
      }

      function y(e, t, n) {
        return t = t || "image/jpeg", o(e, n).then(function (e) {
          return i(e)
        }).then(function (e) {
          return v(e, t)
        })
      }

      function w(e, t) {
        return L.resolve().then(function () {
          return u([e], t)
        })
      }

      function b(e) {
        return f(e).then(function (e) {
          return n(e)
        })
      }

      var m = e("./utils"), g = e("blob"), L = m.Promise;
      t.exports = {
        createBlob: u,
        createObjectURL: a,
        revokeObjectURL: s,
        imgSrcToBlob: y,
        imgSrcToDataURL: p,
        canvasToBlob: v,
        dataURLToBlob: h,
        blobToBase64String: d,
        base64StringToBlob: c,
        binaryStringToBlob: l,
        blobToBinaryString: f,
        arrayBufferToBlob: w,
        blobToArrayBuffer: b
      }
    }, {"./utils": 2, blob: 3}],
    2: [function (e, t, n) {
      var r = "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, o = "function" == typeof r.Promise ? r.Promise : e("lie");
      n.Promise = o
    }, {lie: 8}],
    3: [function (e, t) {
      function n(e) {
        for (var t = 0; t < e.length; t++) {
          var n = e[t];
          if (n.buffer instanceof ArrayBuffer) {
            var r = n.buffer;
            if (n.byteLength !== r.byteLength) {
              var o = new Uint8Array(n.byteLength);
              o.set(new Uint8Array(r, n.byteOffset, n.byteLength)), r = o.buffer
            }
            e[t] = r
          }
        }
      }

      function r(e, t) {
        t = t || {};
        var r = new u;
        n(e);
        for (var o = 0; o < e.length; o++)r.append(e[o]);
        return t.type ? r.getBlob(t.type) : r.getBlob()
      }

      function o(e, t) {
        return n(e), new Blob(e, t || {})
      }

      var i = "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, u = i.BlobBuilder || i.WebKitBlobBuilder || i.MSBlobBuilder || i.MozBlobBuilder, a = function () {
        try {
          var e = new Blob(["hi"]);
          return 2 === e.size
        } catch (t) {
          return !1
        }
      }(), s = a && function () {
          try {
            var e = new Blob([new Uint8Array([1, 2])]);
            return 2 === e.size
          } catch (t) {
            return !1
          }
        }(), f = u && u.prototype.append && u.prototype.getBlob;
      t.exports = function () {
        return a ? s ? i.Blob : o : f ? r : void 0
      }()
    }, {}],
    4: [function () {
    }, {}],
    5: [function (e, t) {
      "use strict";
      function n() {
      }

      t.exports = n
    }, {}],
    6: [function (e, t) {
      "use strict";
      function n(e) {
        function t(e, t) {
          function r(e) {
            f[t] = e, ++c === n & !s && (s = !0, a.resolve(d, f))
          }

          i(e).then(r, function (e) {
            s || (s = !0, a.reject(d, e))
          })
        }

        if ("[object Array]" !== Object.prototype.toString.call(e))return o(new TypeError("must be an array"));
        var n = e.length, s = !1;
        if (!n)return i([]);
        for (var f = new Array(n), c = 0, l = -1, d = new r(u); ++l < n;)t(e[l], l);
        return d
      }

      var r = e("./promise"), o = e("./reject"), i = e("./resolve"), u = e("./INTERNAL"), a = e("./handlers");
      t.exports = n
    }, {"./INTERNAL": 5, "./handlers": 7, "./promise": 9, "./reject": 12, "./resolve": 13}],
    7: [function (e, t, n) {
      "use strict";
      function r(e) {
        var t = e && e.then;
        return e && "object" == typeof e && "function" == typeof t ? function () {
          t.apply(e, arguments)
        } : void 0
      }

      var o = e("./tryCatch"), i = e("./resolveThenable"), u = e("./states");
      n.resolve = function (e, t) {
        var a = o(r, t);
        if ("error" === a.status)return n.reject(e, a.value);
        var s = a.value;
        if (s)i.safely(e, s); else {
          e.state = u.FULFILLED, e.outcome = t;
          for (var f = -1, c = e.queue.length; ++f < c;)e.queue[f].callFulfilled(t)
        }
        return e
      }, n.reject = function (e, t) {
        e.state = u.REJECTED, e.outcome = t;
        for (var n = -1, r = e.queue.length; ++n < r;)e.queue[n].callRejected(t);
        return e
      }
    }, {"./resolveThenable": 14, "./states": 15, "./tryCatch": 16}],
    8: [function (e, t, n) {
      t.exports = n = e("./promise"), n.resolve = e("./resolve"), n.reject = e("./reject"), n.all = e("./all"), n.race = e("./race")
    }, {"./all": 6, "./promise": 9, "./race": 11, "./reject": 12, "./resolve": 13}],
    9: [function (e, t) {
      "use strict";
      function n(e) {
        if (!(this instanceof n))return new n(e);
        if ("function" != typeof e)throw new TypeError("reslover must be a function");
        this.state = u.PENDING, this.queue = [], this.outcome = void 0, e !== o && i.safely(this, e)
      }

      var r = e("./unwrap"), o = e("./INTERNAL"), i = e("./resolveThenable"), u = e("./states"), a = e("./queueItem");
      t.exports = n, n.prototype["catch"] = function (e) {
        return this.then(null, e)
      }, n.prototype.then = function (e, t) {
        if ("function" != typeof e && this.state === u.FULFILLED || "function" != typeof t && this.state === u.REJECTED)return this;
        var i = new n(o);
        if (this.state !== u.PENDING) {
          var s = this.state === u.FULFILLED ? e : t;
          r(i, s, this.outcome)
        } else this.queue.push(new a(i, e, t));
        return i
      }
    }, {"./INTERNAL": 5, "./queueItem": 10, "./resolveThenable": 14, "./states": 15, "./unwrap": 17}],
    10: [function (e, t) {
      "use strict";
      function n(e, t, n) {
        this.promise = e, "function" == typeof t && (this.onFulfilled = t, this.callFulfilled = this.otherCallFulfilled), "function" == typeof n && (this.onRejected = n, this.callRejected = this.otherCallRejected)
      }

      var r = e("./handlers"), o = e("./unwrap");
      t.exports = n, n.prototype.callFulfilled = function (e) {
        r.resolve(this.promise, e)
      }, n.prototype.otherCallFulfilled = function (e) {
        o(this.promise, this.onFulfilled, e)
      }, n.prototype.callRejected = function (e) {
        r.reject(this.promise, e)
      }, n.prototype.otherCallRejected = function (e) {
        o(this.promise, this.onRejected, e)
      }
    }, {"./handlers": 7, "./unwrap": 17}],
    11: [function (e, t) {
      "use strict";
      function n(e) {
        function t(e) {
          i(e).then(function (e) {
            s || (s = !0, a.resolve(c, e))
          }, function (e) {
            s || (s = !0, a.reject(c, e))
          })
        }

        if ("[object Array]" !== Object.prototype.toString.call(e))return o(new TypeError("must be an array"));
        var n = e.length, s = !1;
        if (!n)return i([]);
        for (var f = -1, c = new r(u); ++f < n;)t(e[f]);
        return c
      }

      var r = e("./promise"), o = e("./reject"), i = e("./resolve"), u = e("./INTERNAL"), a = e("./handlers");
      t.exports = n
    }, {"./INTERNAL": 5, "./handlers": 7, "./promise": 9, "./reject": 12, "./resolve": 13}],
    12: [function (e, t) {
      "use strict";
      function n(e) {
        var t = new r(o);
        return i.reject(t, e)
      }

      var r = e("./promise"), o = e("./INTERNAL"), i = e("./handlers");
      t.exports = n
    }, {"./INTERNAL": 5, "./handlers": 7, "./promise": 9}],
    13: [function (e, t) {
      "use strict";
      function n(e) {
        if (e)return e instanceof r ? e : i.resolve(new r(o), e);
        var t = typeof e;
        switch (t) {
          case"boolean":
            return u;
          case"undefined":
            return s;
          case"object":
            return a;
          case"number":
            return f;
          case"string":
            return c
        }
      }

      var r = e("./promise"), o = e("./INTERNAL"), i = e("./handlers");
      t.exports = n;
      var u = i.resolve(new r(o), !1), a = i.resolve(new r(o), null), s = i.resolve(new r(o), void 0), f = i.resolve(new r(o), 0), c = i.resolve(new r(o), "")
    }, {"./INTERNAL": 5, "./handlers": 7, "./promise": 9}],
    14: [function (e, t, n) {
      "use strict";
      function r(e, t) {
        function n(t) {
          a || (a = !0, o.reject(e, t))
        }

        function r(t) {
          a || (a = !0, o.resolve(e, t))
        }

        function u() {
          t(r, n)
        }

        var a = !1, s = i(u);
        "error" === s.status && n(s.value)
      }

      var o = e("./handlers"), i = e("./tryCatch");
      n.safely = r
    }, {"./handlers": 7, "./tryCatch": 16}],
    15: [function (e, t, n) {
      n.REJECTED = ["REJECTED"], n.FULFILLED = ["FULFILLED"], n.PENDING = ["PENDING"]
    }, {}],
    16: [function (e, t) {
      "use strict";
      function n(e, t) {
        var n = {};
        try {
          n.value = e(t), n.status = "success"
        } catch (r) {
          n.status = "error", n.value = r
        }
        return n
      }

      t.exports = n
    }, {}],
    17: [function (e, t) {
      "use strict";
      function n(e, t, n) {
        r(function () {
          var r;
          try {
            r = t(n)
          } catch (i) {
            return o.reject(e, i)
          }
          r === e ? o.reject(e, new TypeError("Cannot resolve promise with itself")) : o.resolve(e, r)
        })
      }

      var r = e("immediate"), o = e("./handlers");
      t.exports = n
    }, {"./handlers": 7, immediate: 18}],
    18: [function (e, t) {
      "use strict";
      function n() {
        o = !0;
        for (var e, t, n = a.length; n;) {
          for (t = a, a = [], e = -1; ++e < n;)t[e]();
          n = a.length
        }
        o = !1
      }

      function r(e) {
        1 !== a.push(e) || o || i()
      }

      for (var o, i, u = [e("./nextTick"), e("./mutation.js"), e("./messageChannel"), e("./stateChange"), e("./timeout")], a = [], s = -1, f = u.length; ++s < f;)if (u[s] && u[s].test && u[s].test()) {
        i = u[s].install(n);
        break
      }
      t.exports = r
    }, {"./messageChannel": 19, "./mutation.js": 20, "./nextTick": 4, "./stateChange": 21, "./timeout": 22}],
    19: [function (e, t, n) {
      var r = "undefined" != typeof self ? self : "undefined" != typeof window ? window : {};
      n.test = function () {
        return r.setImmediate ? !1 : "undefined" != typeof r.MessageChannel
      }, n.install = function (e) {
        var t = new r.MessageChannel;
        return t.port1.onmessage = e, function () {
          t.port2.postMessage(0)
        }
      }
    }, {}],
    20: [function (e, t, n) {
      var r = "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, o = r.MutationObserver || r.WebKitMutationObserver;
      n.test = function () {
        return o
      }, n.install = function (e) {
        var t = 0, n = new o(e), i = r.document.createTextNode("");
        return n.observe(i, {characterData: !0}), function () {
          i.data = t = ++t % 2
        }
      }
    }, {}],
    21: [function (e, t, n) {
      var r = "undefined" != typeof self ? self : "undefined" != typeof window ? window : {};
      n.test = function () {
        return "document"in r && "onreadystatechange"in r.document.createElement("script")
      }, n.install = function (e) {
        return function () {
          var t = r.document.createElement("script");
          return t.onreadystatechange = function () {
            e(), t.onreadystatechange = null, t.parentNode.removeChild(t), t = null
          }, r.document.documentElement.appendChild(t), e
        }
      }
    }, {}],
    22: [function (e, t, n) {
      "use strict";
      n.test = function () {
        return !0
      }, n.install = function (e) {
        return function () {
          setTimeout(e, 0)
        }
      }
    }, {}]
  }, {}, [1])(1)
});
/* jshint ignore:end */
