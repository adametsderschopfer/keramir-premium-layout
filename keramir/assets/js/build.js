if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target, firstSource) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

if (typeof NodeList !== 'undefined' && NodeList.prototype && !NodeList.prototype.forEach) {
  // Yes, there's really no need for `Object.defineProperty` here
  NodeList.prototype.forEach = Array.prototype.forEach
  if (typeof Symbol !== 'undefined' && Symbol.iterator && !NodeList.prototype[Symbol.iterator]) {
    Object.defineProperty(NodeList.prototype, Symbol.iterator, {
      value: Array.prototype[Symbol.itereator],
      writable: true,
      configurable: true
    })
  }
}

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        // @ts-ignore
        return constructor.reject(reason);
      });
    }
  );
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function isArray(x) {
  return Boolean(x && typeof x.length !== 'undefined');
}

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = finallyConstructor;

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.all accepts an array'));
    }

    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.race accepts an array'));
    }

    for (var i = 0, len = arr.length; i < len; i++) {
      Promise.resolve(arr[i]).then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  // @ts-ignore
  (typeof setImmediate === 'function' &&
    function(fn) {
      // @ts-ignore
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

/** @suppress {undefinedVars} */
var globalNS = (function() {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw new Error('unable to locate global object');
})();

if (!('Promise' in globalNS)) {
  globalNS['Promise'] = Promise;
} else if (!globalNS.Promise.prototype['finally']) {
  globalNS.Promise.prototype['finally'] = finallyConstructor;
}

})));

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
      typeof define === 'function' && define.amd ? define(['exports'], factory) :
          (factory((global.WHATWGFetch = {})));
}(this, (function (exports) { 'use strict';

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob:
        'FileReader' in self &&
        'Blob' in self &&
        (function() {
          try {
            new Blob();
            return true
          } catch (e) {
            return false
          }
        })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
        ArrayBuffer.isView ||
        function(obj) {
          return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
        };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
    .trim()
    .split('&')
    .forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports.DOMException = self.DOMException;
  try {
    new exports.DOMException();
  } catch (err) {
    exports.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports.DOMException.prototype = Object.create(Error.prototype);
    exports.DOMException.prototype.constructor = exports.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.onabort = function() {
        reject(new exports.DOMException('Aborted', 'AbortError'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!self.fetch) {
    self.fetch = fetch;
    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;
  }

  exports.Headers = Headers;
  exports.Request = Request;
  exports.Response = Response;
  exports.fetch = fetch;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

// CustomEvent micro-polyfill for Internet Explorer (Required for LazyLoad)
;(function () {
  if (typeof window.CustomEvent === 'function') {
    return false
  }

  function CustomEvent(event, params) {
    params = params || {bubbles: false, cancelable: false, detail: undefined}
    var evt = document.createEvent('CustomEvent')
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    return evt
  }

  CustomEvent.prototype = window.Event.prototype
  window.CustomEvent = CustomEvent
})()

"use strict";

;

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var bSlider = document.querySelector('.js-banner-slider');

    if (bSlider) {
      var swiper = document.querySelector('.js-banner-slider-swiper');
      var toggle = document.querySelector('.js-banner-slider-toggle');
      var content = document.querySelector('.js-banner-slider-content');
      toggle.addEventListener('click', function () {
        var isActive = !toggle.classList.contains('active');
        toggle.classList[isActive ? 'add' : 'remove']('active');
        content.classList[isActive ? 'add' : 'remove']('active');
        content.style.height = isActive ? content.scrollHeight + 'px' : '0';
      });
      new Swiper(swiper, {
        slidesPerView: 4,
        spaceBetween: 40,
        navigation: {
          prevEl: ".swiper-nav__prev",
          nextEl: ".swiper-nav__next"
        }
      });
    }
  });
})();
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

;

(function (window) {
  if (!!window.BX) {
    return;
  }

  var BX = {};
  BX.type = {
    isString: function isString(item) {
      return item === '' ? true : item ? typeof item == 'string' || item instanceof String : false;
    },
    isNotEmptyString: function isNotEmptyString(item) {
      return BX.type.isString(item) ? item.length > 0 : false;
    },
    isBoolean: function isBoolean(item) {
      return item === true || item === false;
    },
    isNumber: function isNumber(item) {
      return item === 0 ? true : item ? typeof item == 'number' || item instanceof Number : false;
    },
    isFunction: function isFunction(item) {
      return item === null ? false : typeof item == 'function' || item instanceof Function;
    },
    isElementNode: function isElementNode(item) {
      //document.body.ELEMENT_NODE;
      return item && _typeof(item) == 'object' && 'nodeType' in item && item.nodeType == 1 && item.tagName && item.tagName.toUpperCase() != 'SCRIPT' && item.tagName.toUpperCase() != 'STYLE' && item.tagName.toUpperCase() != 'LINK';
    },
    isDomNode: function isDomNode(item) {
      return item && _typeof(item) == 'object' && 'nodeType' in item;
    },
    isArray: function isArray(item) {
      return item && Object.prototype.toString.call(item) == '[object Array]';
    },
    isDate: function isDate(item) {
      return item && Object.prototype.toString.call(item) == '[object Date]';
    },
    isNotEmptyObject: function isNotEmptyObject(item) {
      for (var i in item) {
        if (item.hasOwnProperty(i)) return true;
      }

      return false;
    }
  };

  BX.ajax = function () {};

  BX.showWait = function () {};

  BX.closeWait = function () {};

  window.BX = BX;
})(window);
"use strict";

var createElementFromHTML = function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim(); // Change this to div.childNodes to support multiple top-level nodes

  return div.firstChild;
};
"use strict";

;

(function () {
  /**
   * Инициализация работы табов
   *
   * @return void
   * */
  function defaultTabsInit() {
    var tabsContainers = Array.from(document.querySelectorAll('.js-tabs'));

    if (tabsContainers.length) {
      tabsContainers.map(function (container) {
        var tabs = Array.from(container.querySelectorAll('.js-tabs-item'));
        var tabsContent = Array.from(container.querySelectorAll('.js-tabs-item-content'));

        if (tabs.length && tabsContent.length) {
          tabs.map(function (tab, index) {
            return tab.addEventListener('click', function () {
              if (!tab.classList.contains('active')) {
                tabs.map(function (tab) {
                  return tab.classList.remove('active');
                });
                tabsContent.map(function (container) {
                  return container.classList.remove('active');
                });
                tab.classList.add('active');
                tabsContent[index].classList.add('active');
              }
            }, true);
          });
        }
      });
    }
  }

  window.defaultTabs = {
    init: defaultTabsInit
  };
})();
"use strict";

;

(function () {
  /**
   * Инициализация дропов
   *
   * @return void
   * */
  function accordionsInit() {
    var accordions = Array.from(document.querySelectorAll('.js-drop'));

    if (accordions.length) {
      accordions.map(function (el) {
        var items = Array.from(el.querySelectorAll('.js-drop-item'));
        items.map(function (item) {
          var button = item.querySelector('.js-drop-button');
          var dropdown = item.querySelector('.js-drop-dropdown');
          button.addEventListener('click', function () {
            var height = dropdown.scrollHeight;
            var isActive = dropdown.style.height === '0px' || dropdown.style.height === '';
            dropdown.style.height = "".concat(isActive ? height : 0, "px");
            button.classList[isActive ? 'add' : 'remove']('active');
          });
        });
      });
    }
  }

  window.addEventListener('DOMContentLoaded', accordionsInit);
  window.accordion = {
    init: accordionsInit
  };
})();
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

;

(function () {
  var EventController = /*#__PURE__*/function () {
    function EventController() {
      _classCallCheck(this, EventController);

      this._events = {};
    }

    _createClass(EventController, [{
      key: "on",
      value: function on(name, listener) {
        if (!this._events[name]) {
          this._events[name] = [];
        }

        this._events[name].push(listener);
      }
    }, {
      key: "removeListener",
      value: function removeListener(name, listenerToRemove) {
        if (!this._events[name]) {
          console.warn("Can't remove a listener. Event \"".concat(name, "\" doesn't exits."));
          return;
        }

        var filterListeners = function filterListeners(listener) {
          return listener !== listenerToRemove;
        };

        this._events[name] = this._events[name].filter(filterListeners);
      }
    }, {
      key: "emit",
      value: function emit(name, data) {
        if (!this._events[name]) {
          console.warn("Can't emit an event. Event \"".concat(name, "\" doesn't exits."));
          return;
        }

        var fireCallbacks = function fireCallbacks(callback) {
          callback(data);
        };

        this._events[name].forEach(fireCallbacks);
      }
    }]);

    return EventController;
  }();

  document.addEventListener('DOMContentLoaded', function () {
    window.EventController = new EventController();
  }, true);
})();
"use strict";

var getScrollBarWidth = function getScrollBarWidth() {
  var inner = document.createElement('p');
  inner.style.width = '100%';
  inner.style.height = '200px';
  var outer = document.createElement('div');
  outer.style.position = 'absolute';
  outer.style.top = '0px';
  outer.style.left = '0px';
  outer.style.visibility = 'hidden';
  outer.style.width = '200px';
  outer.style.height = '150px';
  outer.style.overflow = 'hidden';
  outer.appendChild(inner);
  document.body.appendChild(outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  if (w1 === w2) w2 = outer.clientWidth;
  document.body.removeChild(outer);
  return w1 - w2;
};
"use strict";

var getStyle = function getStyle(el, styleProp) {
  var value,
      defaultView = (el.ownerDocument || document).defaultView; // W3C standard way:

  if (defaultView && defaultView.getComputedStyle) {
    // sanitize property name to css notation
    // (hypen separated words eg. font-Size)
    styleProp = styleProp.replace(/([A-Z])/g, '-$1').toLowerCase();
    return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
  } else if (el.currentStyle) {
    // IE
    // sanitize property name to camelCase
    styleProp = styleProp.replace(/\-(\w)/g, function (str, letter) {
      return letter.toUpperCase();
    });
    value = el.currentStyle[styleProp]; // convert other units to pixels on IE

    if (/^\d+(em|pt|%|ex)?$/i.test(value)) {
      return function (value) {
        var oldLeft = el.style.left,
            oldRsLeft = el.runtimeStyle.left;
        el.runtimeStyle.left = el.currentStyle.left;
        el.style.left = value || 0;
        value = el.style.pixelLeft + 'px';
        el.style.left = oldLeft;
        el.runtimeStyle.left = oldRsLeft;
        return value;
      }(value);
    }

    return value;
  }
};
"use strict";

var getWindowWidth = function getWindowWidth() {
  return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
};
"use strict";

var loadScript = function loadScript(src, callback) {
  var s, r, t;
  r = false;
  s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = src;

  s.onload = s.onreadystatechange = function () {
    //console.log( this.readyState ); //uncomment this line to see which ready states are called.
    if (!r && (!this.readyState || this.readyState === 'complete')) {
      r = true;

      if (BX.type.isFunction(callback)) {
        callback();
      }
    }
  };

  t = document.getElementsByTagName('script')[0];
  t.parentNode.insertBefore(s, t);
};
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

;

(function (window) {
  var options = {},
      defaultOptions = {
    cache: true,
    // сохранять ли кеш запроса
    display: 'block',
    data: {},
    paddingRightElements: [],
    title: 'Окно',
    onAfterAppend: null,
    onAfterOpen: null,
    onAfterClose: null
  };
  /**
   * Создаёт обёртку попапа
   * @returns {HTMLDivElement}
   */

  var createWrap = function createWrap() {
    var wrap = document.createElement('div');
    wrap.dataset.close = 'true';
    wrap.classList.add('popup');
    wrap.innerHTML = "\n    <div class=\"popup__wrap\">\n\n    <div class=\"popup__content-wrap\">\n        <div class=\"popup__close\" data-close=\"true\">\n    \n   <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"132\" height=\"132\" viewBox=\"0 0 132 132\" fill=\"none\">\n<path d=\"M100.963 66.32L130.53 36.652C132.446 34.7297 132.446 31.5899 130.53 29.6675L102.368 1.40928C100.452 -0.513053 97.3226 -0.513053 95.4068 1.40928L66.2863 30.6287L37.7406 1.98598C35.8887 0.127724 32.8872 0.0636459 30.9714 1.79374L1.7232 28.386C-0.511919 30.3724 -0.639641 33.8326 1.46776 36.0112L29.6942 65.2947C30.0135 65.6151 30.0135 66.1277 29.6942 66.4481L3.192 93.0403C1.27618 94.9627 1.27618 98.1025 3.192 100.025L31.3546 128.283C33.2704 130.205 36.3995 130.205 38.3154 128.283L62.5824 103.934C64.4982 102.011 67.6274 102.011 69.5432 103.934L96.0454 130.526C97.9612 132.448 101.09 132.448 103.006 130.526L130.53 102.908C132.446 100.986 132.446 97.8462 130.53 95.9238L100.963 66.32ZM128.295 100.089L100.069 128.411C99.7493 128.732 99.2384 128.732 98.9191 128.411L69.4794 98.8714C67.5636 96.9491 64.4344 96.9491 62.5186 98.8714L35.3778 126.104C35.0585 126.425 34.5476 126.425 34.2283 126.104L5.2994 96.8209L34.4199 67.7297C35.5055 66.6403 35.5055 64.9102 34.4199 63.8209L3.76674 33.5122C3.44744 33.1918 3.44744 32.6792 3.76674 32.3588L33.7174 4.29277C34.0367 3.97238 34.5476 3.97238 34.8669 4.29277L62.774 32.2947C64.6898 34.217 67.819 34.217 69.7348 32.2947L98.8553 3.0753L128.87 33.1918L99.3023 62.8598C97.3865 64.7821 97.3865 67.9219 99.3023 69.8442L128.295 98.9355C128.614 99.2559 128.614 99.7685 128.295 100.089Z\" fill=\"#272525\"/>\n</svg>\n</span></div><h3 class=\"popup__title\"></h3></div>\n    </div>";
    return wrap;
  };
  /**
   * Установка паддингов, чтобы элементы не прыгали при скрытии скрола у body
   * @param padding
   */


  var setPadding = function setPadding(padding) {
    window.document.body.style.overflowY = padding ? 'hidden' : 'scroll';
    window.document.body.style.paddingRight = padding;

    if (!BX.type.isArray(options.paddingRightElements)) {
      return;
    }

    for (var i in options.paddingRightElements) {
      var selector = options.paddingRightElements[i],
          nodeList = document.querySelectorAll(selector);

      if (!nodeList.length) {
        continue;
      }

      for (var j in nodeList) {
        var currentElement = nodeList[j];

        if (!BX.type.isElementNode(currentElement)) {
          continue;
        }

        currentElement.style.paddingRight = padding;
      }
    }
  };
  /**
   * Возвращает объект попапа
   *
   * @param params
   * @returns {{close(): void, open(): void}}
   */


  window.legancyPopup = function (params) {
    params = _typeof(params) === 'object' ? params : {};
    options = Object.assign({}, defaultOptions, params);
    var promise,
        content = options.content,
        wrap = createWrap();

    if (typeof content === 'string') {
      if (content.indexOf('/') >= 0 || options.ajax === true) {
        promise = fetch(content).then(function (value) {
          return value.ok ? value.text() : '404 Not found';
        }, function (error) {
          return 'Check your internet connection';
        });
      } else {
        promise = new Promise(function (resolve, reject) {
          var popupElement = document.querySelector(content);

          if (BX.type.isElementNode(popupElement)) {
            resolve(popupElement.innerHTML);
          } else {
            reject('Selector content not found');
          }
        });
      }
    } else if (BX.type.isElementNode(content)) {
      promise = new Promise(function (resolve) {
        resolve(content.innerHTML);
      });
    } else {
      promise = new Promise(function (resolve) {
        resolve('Content Type Not Supported');
      });
    }

    var elem = wrap.querySelector('.popup__content-wrap');

    if (options.title === false || !options.title) {
      elem.removeChild(elem.querySelector('.popup__title'));
    } else {
      elem.querySelector('.popup__title').innerHTML = options.title;
    }

    promise.then(function (result) {
      elem.insertAdjacentHTML('beforeend', result);
      document.body.appendChild(wrap);

      if (typeof params.onAfterAppend === 'function') {
        params.onAfterAppend(wrap);
      }
    }, function (error) {
      elem.insertAdjacentHTML('afterBegin', 'Something went wrong');
      console.log(error);
    });
    var closing = false;
    var ANIMATION_SPEED = 200;

    var escClickHandler = function escClickHandler(evt) {
      if (evt.keyCode === 27) {
        methods.close();
      }
    };
    /**
     * @type {{close(): void, open(): void}}
     */


    var methods = {
      open: function open() {
        !closing && wrap.classList.add('popup_open');
        setPadding(getScrollBarWidth() + 'px');
        document.addEventListener('keydown', escClickHandler);

        if (typeof params.onAfterOpen === 'function') {
          params.onAfterOpen(wrap);
        }
      },
      close: function close() {
        closing = true;
        wrap.classList.remove('popup_open');
        wrap.classList.add('popup_hide');
        setTimeout(function () {
          wrap.classList.remove('popup_hide');
          setPadding(0);
          document.removeEventListener('keydown', escClickHandler);
          closing = false;
        }, ANIMATION_SPEED);

        if (typeof params.onAfterClose === 'function') {
          params.onAfterClose(wrap);
        }
      }
    };
    wrap.addEventListener('click', function (ev) {
      if (ev.target.dataset.close) {
        methods.close();
      }
    });
    return methods;
  };
  /**
   * Чтобы не передавать options при каждом открытии попапа
   * можно заранее назначить некоторые опции
   *
   * @param params
   */


  window.legancyPopupInit = function (params) {
    params = _typeof(params) === 'object' ? params : {};
    defaultOptions = Object.assign({}, defaultOptions, params);
  };
})(window);
"use strict";

;

(function () {
  function selectStyle(wrapper) {
    var parent = wrapper ? wrapper : document;
    var selects = parent.querySelectorAll('.js-select');

    if (selects.length) {
      selects.forEach(function (select) {
        var trigger = select.querySelector('.js-select-trigger');
        var dropdown = select.querySelector('.js-select-dropdown');
        var changeOptions = select.querySelectorAll('.js-default-checked-change-select');
        var selected = select.querySelector('.js-default-checked-select');

        if (dropdown.clientHeight > 200) {
          var ps = new PerfectScrollbar(dropdown, {
            wheelPropagation: false
          });
          dropdown.style.height = dropdown.scrollHeight + 'px';
          dropdown.style.overflow = 'hidden';
        }

        trigger.onclick = function () {
          triggerInit();
        };

        function triggerInit() {
          if (select.classList.contains('active')) {
            select.classList.remove('active');
          } else {
            selects.forEach(function (el) {
              el.classList.remove('active');
            });
            select.classList.add('active');
          }
        }

        if (changeOptions.length) {
          changeOptions.forEach(function (changeOption) {
            changeOption.addEventListener('click', function () {
              var html = changeOption.querySelector('span').innerHTML.trim();
              changeOptions.forEach(function (el) {
                el.classList.remove('selected');
              });
              changeOption.classList.add('selected');
              selected.value = html;
              select.classList.remove('active');
            });
          });
        }

        document.addEventListener('click', function (evt) {
          if (evt.target.contains(select)) {
            select.classList.remove('active');
          }
        });
      });
    }
  }

  window.selectStyled = {
    styling: selectStyle
  };
  document.addEventListener('DOMContentLoaded', function () {
    window.selectStyled.styling();
  });
})();
"use strict";

var legancy = {};
window.legancy = legancy;
var Coorp = {
  IS_DEV: window.location.hostname === 'localhost' || window.location.hostname.startsWith('html.dev')
};
window.Coorp = Coorp;
"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

;

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var swiperContents = document.querySelectorAll('.js-back-slider');

    if (swiperContents.length) {
      var _iterator = _createForOfIteratorHelper(swiperContents),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var swiperContent = _step.value;
          var prev = swiperContent.querySelector('.js-back-slider-controls .prev');
          var next = swiperContent.querySelector('.js-back-slider-controls .next');
          var swiper = swiperContent.querySelector('.js-back-slider-swiper');

          if (swiper) {
            new Swiper(swiper, {
              slidesPerView: "auto",
              autoplay: {
                delay: 3000
              },
              loop: true,
              navigation: {
                prevEl: prev,
                nextEl: next
              }
            });
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  });
})();
"use strict";

