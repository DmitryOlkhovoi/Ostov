//     Backbone.js 1.6.1

//     (c) 2010-2024 Jeremy Ashkenas and DocumentCloud
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(factory) {

  // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
  // We use `self` instead of `window` for `WebWorker` support.
  var root = typeof self == 'object' && self.self === self && self ||
            typeof global == 'object' && global.global === global && global;

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['./utils', 'exports'], function(_, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _);
    });

  // Next for Node.js or CommonJS.
  } else if (typeof exports !== 'undefined') {
    var _ = require('./utils');
    factory(root, exports, _);

  // Finally, as a browser global.
  // utils.js must be loaded before backbone.js; it sets root._.
  } else {
    root.Backbone = factory(root, {}, root._);
  }

})(function(root, Backbone, _) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  const previousBackbone = root.Backbone;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.6.1';

  // Backbone.$ can be set to jQuery (or a compatible library) by the user if
  // they want jQuery-powered DOM helpers. Backbone itself no longer requires it.
  Backbone.$ = null;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... this will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // a custom event channel. You may bind a callback to an event with `on` or
  // remove with `off`; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  const Events = Backbone.Events = {};

  // Regular expression used to split event strings.
  const eventSplitter = /\s+/;

  // A private global variable to share between listeners and listenees.
  let _listening;

  // Iterates over the standard `event, callback` (as well as the fancy multiple
  // space-separated events `"change blur", callback` and jQuery-style event
  // maps `{event: callback}`).
  const eventsApi = (iteratee, events, name, callback, opts) => {
    let i = 0, names;
    if (name && typeof name === 'object') {
      // Handle event maps.
      if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
      for (names = Object.keys(name); i < names.length ; i++) {
        events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
      }
    } else if (name && eventSplitter.test(name)) {
      // Handle space-separated event names by delegating them individually.
      for (names = name.split(eventSplitter); i < names.length; i++) {
        events = iteratee(events, names[i], callback, opts);
      }
    } else {
      // Finally, standard events.
      events = iteratee(events, name, callback, opts);
    }
    return events;
  };

  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  Events.on = function(name, callback, context) {
    this._events = eventsApi(onApi, this._events || {}, name, callback, {
      context: context,
      ctx: this,
      listening: _listening
    });

    if (_listening) {
      const listeners = this._listeners || (this._listeners = {});
      listeners[_listening.id] = _listening;
      // Allow the listening to use a counter, instead of tracking
      // callbacks for library interop
      _listening.interop = false;
    }

    return this;
  };

  // Inversion-of-control versions of `on`. Tell *this* object to listen to
  // an event in another object... keeping track of what it's listening to
  // for easier unbinding later.
  Events.listenTo = function(obj, name, callback) {
    if (!obj) return this;
    const id = obj._listenId || (obj._listenId = _.uniqueId('l'));
    const listeningTo = this._listeningTo || (this._listeningTo = {});
    let listening = _listening = listeningTo[id];

    // This object is not listening to any other events on `obj` yet.
    // Setup the necessary references to track the listening callbacks.
    if (!listening) {
      this._listenId || (this._listenId = _.uniqueId('l'));
      listening = _listening = listeningTo[id] = new Listening(this, obj);
    }

    // Bind callbacks on obj.
    const error = tryCatchOn(obj, name, callback, this);
    _listening = void 0;

    if (error) throw error;
    // If the target obj is not Backbone.Events, track events manually.
    if (listening.interop) listening.on(name, callback);

    return this;
  };

  // The reducing API that adds a callback to the `events` object.
  const onApi = (events, name, callback, options) => {
    if (callback) {
      const handlers = events[name] || (events[name] = []);
      const context = options.context, ctx = options.ctx, listening = options.listening;
      if (listening) listening.count++;

      handlers.push({callback: callback, context: context, ctx: context || ctx, listening: listening});
    }
    return events;
  };

  // An try-catch guarded #on function, to prevent poisoning the global
  // `_listening` variable.
  const tryCatchOn = (obj, name, callback, context) => {
    try {
      obj.on(name, callback, context);
    } catch (e) {
      return e;
    }
  };

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  Events.off = function(name, callback, context) {
    if (!this._events) return this;
    this._events = eventsApi(offApi, this._events, name, callback, {
      context: context,
      listeners: this._listeners
    });

    return this;
  };

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  Events.stopListening = function(obj, name, callback) {
    const listeningTo = this._listeningTo;
    if (!listeningTo) return this;

    const ids = obj ? [obj._listenId] : Object.keys(listeningTo);
    for (let i = 0; i < ids.length; i++) {
      const listening = listeningTo[ids[i]];

      // If listening doesn't exist, this object is not currently
      // listening to obj. Break out early.
      if (!listening) break;

      listening.obj.off(name, callback, this);
      if (listening.interop) listening.off(name, callback);
    }
    if (_.isEmpty(listeningTo)) this._listeningTo = void 0;

    return this;
  };

  // The reducing API that removes a callback from the `events` object.
  const offApi = (events, name, callback, options) => {
    if (!events) return;

    const context = options.context, listeners = options.listeners;
    let i = 0, names;

    // Delete all event listeners and "drop" events.
    if (!name && !context && !callback) {
      for (names = Object.keys(listeners || {}); i < names.length; i++) {
        listeners[names[i]].cleanup();
      }
      return;
    }

    names = name ? [name] : Object.keys(events);
    for (; i < names.length; i++) {
      name = names[i];
      const handlers = events[name];

      // Bail out if there are no events stored.
      if (!handlers) break;

      // Find any remaining events.
      const remaining = [];
      for (let j = 0; j < handlers.length; j++) {
        const handler = handlers[j];
        if (
          callback && callback !== handler.callback &&
            callback !== handler.callback._callback ||
              context && context !== handler.context
        ) {
          remaining.push(handler);
        } else {
          const listening = handler.listening;
          if (listening) listening.off(name, callback);
        }
      }

      // Replace events if there are any remaining.  Otherwise, clean up.
      if (remaining.length) {
        events[name] = remaining;
      } else {
        delete events[name];
      }
    }

    return events;
  };

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, its listener will be removed. If multiple events
  // are passed in using the space-separated syntax, the handler will fire
  // once for each event, not once for a combination of all events.
  Events.once = function(name, callback, context) {
    // Map the event into a `{event: once}` object.
    const events = eventsApi(onceMap, {}, name, callback, this.off.bind(this));
    if (typeof name === 'string' && context == null) callback = void 0;
    return this.on(events, callback, context);
  };

  // Inversion-of-control versions of `once`.
  Events.listenToOnce = function(obj, name, callback) {
    // Map the event into a `{event: once}` object.
    const events = eventsApi(onceMap, {}, name, callback, this.stopListening.bind(this, obj));
    return this.listenTo(obj, events);
  };

  // Reduces the event callbacks into a map of `{event: onceWrapper}`.
  // `offer` unbinds the `onceWrapper` after it has been called.
  const onceMap = (map, name, callback, offer) => {
    if (callback) {
      const once = map[name] = _.once(function() {
        offer(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
    }
    return map;
  };

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  Events.trigger = function(name, ...args) {
    if (!this._events) return this;
    eventsApi(triggerApi, this._events, name, void 0, args);
    return this;
  };

  // Handles triggering the appropriate event callbacks.
  const triggerApi = (objEvents, name, callback, args) => {
    if (objEvents) {
      const events = objEvents[name];
      let allEvents = objEvents.all;
      if (events && allEvents) allEvents = allEvents.slice();
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, [name].concat(args));
    }
    return objEvents;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  const triggerEvents = (events, args) => {
    let ev, i = -1;
    const l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  // A listening class that tracks and cleans up memory bindings
  // when all callbacks have been offed.
  class Listening {
    constructor(listener, obj) {
      this.id = listener._listenId;
      this.listener = listener;
      this.obj = obj;
      this.interop = true;
      this.count = 0;
      this._events = void 0;
    }

    // Offs a callback (or several).
    // Uses an optimized counter if the listenee uses Backbone.Events.
    // Otherwise, falls back to manual tracking to support events
    // library interop.
    off(name, callback) {
      let cleanup;
      if (this.interop) {
        this._events = eventsApi(offApi, this._events, name, callback, {
          context: void 0,
          listeners: void 0
        });
        cleanup = !this._events;
      } else {
        this.count--;
        cleanup = this.count === 0;
      }
      if (cleanup) this.cleanup();
    }

    // Cleans up memory bindings between the listener and the listenee.
    cleanup() {
      delete this.listener._listeningTo[this.obj._listenId];
      if (!this.interop) delete this.obj._listeners[this.id];
    }
  }

  Listening.prototype.on = Events.on;

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Base class for all Backbone classes, with Events mixed in.
  class BackboneBase {}
  Object.assign(BackboneBase.prototype, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  class Model extends BackboneBase {
    constructor(attributes, options = {}) {
      super();
      let attrs = attributes || {};
      this.preinitialize.apply(this, arguments);
      this.cid = _.uniqueId(this.cidPrefix);
      this.attributes = {};
      if (options.collection) this.collection = options.collection;
      if (options.parse) attrs = this.parse(attrs, options) || {};
      const defaults = _.result(this, 'defaults');
      // Just _.defaults would work fine, but the additional _.extends
      // is in there for historical reasons. See #3843.
      attrs = _.defaults({...defaults, ...attrs}, defaults);
      this.set(attrs, options);
      this.changed = {};
      this.initialize.apply(this, arguments);
    }

    // Return a copy of the model's `attributes` object.
    toJSON(options) {
      return _.clone(this.attributes);
    }

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync() {
      return Backbone.sync.apply(this, arguments);
    }

    // Get the value of an attribute.
    get(attr) {
      return this.attributes[attr];
    }

    // Get the HTML-escaped value of an attribute.
    escape(attr) {
      return _.escape(this.get(attr));
    }

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has(attr) {
      return this.get(attr) != null;
    }

    // Special-cased proxy to underscore's `_.matches` method.
    matches(attrs) {
      return !!_.iteratee(attrs, this)(this.attributes);
    }

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set(key, val, options = {}) {
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      let attrs;
      if (typeof key === 'object') {
        attrs = key;
        options = val || {};
      } else {
        (attrs = {})[key] = val;
      }

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      const unset      = options.unset;
      const silent     = options.silent;
      const changes    = [];
      const changing   = this._changing;
      this._changing = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }

      const current = this.attributes;
      const changed = this.changed;
      const prev    = this._previousAttributes;

      // For each `set` attribute, update or delete the current value.
      for (const attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          changed[attr] = val;
        } else {
          delete changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Update the `id`.
      if (this.idAttribute in attrs) {
        const prevId = this.id;
        this.id = this.get(this.idAttribute);
        if (this.id !== prevId) {
          this.trigger('changeId', this, prevId, options);
        }
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (let i = 0; i < changes.length; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    }

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset(attr, options) {
      return this.set(attr, void 0, {...options, unset: true});
    }

    // Clear all attributes on the model, firing `"change"`.
    clear(options) {
      const attrs = {};
      for (const key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, {...options, unset: true});
    }

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    }

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      const old = this._changing ? this._previousAttributes : this.attributes;
      const changed = {};
      let hasChanged;
      for (const attr in diff) {
        const val = diff[attr];
        if (_.isEqual(old[attr], val)) continue;
        changed[attr] = val;
        hasChanged = true;
      }
      return hasChanged ? changed : false;
    }

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    }

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes() {
      return _.clone(this._previousAttributes);
    }

    // Fetch the model from the server, merging the response with the model's
    // local attributes. Any changed attributes will trigger a "change" event.
    fetch(options) {
      options = {parse: true, ...options};
      const success = options.success;
      options.success = (resp) => {
        const serverAttrs = options.parse ? this.parse(resp, options) : resp;
        if (!this.set(serverAttrs, options)) return false;
        if (success) success.call(options.context, this, resp, options);
        this.trigger('sync', this, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    }

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save(key, val, options) {
      // Handle both `"key", value` and `{key: value}` -style arguments.
      let attrs;
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = {validate: true, parse: true, ...options};
      const wait = options.wait;

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !wait) {
        if (!this.set(attrs, options)) return false;
      } else if (!this._validate(attrs, options)) {
        return false;
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      const success = options.success;
      const attributes = this.attributes;
      options.success = (resp) => {
        // Ensure attributes are restored during synchronous saves.
        this.attributes = attributes;
        let serverAttrs = options.parse ? this.parse(resp, options) : resp;
        if (wait) serverAttrs = {...attrs, ...serverAttrs};
        if (serverAttrs && !this.set(serverAttrs, options)) return false;
        if (success) success.call(options.context, this, resp, options);
        this.trigger('sync', this, resp, options);
      };
      wrapError(this, options);

      // Set temporary attributes if `{wait: true}` to properly find new ids.
      if (attrs && wait) this.attributes = {...attributes, ...attrs};

      const method = this.isNew() ? 'create' : options.patch ? 'patch' : 'update';
      if (method === 'patch' && !options.attrs) options.attrs = attrs;
      const xhr = this.sync(method, this, options);

      // Restore attributes.
      this.attributes = attributes;

      return xhr;
    }

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy(options) {
      options = {...options || {}};
      const success = options.success;
      const wait = options.wait;

      const destroy = () => {
        this.stopListening();
        this.trigger('destroy', this, this.collection, options);
      };

      options.success = (resp) => {
        if (wait) destroy();
        if (success) success.call(options.context, this, resp, options);
        if (!this.isNew()) this.trigger('sync', this, resp, options);
      };

      let xhr = false;
      if (this.isNew()) {
        _.defer(options.success);
      } else {
        wrapError(this, options);
        xhr = this.sync('delete', this, options);
      }
      if (!wait) destroy();
      return xhr;
    }

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url() {
      const base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      const id = this.get(this.idAttribute);
      return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
    }

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse(resp, options) {
      return resp;
    }

    // Create a new model with identical attributes to this one.
    clone() {
      return new this.constructor(this.attributes);
    }

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew() {
      return !this.has(this.idAttribute);
    }

    // Check if the model is currently in a valid state.
    isValid(options) {
      return this._validate({}, {...options, validate: true});
    }

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = {...this.attributes, ...attrs};
      const error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, {...options, validationError: error});
      return false;
    }
  }

  // A hash of attributes whose current and previous value differ.
  Model.prototype.changed = null;
  // The value returned during the last failed validation.
  Model.prototype.validationError = null;
  // The default name for the JSON `id` attribute is `"id"`.
  Model.prototype.idAttribute = 'id';
  // The prefix is used to create the client id which is used to identify models locally.
  Model.prototype.cidPrefix = 'c';
  // preinitialize/initialize are empty by default. Override with your own logic.
  Model.prototype.preinitialize = function(){};
  Model.prototype.initialize = function(){};

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analogous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Default options for `Collection#set`.
  const setOptions = {add: true, remove: true, merge: true};
  const addOptions = {add: true, remove: false};

  // Splices `insert` into `array` at index `at`.
  const splice = (array, insert, at) => {
    at = Math.min(Math.max(at, 0), array.length);
    const tail = Array(array.length - at);
    const length = insert.length;
    let i;
    for (i = 0; i < tail.length; i++) tail[i] = array[i + at];
    for (i = 0; i < length; i++) array[i + at] = insert[i];
    for (i = 0; i < tail.length; i++) array[i + length + at] = tail[i];
  };

  class Collection extends BackboneBase {
    constructor(models, options = {}) {
      super();
      this.preinitialize.apply(this, arguments);
      if (options.model) this.model = options.model;
      if (options.comparator !== void 0) this.comparator = options.comparator;
      this._reset();
      this.initialize.apply(this, arguments);
      if (models) this.reset(models, {silent: true, ...options});
    }

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON(options) {
      return this.map(model => model.toJSON(options));
    }

    // Proxy `Backbone.sync` by default.
    sync() {
      return Backbone.sync.apply(this, arguments);
    }

    // Add a model, or list of models to the set. `models` may be Backbone
    // Models or raw JavaScript objects to be converted to Models, or any
    // combination of the two.
    add(models, options) {
      return this.set(models, {...{merge: false}, ...options, ...addOptions});
    }

    // Remove a model, or a list of models from the set.
    remove(models, options) {
      options = {...options};
      const singular = !Array.isArray(models);
      models = singular ? [models] : models.slice();
      const removed = this._removeModels(models, options);
      if (!options.silent && removed.length) {
        options.changes = {added: [], merged: [], removed: removed};
        this.trigger('update', this, options);
      }
      return singular ? removed[0] : removed;
    }

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set(models, options) {
      if (models == null) return;

      options = {...setOptions, ...options};
      if (options.parse && !this._isModel(models)) {
        models = this.parse(models, options) || [];
      }

      const singular = !Array.isArray(models);
      models = singular ? [models] : models.slice();

      let at = options.at;
      if (at != null) at = +at;
      if (at > this.length) at = this.length;
      if (at < 0) at += this.length + 1;

      const set = [];
      const toAdd = [];
      const toMerge = [];
      const toRemove = [];
      const modelMap = {};

      const add = options.add;
      const merge = options.merge;
      const remove = options.remove;

      let sort = false;
      const sortable = this.comparator && at == null && options.sort !== false;
      const sortAttr = typeof this.comparator === 'string' ? this.comparator : null;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      let model, i;
      for (i = 0; i < models.length; i++) {
        model = models[i];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        let existing = this.get(model);
        if (existing) {
          if (merge && model !== existing) {
            let attrs = this._isModel(model) ? model.attributes : model;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            toMerge.push(existing);
            if (sortable && !sort) sort = existing.hasChanged(sortAttr);
          }
          if (!modelMap[existing.cid]) {
            modelMap[existing.cid] = true;
            set.push(existing);
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(model, options);
          if (model) {
            toAdd.push(model);
            this._addReference(model, options);
            modelMap[model.cid] = true;
            set.push(model);
          }
        }
      }

      // Remove stale models.
      if (remove) {
        for (i = 0; i < this.length; i++) {
          model = this.models[i];
          if (!modelMap[model.cid]) toRemove.push(model);
        }
        if (toRemove.length) this._removeModels(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      let orderChanged = false;
      const replace = !sortable && add && remove;
      if (set.length && replace) {
        orderChanged = this.length !== set.length || _.some(this.models, (m, index) => {
          return m !== set[index];
        });
        this.models.length = 0;
        splice(this.models, set, 0);
        this.length = this.models.length;
      } else if (toAdd.length) {
        if (sortable) sort = true;
        splice(this.models, toAdd, at == null ? this.length : at);
        this.length = this.models.length;
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort/update events.
      if (!options.silent) {
        for (i = 0; i < toAdd.length; i++) {
          if (at != null) options.index = at + i;
          model = toAdd[i];
          model.trigger('add', model, this, options);
        }
        if (sort || orderChanged) this.trigger('sort', this, options);
        if (toAdd.length || toRemove.length || toMerge.length) {
          options.changes = {
            added: toAdd,
            removed: toRemove,
            merged: toMerge
          };
          this.trigger('update', this, options);
        }
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    }

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset(models, options) {
      options = {...options || {}};
      for (let i = 0; i < this.models.length; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, {silent: true, ...options});
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    }

    // Add a model to the end of the collection.
    push(model, options) {
      return this.add(model, {at: this.length, ...options});
    }

    // Remove a model from the end of the collection.
    pop(options) {
      const model = this.at(this.length - 1);
      return this.remove(model, options);
    }

    // Add a model to the beginning of the collection.
    unshift(model, options) {
      return this.add(model, {at: 0, ...options});
    }

    // Remove a model from the beginning of the collection.
    shift(options) {
      const model = this.at(0);
      return this.remove(model, options);
    }

    // Slice out a sub-array of models from the collection.
    slice() {
      return this.models.slice(...arguments);
    }

    // Get a model from the set by id, cid, model object with id or cid
    // properties, or an attributes object that is transformed through modelId.
    get(obj) {
      if (obj == null) return void 0;
      return this._byId[obj] ||
        this._byId[this.modelId(this._isModel(obj) ? obj.attributes : obj, obj.idAttribute)] ||
        obj.cid && this._byId[obj.cid];
    }

    // Returns `true` if the model is in the collection.
    has(obj) {
      return this.get(obj) != null;
    }

    // Get the model at the given index.
    at(index) {
      if (index < 0) index += this.length;
      return this.models[index];
    }

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where(attrs, first) {
      return this[first ? 'find' : 'filter'](attrs);
    }

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere(attrs) {
      return this.where(attrs, true);
    }

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort(options) {
      let comparator = this.comparator;
      if (!comparator) throw new Error('Cannot sort a set without a comparator');
      options = options || {};

      const length = comparator.length;
      if (typeof comparator === 'function') comparator = comparator.bind(this);

      // Run sort based on type of `comparator`.
      if (length === 1 || typeof comparator === 'string') {
        this.models = this.sortBy(comparator);
      } else {
        this.models.sort(comparator);
      }
      if (!options.silent) this.trigger('sort', this, options);
      return this;
    }

    // Pluck an attribute from each model in the collection.
    pluck(attr) {
      return this.map(attr + '');
    }

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch(options) {
      options = {parse: true, ...options};
      const success = options.success;
      options.success = (resp) => {
        const method = options.reset ? 'reset' : 'set';
        this[method](resp, options);
        if (success) success.call(options.context, this, resp, options);
        this.trigger('sync', this, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    }

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create(model, options) {
      options = {...options || {}};
      const wait = options.wait;
      model = this._prepareModel(model, options);
      if (!model) return false;
      if (!wait) this.add(model, options);
      const success = options.success;
      options.success = (m, resp, callbackOpts) => {
        if (wait) {
          m.off('error', this._forwardPristineError, this);
          this.add(m, callbackOpts);
        }
        if (success) success.call(callbackOpts.context, m, resp, callbackOpts);
      };
      // In case of wait:true, our collection is not listening to any
      // of the model's events yet, so it will not forward the error
      // event. In this special case, we need to listen for it
      // separately and handle the event just once.
      if (wait) {
        model.once('error', this._forwardPristineError, this);
      }
      model.save(null, options);
      return model;
    }

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse(resp, options) {
      return resp;
    }

    // Create a new collection with an identical list of models as this one.
    clone() {
      return new this.constructor(this.models, {
        model: this.model,
        comparator: this.comparator
      });
    }

    // Define how to uniquely identify models in the collection.
    modelId(attrs, idAttribute) {
      return attrs[idAttribute || this.model.prototype.idAttribute || 'id'];
    }

    // Get an iterator of all models in this collection.
    values() {
      return new CollectionIterator(this, ITERATOR_VALUES);
    }

    // Get an iterator of all model IDs in this collection.
    keys() {
      return new CollectionIterator(this, ITERATOR_KEYS);
    }

    // Get an iterator of all [ID, model] tuples in this collection.
    entries() {
      return new CollectionIterator(this, ITERATOR_KEYSVALUES);
    }

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    }

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel(attrs, options) {
      if (this._isModel(attrs)) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options = {...options || {}, collection: this};
      const model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, {...options, validationError: model.validationError});
      return false;
    }

    // Internal method called by both remove and set.
    _removeModels(models, options) {
      const removed = [];
      for (let i = 0; i < models.length; i++) {
        const model = this.get(models[i]);
        if (!model) continue;

        const index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;

        // Remove references before triggering 'remove' event to prevent an
        // infinite loop. #3693
        delete this._byId[model.cid];
        const id = this.modelId(model.attributes, model.idAttribute);
        if (id != null) delete this._byId[id];

        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }

        removed.push(model);
        this._removeReference(model, options);
      }
      if (models.length > 0 && !options.silent) delete options.index;
      return removed;
    }

    // Method for checking whether an object should be considered a model for
    // the purposes of adding to the collection.
    _isModel(model) {
      return model instanceof Model;
    }

    // Internal method to create a model's ties to a collection.
    _addReference(model, options) {
      this._byId[model.cid] = model;
      const id = this.modelId(model.attributes, model.idAttribute);
      if (id != null) this._byId[id] = model;
      model.on('all', this._onModelEvent, this);
    }

    // Internal method to sever a model's ties to a collection.
    _removeReference(model, options) {
      delete this._byId[model.cid];
      const id = this.modelId(model.attributes, model.idAttribute);
      if (id != null) delete this._byId[id];
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    }

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent(event, model, collection, options) {
      if (model) {
        if ((event === 'add' || event === 'remove') && collection !== this) return;
        if (event === 'destroy') this.remove(model, options);
        if (event === 'changeId') {
          const prevId = this.modelId(model.previousAttributes(), model.idAttribute);
          const id = this.modelId(model.attributes, model.idAttribute);
          if (prevId != null) delete this._byId[prevId];
          if (id != null) this._byId[id] = model;
        }
      }
      this.trigger.apply(this, arguments);
    }

    // Internal callback method used in `create`. It serves as a
    // stand-in for the `_onModelEvent` method, which is not yet bound
    // during the `wait` period of the `create` call. We still want to
    // forward any `'error'` event at the end of the `wait` period,
    // hence a customized callback.
    _forwardPristineError(model, collection, options) {
      // Prevent double forward if the model was already in the
      // collection before the call to `create`.
      if (this.has(model)) return;
      this._onModelEvent('error', model, collection, options);
    }
  }

  // The default model for a collection is just a **Backbone.Model**.
  // This should be overridden in most cases.
  Collection.prototype.model = Model;
  // preinitialize/initialize are empty by default. Override with your own logic.
  Collection.prototype.preinitialize = function(){};
  Collection.prototype.initialize = function(){};

  // Defining an @@iterator method implements JavaScript's Iterable protocol.
  // In modern ES2015 browsers, this value is found at Symbol.iterator.
  /* global Symbol */
  const $$iterator = typeof Symbol === 'function' && Symbol.iterator;
  if ($$iterator) {
    Collection.prototype[$$iterator] = Collection.prototype.values;
  }

  // CollectionIterator
  // ------------------

  // A CollectionIterator implements JavaScript's Iterator protocol, allowing the
  // use of `for of` loops in modern browsers and interoperation between
  // Backbone.Collection and other JavaScript functions and third-party libraries
  // which can operate on Iterables.
  var CollectionIterator = function(collection, kind) {
    this._collection = collection;
    this._kind = kind;
    this._index = 0;
  };

  // This "enum" defines the three possible kinds of values which can be emitted
  // by a CollectionIterator that correspond to the values(), keys() and entries()
  // methods on Collection, respectively.
  const ITERATOR_VALUES = 1;
  const ITERATOR_KEYS = 2;
  const ITERATOR_KEYSVALUES = 3;

  // All Iterators should themselves be Iterable.
  if ($$iterator) {
    CollectionIterator.prototype[$$iterator] = function() {
      return this;
    };
  }

  CollectionIterator.prototype.next = function() {
    if (this._collection) {

      // Only continue iterating if the iterated collection is long enough.
      if (this._index < this._collection.length) {
        const model = this._collection.at(this._index);
        this._index++;

        // Construct a value depending on what kind of values should be iterated.
        let value;
        if (this._kind === ITERATOR_VALUES) {
          value = model;
        } else {
          const id = this._collection.modelId(model.attributes, model.idAttribute);
          if (this._kind === ITERATOR_KEYS) {
            value = id;
          } else { // ITERATOR_KEYSVALUES
            value = [id, model];
          }
        }
        return {value: value, done: false};
      }

      // Once exhausted, remove the reference to the collection so future
      // calls to the next method always return done.
      this._collection = void 0;
    }

    return {value: void 0, done: true};
  };

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Cached regex to split keys for `delegate`.
  const delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be set as properties.
  const viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  class View extends BackboneBase {
    // Creating a Backbone.View creates its initial element outside of the DOM,
    // if an existing element is not provided...
    constructor(options) {
      super();
      this.cid = _.uniqueId('view');
      this.preinitialize.apply(this, arguments);
      _.extend(this, _.pick(options, viewOptions));
      this._ensureElement();
      this.initialize.apply(this, arguments);
    }

    // Scoped element lookup inside the view's root element.
    // Returns a Backbone.$-wrapped result when Backbone.$ is set,
    // otherwise a plain NodeList.
    $(selector) {
      const nodes = this.el.querySelectorAll(selector);
      return Backbone.$ ? Backbone.$(Array.from(nodes)) : nodes;
    }

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render() {
      return this;
    }

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove() {
      this.undelegateEvents();
      this._removeElement();
      this.stopListening();
      return this;
    }

    // Remove this view's element from the document and all event listeners
    // attached to it. Exposed for subclasses using an alternative DOM
    // manipulation API.
    _removeElement() {
      _.dom.remove(this.el);
    }

    // Change the view's element (`this.el` property) and re-delegate the
    // view's events on the new element.
    setElement(element) {
      this.undelegateEvents();
      this._setElement(element);
      this.delegateEvents();
      return this;
    }

    // Creates the `this.el` and `this.$el` references for this view using the
    // given `el`. `el` can be a CSS selector string or a DOM element.
    // When Backbone.$ is set, `this.$el` is a wrapped element; otherwise it is
    // the same raw DOM element as `this.el`.
    // Subclasses can override this to utilize an alternative DOM manipulation API.
    _setElement(el) {
      const resolved = _.dom.query(el);
      // For string selectors that don't match anything, keep el as null/falsy.
      // For non-string values (DOM elements, jQuery-like wrappers), fall back.
      this.el = resolved !== null ? resolved : typeof el !== 'string' ? el : null;
      this.$el = Backbone.$ ? Backbone.$(this.el) : this.el;
    }

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    delegateEvents(events) {
      events || (events = _.result(this, 'events'));
      if (!events) return this;
      this.undelegateEvents();
      for (const key in events) {
        let method = events[key];
        if (typeof method !== 'function') method = this[method];
        if (!method) continue;
        const match = key.match(delegateEventSplitter);
        this.delegate(match[1], match[2], method.bind(this));
      }
      return this;
    }

    // Add a single event listener to the view's element (or a child element
    // using `selector`). Uses native addEventListener with namespace tracking.
    delegate(eventName, selector, listener) {
      if (typeof selector !== 'string') {
        listener = selector;
        selector = null;
      }
      _.dom.on(this.el, '.delegateEvents' + this.cid, eventName, selector, listener);
      return this;
    }

    // Clears all callbacks previously bound to the view by `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents() {
      if (this.el) _.dom.off(this.el, '.delegateEvents' + this.cid);
      return this;
    }

    // A finer-grained `undelegateEvents` for removing a single delegated event.
    // `selector` and `listener` are both optional.
    undelegate(eventName, selector, listener) {
      if (typeof selector !== 'string') {
        listener = selector;
        selector = null;
      }
      _.dom.off(this.el, '.delegateEvents' + this.cid, eventName, selector, listener);
      return this;
    }

    // Produces a DOM element to be assigned to your view. Exposed for
    // subclasses using an alternative DOM manipulation API.
    _createElement(tagName) {
      return document.createElement(tagName);
    }

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement() {
      if (!this.el) {
        const attrs = {..._.result(this, 'attributes')};
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        this.setElement(this._createElement(_.result(this, 'tagName')));
        this._setAttributes(attrs);
      } else {
        this.setElement(_.result(this, 'el'));
      }
    }

    // Set attributes from a hash on this view's element.  Exposed for
    // subclasses using an alternative DOM manipulation API.
    _setAttributes(attributes) {
      _.dom.setAttributes(this.el, attributes);
    }
  }

  // The default `tagName` of a View's element is `"div"`.
  View.prototype.tagName = 'div';
  // preinitialize/initialize are empty by default. Override with your own logic.
  View.prototype.preinitialize = function(){};
  View.prototype.initialize = function(){};

  // Proxy Backbone class methods to Underscore functions, wrapping the model's
  // `attributes` object or collection's `models` array behind the scenes.
  //
  // collection.filter(function(model) { return model.get('age') > 10 });
  // collection.each(this.addView);
  //
  // `Function#apply` can be slow so we use the method's arg count, if we know it.
  const addMethod = (base, length, method, attribute) => {
    switch (length) {
      case 1: return function() {
        return base[method](this[attribute]);
      };
      case 2: return function(value) {
        return base[method](this[attribute], value);
      };
      case 3: return function(iteratee, context) {
        return base[method](this[attribute], cb(iteratee, this), context);
      };
      case 4: return function(iteratee, defaultVal, context) {
        return base[method](this[attribute], cb(iteratee, this), defaultVal, context);
      };
      default: return function() {
        return base[method](this[attribute], ...arguments);
      };
    }
  };

  // Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
  const cb = (iteratee, instance) => {
    if (typeof iteratee === 'function') return iteratee;
    if (_.isObject(iteratee) && !instance._isModel(iteratee)) return modelMatcher(iteratee);
    if (typeof iteratee === 'string') return (model) => model.get(iteratee);
    return iteratee;
  };
  const modelMatcher = (attrs) => {
    const matcher = _.matches(attrs);
    return (model) => matcher(model.attributes);
  };

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  const collectionMethods = {forEach: 3, each: 3, map: 3, collect: 3, reduce: 0,
    foldl: 0, inject: 0, reduceRight: 0, foldr: 0, find: 3, detect: 3, filter: 3,
    select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3, includes: 3,
    contains: 3, invoke: 0, max: 3, min: 3, toArray: 1, size: 1, first: 3,
    head: 3, take: 3, initial: 3, rest: 3, tail: 3, drop: 3, last: 3,
    without: 0, difference: 0, indexOf: 3, shuffle: 1, lastIndexOf: 3,
    isEmpty: 1, chain: 1, sample: 3, partition: 3, groupBy: 3, countBy: 3,
    sortBy: 3, indexBy: 3, findIndex: 3, findLastIndex: 3};

  // Underscore methods that we want to implement on the Model, mapped to the
  // number of arguments they take.
  const modelMethods = {keys: 1, values: 1, pairs: 1, invert: 1, pick: 0,
    omit: 0, chain: 1, isEmpty: 1};

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each([
    [Collection, collectionMethods, 'models'],
    [Model, modelMethods, 'attributes']
  ], ([Base, methods, attribute]) => {
    Base.mixin = (obj) => {
      const mappings = _.reduce(_.functions(obj), (memo, name) => {
        memo[name] = 0;
        return memo;
      }, {});
      _.each(mappings, (length, method) => {
        if (obj[method]) Base.prototype[method] = addMethod(obj, length, method, attribute);
      });
    };

    _.each(methods, (length, method) => {
      if (_[method]) Base.prototype[method] = addMethod(_, length, method, attribute);
    });
  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = (method, model, options) => {
    const type = methodMap[method];

    // Default options, unless specified.
    // Must mutate (not replace) `options` so that `options.xhr` set below
    // is visible to callbacks that closed over the same object in sync callers.
    if (!options) options = {};
    _.defaults(options, {emulateHTTP: Backbone.emulateHTTP, emulateJSON: Backbone.emulateJSON});

    // Default JSON-request options.
    const params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      const beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // Pass along `textStatus` and `errorThrown` from jQuery.
    const error = options.error;
    options.error = function(xhr, textStatus, errorThrown) {
      options.textStatus = textStatus;
      options.errorThrown = errorThrown;
      if (error) error.call(options.context, xhr, textStatus, errorThrown);
    };

    // Make the request, allowing the user to override any Ajax options.
    const xhr = options.xhr = Backbone.ajax(Object.assign(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  const methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch': 'PATCH',
    'delete': 'DELETE',
    'read': 'GET'
  };

  // Default implementation of `Backbone.ajax` using the native Fetch API.
  // Override this function if you need custom request handling.
  // The options object follows the jQuery.ajax convention used by Backbone.sync:
  //   type, url, data, contentType, dataType, beforeSend, success, error, context.
  Backbone.ajax = (options) => {
    const method  = (options.type || 'GET').toUpperCase();
    const url     = options.url;
    const headers = {};

    if (options.contentType) headers['Content-Type'] = options.contentType;

    let body;
    if (options.data != null && method !== 'GET') {
      if (options.emulateJSON && typeof options.data === 'object') {
        // Encode as application/x-www-form-urlencoded.
        body = Object.keys(options.data).map((k) => {
          return encodeURIComponent(k) + '=' + encodeURIComponent(options.data[k]);
        }).join('&');
      } else {
        body = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
      }
    }

    const fetchOptions = {method: method, headers: headers};
    if (body !== void 0) fetchOptions.body = body;

    // Allow beforeSend to set additional request headers.
    if (options.beforeSend) {
      const mockXhr = {
        setRequestHeader: (name, value) => { headers[name] = value; }
      };
      options.beforeSend(mockXhr);
    }

    // Provide a minimal xhr-like object (supports abort via AbortController).
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (controller) fetchOptions.signal = controller.signal;

    const xhr = {
      abort: () => { if (controller) controller.abort(); }
    };

    fetch(url, fetchOptions).then((response) => {
      if (!response.ok) {
        const err = new Error('HTTP error ' + response.status);
        err.status = response.status;
        if (options.error) options.error.call(options.context, xhr, response.status, err);
        return;
      }
      const parse = options.dataType === 'json' ||
                  (response.headers.get('content-type') || '').indexOf('json') >= 0
        ? response.json()
        : response.text();
      return parse.then((data) => {
        if (options.success) options.success.call(options.context, data, response.status, xhr);
      });
    })['catch']((err) => {
      if (err && err.name === 'AbortError') return;
      if (options.error) options.error.call(options.context, xhr, 'error', err);
    });

    return xhr;
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  const optionalParam = /\((.*?)\)/g;
  const namedParam    = /(\(\?)?:\w+/g;
  const splatParam    = /\*\w+/g;
  const escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  class Router extends BackboneBase {
    constructor(options = {}) {
      super();
      this.preinitialize.apply(this, arguments);
      if (options.routes) this.routes = options.routes;
      this._bindRoutes();
      this.initialize.apply(this, arguments);
    }

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route(route, name, callback) {
      if (!(route instanceof RegExp)) route = this._routeToRegExp(route);
      if (typeof name === 'function') {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      const router = this;
      Backbone.history.route(route, (fragment) => {
        const args = router._extractParameters(route, fragment);
        if (router.execute(callback, args, name) !== false) {
          router.trigger.apply(router, ['route:' + name].concat(args));
          router.trigger('route', name, args);
          Backbone.history.trigger('route', router, name, args);
        }
      });
      return this;
    }

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute(callback, args, name) {
      if (callback) callback.apply(this, args);
    }

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    }

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      let route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    }

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp(route) {
      route = route.replace(escapeRegExp, '\\$&')
      .replace(optionalParam, '(?:$1)?')
      .replace(namedParam, (match, optional) => {
        return optional ? match : '([^/?]+)';
      })
      .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    }

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters(route, fragment) {
      const params = route.exec(fragment).slice(1);
      return _.map(params, (param, i) => {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }
  }

  // preinitialize/initialize are empty by default. Override with your own logic.
  Router.prototype.preinitialize = function(){};
  Router.prototype.initialize = function(){};

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.

  // Cached regex for stripping a leading hash/slash and trailing space.
  const routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  const rootStripper = /^\/+|\/+$/g;

  // Cached regex for stripping urls of hash.
  const pathStripper = /#.*$/;

  class History extends BackboneBase {
    constructor() {
      super();
      this.handlers = [];
      this.checkUrl = this.checkUrl.bind(this);

      // Ensure that `History` can be used outside of the browser.
      if (typeof window !== 'undefined') {
        this.location = window.location;
        this.history = window.history;
      }
    }

    // Are we at the app root?
    atRoot() {
      const path = this.location.pathname.replace(/[^\/]$/, '$&/');
      return path === this.root && !this.getSearch();
    }

    // Does the pathname match the root?
    matchRoot() {
      const path = this.decodeFragment(this.location.pathname);
      const rootPath = path.slice(0, this.root.length - 1) + '/';
      return rootPath === this.root;
    }

    // Unicode characters in `location.pathname` are percent encoded so they're
    // decoded for comparison. `%25` should not be decoded since it may be part
    // of an encoded parameter.
    decodeFragment(fragment) {
      return decodeURI(fragment.replace(/%25/g, '%2525'));
    }

    // In IE6, the hash fragment and search params are incorrect if the
    // fragment contains `?`.
    getSearch() {
      const match = this.location.href.replace(/#.*/, '').match(/\?.+/);
      return match ? match[0] : '';
    }

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash(window) {
      const match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    }

    // Get the pathname and search params, without the root.
    getPath() {
      const path = this.decodeFragment(
        this.location.pathname + this.getSearch()
      ).slice(this.root.length - 1);
      return path.charAt(0) === '/' ? path.slice(1) : path;
    }

    // Get the cross-browser normalized URL fragment from the path or hash.
    getFragment(fragment) {
      if (fragment == null) {
        if (this._usePushState || !this._wantsHashChange) {
          fragment = this.getPath();
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    }

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start(options) {
      if (History.started) throw new Error('Backbone.history has already been started');
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = {root: '/', ...this.options, ...options};
      this.root             = this.options.root;
      this._trailingSlash   = this.options.trailingSlash;
      this._wantsHashChange = this.options.hashChange !== false;
      this._hasHashChange   = 'onhashchange' in window && (document.documentMode === void 0 || document.documentMode > 7);
      this._useHashChange   = this._wantsHashChange && this._hasHashChange;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.history && this.history.pushState);
      this._usePushState    = this._wantsPushState && this._hasPushState;
      this.fragment         = this.getFragment();

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          const rootPath = this.root.slice(0, -1) || '/';
          this.location.replace(rootPath + '#' + this.getPath());
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot()) {
          this.navigate(this.getHash(), {replace: true});
        }

      }

      // Proxy an iframe to handle location events if the browser doesn't
      // support the `hashchange` event, HTML5 history, or the user wants
      // `hashChange` but not `pushState`.
      if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
        this.iframe = document.createElement('iframe');
        this.iframe.src = 'javascript:0';
        this.iframe.style.display = 'none';
        this.iframe.tabIndex = -1;
        const body = document.body;
        // Using `appendChild` will throw on IE < 9 if the document is not ready.
        const iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
        iWindow.document.open();
        iWindow.document.close();
        iWindow.location.hash = '#' + this.fragment;
      }

      // Add a cross-platform `addEventListener` shim for older browsers.
      const addEventListener = window.addEventListener || function(eventName, listener) {
        return attachEvent('on' + eventName, listener);
      };

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._usePushState) {
        addEventListener('popstate', this.checkUrl, false);
      } else if (this._useHashChange && !this.iframe) {
        addEventListener('hashchange', this.checkUrl, false);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      if (!this.options.silent) return this.loadUrl();
    }

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop() {
      // Add a cross-platform `removeEventListener` shim for older browsers.
      const removeEventListener = window.removeEventListener || function(eventName, listener) {
        return detachEvent('on' + eventName, listener);
      };

      // Remove window listeners.
      if (this._usePushState) {
        removeEventListener('popstate', this.checkUrl, false);
      } else if (this._useHashChange && !this.iframe) {
        removeEventListener('hashchange', this.checkUrl, false);
      }

      // Clean up the iframe if necessary.
      if (this.iframe) {
        document.body.removeChild(this.iframe);
        this.iframe = null;
      }

      // Some environments will throw when clearing an undefined interval.
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    }

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    }

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl() {
      let current = this.getFragment();

      // If the user pressed the back button, the iframe's hash will have
      // changed and we should use that for comparison.
      if (current === this.fragment && this.iframe) {
        current = this.getHash(this.iframe.contentWindow);
      }

      if (current === this.fragment) {
        if (!this.matchRoot()) return this.notfound();
        return false;
      }
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    }

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl(fragment) {
      // If the root doesn't match, no routes can match either.
      if (!this.matchRoot()) return this.notfound();
      fragment = this.fragment = this.getFragment(fragment);
      return _.some(this.handlers, (handler) => {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      }) || this.notfound();
    }

    // When no route could be matched, this method is called internally to
    // trigger the `'notfound'` event. It returns `false` so that it can be used
    // in tail position.
    notfound() {
      this.trigger('notfound');
      return false;
    }

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      // Normalize the fragment.
      fragment = this.getFragment(fragment || '');

      // Strip trailing slash on the root unless _trailingSlash is true
      let rootPath = this.root;
      if (!this._trailingSlash && (fragment === '' || fragment.charAt(0) === '?')) {
        rootPath = rootPath.slice(0, -1) || '/';
      }
      const url = rootPath + fragment;

      // Strip the fragment of the query and hash for matching.
      fragment = fragment.replace(pathStripper, '');

      // Decode for matching.
      const decodedFragment = this.decodeFragment(fragment);

      if (this.fragment === decodedFragment) return;
      this.fragment = decodedFragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._usePushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && fragment !== this.getHash(this.iframe.contentWindow)) {
          const iWindow = this.iframe.contentWindow;

          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if (!options.replace) {
            iWindow.document.open();
            iWindow.document.close();
          }

          this._updateHash(iWindow.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    }

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash(location, fragment, replace) {
      if (replace) {
        const href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }
  }

  // Has the history handling already been started?
  History.started = false;

  // The default interval to poll for hash changes, if necessary, is
  // twenty times a second.
  History.prototype.interval = 50;

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Expose classes on Backbone namespace.
  Backbone.Model = Model;
  Backbone.Collection = Collection;
  Backbone.View = View;
  Backbone.Router = Router;
  Backbone.History = History;

  // Throw an error when a URL is needed, and none is supplied.
  const urlError = () => {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  const wrapError = (model, options) => {
    const error = options.error;
    options.error = function(resp) {
      if (error) error.call(options.context, model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  // Provide useful information when things go wrong. This method is not meant
  // to be used directly; it merely provides the necessary introspection for the
  // external `debugInfo` function.
  // Note: `_` is the built-in utils library (no underscore.js dependency).
  Backbone._debug = () => {
    return {root: root, _: _};
  };

  return Backbone;
});
