// Minimal jQuery shim for Backbone tests.
// Covers only what the test suite uses; not a general-purpose jQuery clone.
(function(root) {
  'use strict';

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
    this._listeners = [];  // tracked listeners for .off()
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

  root.$ = $;

})(typeof self !== 'undefined' ? self : global);