;

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var bSlider = document.querySelector('.js-banner-slider');

    if (bSlider) {
      var swiper = document.querySelector('.js-banner-slider-swiper');
      var toggle = document.querySelector('.js-banner-slider-toggle');
      var content = document.querySelector('.js-banner-slider-content');
      toggle.addEventListener('click', function () {
        var isActive = !toggle.classList.contains('active');
        toggle.classList[isActive ? 'add' : 'remove']('active');
        content.classList[isActive ? 'add' : 'remove']('active');
        content.style.height = isActive ? content.scrollHeight + 'px' : '0';
      });
      new Swiper(swiper, {
        slidesPerView: 'auto',
        spaceBetween: 40,
        navigation: {
          prevEl: ".swiper-nav__prev",
          nextEl: ".swiper-nav__next"
        }
      });
    }
  });
})();
"use strict";

;

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var slider = document.querySelector('.js-companies-slider');

    if (slider) {
      new Swiper(slider, {
        slidesPerView: "auto",
        autoplay: {
          delay: 2000
        },
        loop: true,
        navigation: {
          prevEl: '.js-companies-slider-prev',
          nextEl: '.js-companies-slider-next'
        }
      });
    }
  });
})();
"use strict";

;

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var header = document.querySelector('.js-header');

    if (header) {
      var isUp = window.pageYOffset === 0;

      if (!isUp) {
        header.classList.add('active');
      }

      header.addEventListener('mouseover', function () {
        header.classList.add('active');
      });
      header.addEventListener('mouseleave', function () {
        var select = header.querySelector('.js-select');
        select.classList.remove('active');
        if (!isUp) return;
        header.classList.remove('active');
      });
      window.addEventListener('scroll', function () {
        isUp = window.pageYOffset === 0;
        header.classList[isUp ? 'remove' : 'add']('active');
      });
    }
  });
})();
"use strict";

