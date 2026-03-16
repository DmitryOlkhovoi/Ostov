// Vitest setup file — replaces the old QUnit/Karma environment.
// Provides global Backbone, _, and $ for all test files.

import Backbone, { _ } from '../../dist/backbone.js';

// --- Mini-$ shim (from test/vendor/mini-$.js) ---
function $(selector) {
  if (!(this instanceof $)) return new $(selector);

  if (selector instanceof $) {
    this._els = selector._els.slice();
  } else if (Array.isArray(selector)) {
    this._els = selector.filter(function(n) { return n && n.nodeType; });
  } else if (selector && selector.nodeType) {
    this._els = [selector];
  } else if (typeof selector === 'string') {
    if (/^\s*</.test(selector)) {
      var tmp = document.createElement('div');
      tmp.innerHTML = selector.trim();
      this._els = Array.from(tmp.childNodes);
    } else {
      this._els = Array.from(document.querySelectorAll(selector));
    }
  } else {
    this._els = [];
  }

  for (var i = 0; i < this._els.length; i++) this[i] = this._els[i];
  this.length = this._els.length;
  this._listeners = [];
}

$.fn = $.prototype;
$.fn.jquery = 'mini';

$.fn.get = function(i) {
  return i == null ? this._els.slice() : this._els[i];
};

$.fn.on = function(eventName, handler) {
  var self = this;
  this._els.forEach(function(el) {
    el.addEventListener(eventName, handler);
    self._listeners.push({el: el, eventName: eventName, handler: handler});
  });
  return this;
};

$.fn.off = function(eventName, handler) {
  var remaining = [];
  this._listeners.forEach(function(entry) {
    var matches = entry.eventName === eventName &&
                  (handler == null || entry.handler === handler);
    if (matches) {
      entry.el.removeEventListener(entry.eventName, entry.handler);
    } else {
      remaining.push(entry);
    }
  });
  this._listeners = remaining;
  return this;
};

$.fn.trigger = function(eventName) {
  this._els.forEach(function(el) {
    var event = (eventName === 'click' || eventName === 'dblclick')
      ? new MouseEvent(eventName, {bubbles: true, cancelable: true})
      : new CustomEvent(eventName, {bubbles: true, cancelable: true});
    el.dispatchEvent(event);
  });
  return this;
};

$.fn.append = function(html) {
  this._els.forEach(function(el) {
    if (typeof html === 'string') {
      el.insertAdjacentHTML('beforeend', html);
    } else if (html && html.nodeType) {
      el.appendChild(html);
    }
  });
  return this;
};

$.fn.remove = function() {
  this._els.forEach(function(el) {
    if (el.parentNode) el.parentNode.removeChild(el);
  });
  return this;
};

$.fn.is = function(selector) {
  return this._els.some(function(el) {
    return el.matches && el.matches(selector);
  });
};

$.fn.has = function(selector) {
  return this._els.some(function(el) {
    return el.querySelector && el.querySelector(selector) !== null;
  });
};

$.fn.attr = function(name, value) {
  if (value === undefined) {
    return this._els[0] ? this._els[0].getAttribute(name) : undefined;
  }
  this._els.forEach(function(el) { el.setAttribute(name, value); });
  return this;
};

$.fn.click = function() {
  return this.trigger('click');
};

// --- Test-only utils (from test/vendor/test-utils.js) ---
_.bind = function(fn, context) {
  var args = Array.prototype.slice.call(arguments, 2);
  return function() {
    return fn.apply(context, args.concat(Array.prototype.slice.call(arguments)));
  };
};

_.debounce = function(fn, wait, immediate) {
  var timeout;
  return function() {
    var ctx = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) fn.apply(ctx, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) fn.apply(ctx, args);
  };
};

// --- DOM fixtures ---
['qunit-fixture'].forEach(function(id) {
  if (!document.getElementById(id)) {
    var el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  }
});

// --- Set globals ---
globalThis.Backbone = Backbone;
globalThis._ = _;
globalThis.$ = $;

// Set Backbone.$ to use the mini-$ shim
Backbone.$ = $;

// --- Per-test environment setup (from test/setup/environment.js) ---
const originalSync = Backbone.sync;
const originalAjax = Backbone.ajax;
const originalEmulateHTTP = Backbone.emulateHTTP;
const originalEmulateJSON = Backbone.emulateJSON;

// Store per-test environment
globalThis.env = {};

import { beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  // Reset the env object for each test
  globalThis.env = {};

  // We never want to actually call pushState/replaceState during tests.
  window.history.pushState = function() {};
  window.history.replaceState = function() {};

  // Capture ajax settings for comparison.
  Backbone.ajax = function(settings) {
    globalThis.env.ajaxSettings = settings;
  };

  // Capture the arguments to Backbone.sync for comparison.
  Backbone.sync = function(method, model, options) {
    globalThis.env.syncArgs = {
      method: method,
      model: model,
      options: options
    };
    originalSync.apply(this, arguments);
  };
});

afterEach(() => {
  Backbone.sync = originalSync;
  Backbone.ajax = originalAjax;
  Backbone.emulateHTTP = originalEmulateHTTP;
  Backbone.emulateJSON = originalEmulateJSON;
  // Note: history.pushState/replaceState will be restored by jsdom between tests
});