;

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var preview = document.querySelector('.js-preview');

    if (preview) {
      var video = preview.querySelector('.js-preview-video');
      var control = preview.querySelector('.js-preview-video-control');

      if (video) {
        video.loop = false;
        video.volume = 0;
        var isPlayed = false;
        video.addEventListener('timeupdate', function () {
          if (video.ended) {
            video.load();
            video.click();
          }
        });
        preview.addEventListener('click', function () {
          isPlayed = !isPlayed;

          if (isPlayed) {
            video.play();
            control.classList.add('active');
            var tID = setTimeout(function () {
              control.classList.add('hide');
              clearTimeout(tID);
            }, 2000);
          } else {
            video.pause();
            control.classList.remove('hide');
            control.classList.remove('active');
          }
        });
      }
    }
  });
})();
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// Scroll top
legancy.scrollTop = function (options) {
  options = _typeof(options) === 'object' ? options : {};
  var scroll = document.createElement('div');
  scroll.classList.add('scroll-top');
  scroll.innerHTML = '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 32h62M50 20l12 12-12 12" stroke="#fff" stroke-width="2"/></svg>';
  scroll.addEventListener('click', function () {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  var showTop = options.showTop || 500;

  var scrollTop = function scrollTop() {
    var scrollTop = window.scrollY || document.body.scrollTop || document.documentElement.scrollTop;

    if (scrollTop > showTop) {
      scroll.classList.add('scroll-top_show');
    } else {
      scroll.classList.remove('scroll-top_show');
    }
  };

  scrollTop();
  window.addEventListener('scroll', scrollTop);
  return {
    init: function init() {
      document.body.appendChild(scroll);
    },
    destroy: function destroy() {
      document.body.removeChild(scroll);
      window.removeEventListener('scroll', scrollTop);
    }
  };
};
"use strict";

;

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var shops = document.querySelector('.shops');

    if (shops) {
      (function () {
        var items = shops.querySelectorAll('.shops__item');
        var itemsImages = shops.querySelectorAll('.shops__item .shops__item-img');

        if (items.length) {
          var _loop = function _loop(i) {
            itemsImages[i].addEventListener('mouseover', function () {
              items.forEach(function (_i) {
                if (items[i] === _i) return;

                _i.classList.add('hide');
              });
            });
            itemsImages[i].addEventListener('mouseleave', function () {
              items.forEach(function (i) {
                return i.classList.remove('hide');
              });
            });
          };

          for (var i = 0; i !== itemsImages.length; i++) {
            _loop(i);
          }
        }
      })();
    }
  });
})();
"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

// LazyLoad
;

(function () {
  // Set the options to make LazyLoad self-initialize
  window.lazyLoadOptions = {
    elements_selector: '.lazy' // ... more custom settings?

  }; // Listen to the initialization event and get the instance of LazyLoad

  window.addEventListener('LazyLoad::Initialized', function (event) {
    window.lazyLoadInstance = event.detail.instance;
    window.lazyLoadInstance.update();
  }, false);
})() // SVG
;

(function () {
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/svg4everybody/2.1.9/svg4everybody.min.js', function () {
    svg4everybody();
  });
})();

function chunk(arr, len) {
  var chunks = [],
      i = 0,
      n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }

  return chunks;
}

;

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var catalogList = document.querySelector('.js-catalog-list');

    if (catalogList) {
      var liS = Array.prototype.slice.call(catalogList.querySelectorAll('.catalog__item'), 0);

      if (liS.length) {
        var ch = chunk(liS, 3);
        var l = ch[ch.length - 1].length;
        var block = ch[ch.length - 1];
        var item = block[block.length - 1];

        if (ch[ch.length - 2][0].classList.contains('catalog__item-wide')) {
          return;
        }

        switch (l) {
          case 2:
            {
              item.classList.add('catalog_last');
              break;
            }
        }
      }
    }
  });
})();

;

(function () {
  document.addEventListener('DOMContentLoaded', defaultTabs.init);
})();

;

(function () {
  function PhoneMaskInit(p) {
    var mask = function mask(_p) {
      Inputmask('+7 (999) 999 99 99').mask(_p);
    };

    if (p) {
      mask(p);
      return;
    }

    var phones = document.querySelectorAll('.js-phone-mask');

    if (phones.length) {
      var _iterator = _createForOfIteratorHelper(phones),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var phone = _step.value;
          mask(phone);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    return PhoneMaskInit();
  });
  window.PhoneMask = {
    init: PhoneMaskInit
  };
})();

;

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    legancyPopupInit({
      paddingRightElements: ['.wh']
    });
    var formFeedbackPopup = document.querySelector('.js-form-feedback');
    var btns = document.querySelectorAll('[data-popup="form-feedback"]');

    if (formFeedbackPopup) {
      (function () {
        var ffPopup = legancyPopup({
          content: formFeedbackPopup,
          title: false,
          close: false,
          onAfterAppend: function onAfterAppend(result) {
            formFeedbackPopup.remove();
          }
        });

        if (btns.length) {
          var _iterator2 = _createForOfIteratorHelper(btns),
              _step2;

          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var btn = _step2.value;
              btn.addEventListener('click', function () {
                ffPopup.open();
              });
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      })();
    }
  });
})();