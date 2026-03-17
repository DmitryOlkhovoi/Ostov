//     Ostov.js 1.7.6

//     (c) 2010-2024 Olkhovoy Dmitry
//     Ostov may be freely distributed under the MIT license.
//     For all details and documentation:
//     https://ostovjs.org

import _ from './utils.js';

// Establish the root object, `window` (`self`) in the browser, or `global` on the server.
// We use `self` instead of `window` for `WebWorker` support.
const root: Record<string, unknown> =
  (typeof self === 'object' && (self as any).self === self && self) ||
  (typeof globalThis === 'object' && globalThis) ||
  {};

// Initial Setup
// -------------

// Save the previous value of the `Ostov` variable, so that it can be
// restored later on, if `noConflict` is used.
const previousBackbone: unknown = root.Ostov;

// Ostov.Events
// ---------------

// A module that can be mixed in to *any object* in order to provide it with
// a custom event channel. You may bind a callback to an event with `on` or
// remove with `off`; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, Ostov.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//

// Events interface for TypeScript typing
interface EventsHash {
  [event: string]: EventHandler[];
}

interface EventHandler {
  callback: Function;
  context: unknown;
  ctx: unknown;
  listening: Listening | undefined;
}

interface OnApiOptions {
  context: unknown;
  ctx: unknown;
  listening: Listening | undefined;
}

interface OffApiOptions {
  context: unknown;
  listeners: { [id: string]: Listening } | undefined;
}

// --- Options interfaces ---

export interface SyncOptions {
  url?: string;
  attrs?: Record<string, unknown>;
  data?: unknown;
  contentType?: string;
  dataType?: string;
  type?: string;
  processData?: boolean;
  emulateHTTP?: boolean;
  emulateJSON?: boolean;
  parse?: boolean;
  validate?: boolean;
  wait?: boolean;
  patch?: boolean;
  reset?: boolean;
  sort?: boolean;
  silent?: boolean;
  success?: (this: unknown, ...args: unknown[]) => void;
  error?: (this: unknown, ...args: unknown[]) => void;
  beforeSend?: (xhr: { setRequestHeader(name: string, value: string): void }) => void;
  context?: unknown;
  xhr?: XhrLike;
  textStatus?: unknown;
  errorThrown?: unknown;
  [key: string]: unknown;
}

export interface ModelSetOptions<TModel extends Model = Model> {
  unset?: boolean;
  silent?: boolean;
  validate?: boolean;
  parse?: boolean;
  wait?: boolean;
  patch?: boolean;
  sort?: boolean;
  merge?: boolean;
  add?: boolean;
  remove?: boolean;
  at?: number;
  index?: number;
  context?: unknown;
  collection?: Collection<TModel>;
  changes?: { added: TModel[]; removed: TModel[]; merged: TModel[] };
  previousModels?: TModel[];
  success?: (this: unknown, ...args: unknown[]) => void;
  error?: (this: unknown, ...args: unknown[]) => void;
  [key: string]: unknown;
}

export interface XhrLike {
  abort(): void;
  [key: string]: unknown;
}

export interface AjaxOptions {
  type?: string;
  url: string;
  data?: unknown;
  contentType?: string;
  dataType?: string;
  processData?: boolean;
  emulateJSON?: boolean;
  beforeSend?: (xhr: { setRequestHeader(name: string, value: string): void }) => void;
  success?: (this: unknown, data: unknown, status: number, xhr: XhrLike) => void;
  error?: (this: unknown, xhr: XhrLike, status: unknown, err: unknown) => void;
  context?: unknown;
  [key: string]: unknown;
}

/**
 * Ostov.Events is a module that can be mixed in to *any object* in order
 * to provide it with a custom event channel.
 *
 * @example
 * var object = {};
 * _.extend(object, Ostov.Events);
 * object.on('expand', function(){ alert('expanded'); });
 * object.trigger('expand');
 */
export interface EventsMixin {
  /**
   * Bind a callback function to an object.
   * @see http://ostovjs.org/#Events-on
   */
  on(name: string | { [event: string]: Function }, callback?: Function, context?: any): this;

  /**
   * Remove a previously-bound callback function from an object.
   * @see http://ostovjs.org/#Events-off
   */
  off(name?: string | { [event: string]: Function }, callback?: Function, context?: any): this;

  /**
   * Trigger callbacks for the given event.
   * @see http://ostovjs.org/#Events-trigger
   */
  trigger(name: string, ...args: any[]): this;

  /** Alias for on */
  bind(name: string | { [event: string]: Function }, callback?: Function, context?: any): this;
  /** Alias for off */
  unbind(name?: string | { [event: string]: Function }, callback?: Function, context?: any): this;

  /**
   * Just like `on`, but causes the bound callback to only fire once.
   * @see http://ostovjs.org/#Events-once
   */
  once(name: string | { [event: string]: Function }, callback?: Function, context?: any): this;

  /**
   * Tell an object to listen to a particular event on another object.
   * @see http://ostovjs.org/#Events-listenTo
   */
  listenTo(obj: any, name: string | { [event: string]: Function }, callback?: Function): this;

  /**
   * Tell an object to stop listening to events.
   * @see http://ostovjs.org/#Events-stopListening
   */
  stopListening(obj?: any, name?: string | { [event: string]: Function }, callback?: Function): this;

  /**
   * Just like `listenTo`, but causes the bound callback to only fire once.
   * @see http://ostovjs.org/#Events-listenToOnce
   */
  listenToOnce(obj: any, name: string | { [event: string]: Function }, callback?: Function): this;

  _events?: EventsHash;
  _listeners?: { [id: string]: Listening };
  _listeningTo?: { [id: string]: Listening };
  _listenId?: string;
}

// Regular expression used to split event strings.
const eventSplitter: RegExp = /\s+/;

// A private global variable to share between listeners and listenees.
let _listening: Listening | undefined;

// Iterates over the standard `event, callback` (as well as the fancy multiple
// space-separated events `"change blur", callback` and jQuery-style event
// maps `{event: callback}`).
const eventsApi = (iteratee: Function, events: EventsHash | Record<string, Function> | undefined, name: string | Record<string, Function> | undefined, callback: Function | undefined, opts: any): any => {
  let i = 0, names: string[];
  if (name && typeof name === 'object') {
    // Handle event maps.
    if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
    for (names = Object.keys(name); i < names.length; i++) {
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

const EventsImpl: EventsMixin = {} as EventsMixin;

// Bind an event to a `callback` function. Passing `"all"` will bind
// the callback to all events fired.
EventsImpl.on = function(this: any, name: string | { [event: string]: Function }, callback?: Function, context?: any): any {
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
EventsImpl.listenTo = function(this: any, obj: any, name: string | { [event: string]: Function }, callback?: Function): any {
  if (!obj) return this;
  obj._listenId ??= _.uniqueId('l');
  const id: string = obj._listenId;
  this._listeningTo ??= {};
  const listeningTo = this._listeningTo;
  let listening = _listening = listeningTo[id];

  // This object is not listening to any other events on `obj` yet.
  // Setup the necessary references to track the listening callbacks.
  if (!listening) {
    this._listenId ??= _.uniqueId('l');
    listening = _listening = listeningTo[id] = new Listening(this, obj);
  }

  // Bind callbacks on obj.
  const error = tryCatchOn(obj, name, callback, this);
  _listening = void 0;

  if (error) throw error;
  // If the target obj is not Ostov.Events, track events manually.
  if (listening.interop) listening.on(name, callback);

  return this;
};

// The reducing API that adds a callback to the `events` object.
const onApi = (events: EventsHash, name: string, callback: Function | undefined, options: OnApiOptions): EventsHash => {
  if (callback) {
    events[name] ??= [];
    const handlers = events[name];
    const context = options.context, ctx = options.ctx, listening = options.listening;
    if (listening) listening.count++;

    handlers.push({ callback: callback, context: context, ctx: context || ctx, listening: listening });
  }
  return events;
};

// An try-catch guarded #on function, to prevent poisoning the global
// `_listening` variable.
const tryCatchOn = (obj: any, name: string | Record<string, Function>, callback: Function | undefined, context: unknown): unknown => {
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
EventsImpl.off = function(this: any, name?: string | { [event: string]: Function }, callback?: Function, context?: any): any {
  if (!this._events) return this;
  this._events = eventsApi(offApi, this._events, name, callback, {
    context: context,
    listeners: this._listeners
  });

  return this;
};

// Tell this object to stop listening to either specific events ... or
// to every object it's currently listening to.
EventsImpl.stopListening = function(this: any, obj?: any, name?: string | { [event: string]: Function }, callback?: Function): any {
  const listeningTo = this._listeningTo;
  if (!listeningTo) return this;

  const ids: string[] = obj ? [obj._listenId] : Object.keys(listeningTo);
  for (let i = 0; i < ids.length; i++) {
    const listening = listeningTo[ids[i]];

    // If listening doesn't exist, this object is not currently
    // listening to obj. Break out early.
    if (!listening) break;

    listening.obj.off(name, callback, this);
    if (listening.interop) listening.off(name as string, callback);
  }
  if (_.isEmpty(listeningTo)) this._listeningTo = void 0;

  return this;
};

// The reducing API that removes a callback from the `events` object.
const offApi = (events: EventsHash | undefined, name: string, callback: Function | undefined, options: OffApiOptions): EventsHash | undefined => {
  if (!events) return;

  const context = options.context, listeners = options.listeners;
  let i = 0, names: string[];

  // Delete all event listeners and "drop" events.
  if (!name && !context && !callback) {
    for (names = Object.keys(listeners || {}); i < names.length; i++) {
      (listeners as any)[names[i]].cleanup();
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
    const remaining: EventHandler[] = [];
    for (let j = 0; j < handlers.length; j++) {
      const handler = handlers[j];
      if (
        callback && callback !== handler.callback &&
          callback !== (handler.callback as any)._callback ||
            context && context !== handler.context
      ) {
        remaining.push(handler);
      } else {
        handler.listening?.off(name, callback);
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
EventsImpl.once = function(this: any, name: string | { [event: string]: Function }, callback?: Function, context?: any): any {
  // Map the event into a `{event: once}` object.
  const events = eventsApi(onceMap, {}, name, callback, this.off.bind(this));
  if (typeof name === 'string' && context == null) callback = void 0;
  return this.on(events, callback, context);
};

// Inversion-of-control versions of `once`.
EventsImpl.listenToOnce = function(this: any, obj: any, name: string | { [event: string]: Function }, callback?: Function): any {
  // Map the event into a `{event: once}` object.
  const events = eventsApi(onceMap, {}, name, callback, this.stopListening.bind(this, obj));
  return this.listenTo(obj, events);
};

// Reduces the event callbacks into a map of `{event: onceWrapper}`.
// `offer` unbinds the `onceWrapper` after it has been called.
const onceMap = (map: any, name: string, callback: Function | undefined, offer: Function): any => {
  if (callback) {
    const once: any = map[name] = _.once(function(this: any) {
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
EventsImpl.trigger = function(this: any, name: string, ...args: any[]): any {
  if (!this._events) return this;
  eventsApi(triggerApi, this._events, name, void 0, args);
  return this;
};

// Handles triggering the appropriate event callbacks.
const triggerApi = (objEvents: EventsHash, name: string, _callback: Function | undefined, args: any[]): EventsHash => {
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
// Ostov events have 3 arguments).
const triggerEvents = (events: EventHandler[], args: any[]): void => {
  let ev: EventHandler, i = -1;
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
  id: string;
  listener: any;
  obj: any;
  interop: boolean;
  count: number;
  _events: EventsHash | undefined;
  on: EventsMixin['on'];

  constructor(listener: any, obj: any) {
    this.id = listener._listenId;
    this.listener = listener;
    this.obj = obj;
    this.interop = true;
    this.count = 0;
    this._events = void 0;
    this.on = EventsImpl.on;
  }

  // Offs a callback (or several).
  // Uses an optimized counter if the listenee uses Ostov.Events.
  // Otherwise, falls back to manual tracking to support events
  // library interop.
  off(name?: string, callback?: Function): void {
    let cleanup: boolean;
    if (this.interop) {
      this._events = eventsApi(offApi, this._events, name, callback, {
        context: void 0,
        listeners: void 0
      }) as EventsHash | undefined;
      cleanup = !this._events;
    } else {
      this.count--;
      cleanup = this.count === 0;
    }
    if (cleanup) this.cleanup();
  }

  // Cleans up memory bindings between the listener and the listenee.
  cleanup(): void {
    delete this.listener._listeningTo[this.obj._listenId];
    if (!this.interop) delete this.obj._listeners[this.id];
  }
}

// Aliases for backwards compatibility.
EventsImpl.bind = EventsImpl.on;
EventsImpl.unbind = EventsImpl.off;

// Allow the `Ostov` object to serve as a global event bus, for folks who
// want global "pubsub" in a convenient place.
const Events: EventsMixin = EventsImpl;

// Base class for all Ostov classes, with Events mixed in.
class BackboneBase {
  // Events mixin properties
  _events?: EventsHash;
  _listeners?: { [id: string]: Listening };
  _listeningTo?: { [id: string]: Listening };
  _listenId?: string;

  on!: EventsMixin['on'];
  off!: EventsMixin['off'];
  trigger!: EventsMixin['trigger'];
  bind!: EventsMixin['bind'];
  unbind!: EventsMixin['unbind'];
  once!: EventsMixin['once'];
  listenTo!: EventsMixin['listenTo'];
  stopListening!: EventsMixin['stopListening'];
  listenToOnce!: EventsMixin['listenToOnce'];
}
Object.assign(BackboneBase.prototype, EventsImpl);

/**
 * Ostov **Models** are the basic data object in the framework --
 * frequently representing a row in a table in a database on your server.
 * A discrete chunk of data and a bunch of useful, related methods for
 * performing computations and transformations on that data.
 *
 * @example
 * class Book extends Ostov.Model {
 *   defaults() {
 *     return {
 *       title: "No Title",
 *       author: "Unknown"
 *     };
 *   }
 * }
 */
class Model<T extends Record<string, any> = any> extends BackboneBase {
  /**
   * A unique identifier for the model, generated automatically.
   */
  cid!: string;

  /**
   * The hash of attributes for this model.
   */
  attributes!: T;

  /**
   * A hash of attributes that have changed since the last "change" event.
   */
  changed!: Partial<T> | null;

  /**
   * The value returned during the last failed validation.
   */
  validationError!: any;

  /**
   * The name of the property that is used as the unique identifier.
   */
  idAttribute!: string;

  /**
   * The prefix used to create the client id (cid).
   */
  cidPrefix!: string;

  /**
   * The unique identifier for this model (usually from the server).
   */
  id!: T extends { id: infer ID } ? ID : (string | number | undefined);

  /**
   * The collection this model belongs to.
   */
  collection?: Collection<any>;

  _changing!: boolean;
  _pending!: false | ModelSetOptions;
  _previousAttributes!: T;

  constructor(attributes?: Partial<T>, options: ModelSetOptions<any> = {}) {
    super();
    // Create proxy before setup so all internal operations (set, initialize,
    // listenTo) use a consistent 'this', and subclass class fields are intercepted.
    const self = this;
    const proxy: this = new Proxy(this, {
      defineProperty(target, prop, descriptor) {
        // Modern JS/TS with useDefineForClassFields:true uses Object.defineProperty
        // for class fields, bypassing prototype setters. Intercept `defaults` so
        // it merges into attributes even when assigned as a class field.
        if ('value' in descriptor && prop === 'defaults') {
          const value = descriptor.value as any;
          const resolved = typeof value === 'function' ? value.call(self) : value;
          if (resolved && self.attributes) {
            for (const key in resolved) {
              if (!(key in (self.attributes as any))) (self.attributes as any)[key] = resolved[key];
            }
          }
          return true;
        }
        return Reflect.defineProperty(target, prop, descriptor);
      }
    }) as unknown as this;
    let attrs: Partial<T> = (attributes || {}) as Partial<T>;
    proxy.preinitialize.apply(proxy, arguments as any);
    this.cid = _.uniqueId(this.cidPrefix);
    this.attributes = {} as T;
    if (options.collection) this.collection = options.collection as any;
    if (options.parse) attrs = (proxy.parse(attrs as any, options) || {}) as Partial<T>;
    const defaults = _.result(proxy, 'defaults') as Partial<T>;
    // Just _.defaults would work fine, but the additional _.extends
    // is in there for historical reasons. See #3843.
    attrs = _.defaults({ ...defaults, ...attrs }, defaults) as Partial<T>;
    proxy.set(attrs as any, options);
    this.changed = {};
    proxy.initialize.apply(proxy, arguments as any);
    return proxy;
  }

  /**
   * Return a copy of the model's `attributes` object.
   */
  toJSON(_options?: unknown): T {
    return _.clone(this.attributes);
  }

  /**
   * Proxy `Ostov.sync` by default -- but override this if you need
   * custom syncing semantics for *this* particular model.
   */
  sync(...args: any[]): any {
    return Ostov.sync.apply(this, args as [string, any, any?]);
  }

  /**
   * Get the current value of an attribute from the model.
   * @example note.get("title")
   * @see http://ostovjs.org/#Model-get
   */
  get<K extends keyof T>(attr: K): T[K] {
    return this.attributes[attr];
  }

  /**
   * Get the HTML-escaped value of an attribute.
   * @see http://ostovjs.org/#Model-escape
   */
  escape<K extends keyof T>(attr: K): string {
    return _.escape(this.get(attr));
  }

  /**
   * Returns `true` if the attribute contains a value that is not null
   * or undefined.
   * @see http://ostovjs.org/#Model-has
   */
  has<K extends keyof T>(attr: K): boolean {
    return this.get(attr) != null;
  }

  /**
   * Special-cased proxy to underscore's `_.matches` method.
   * @see http://ostovjs.org/#Model-matches
   */
  matches(attrs: Partial<T>): boolean {
    return !!(_.iteratee(attrs, this) as any)(this.attributes);
  }

  /**
   * Set a hash of model attributes on the object, firing `"change"`.
   * This is the core primitive operation of a model, updating the data
   * and notifying anyone who needs to know about the change in state.
   * @see http://ostovjs.org/#Model-set
   */
  set(key: Partial<T> | null | undefined, options?: ModelSetOptions<any>): this | false;
  set<K extends keyof T>(key: K, val: T[K], options?: ModelSetOptions<any>): this | false;
  set(key: any, val?: any, options: ModelSetOptions<any> = {}): this | false {
    if (key == null) return this;

    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs: Partial<T>;
    if (typeof key === 'object') {
      attrs = key;
      options = (val as ModelSetOptions) || {};
    } else {
      (attrs = {} as Partial<T>)[key as keyof T] = val;
    }

    // Run validation.
    if (!this._validate(attrs, options)) return false;

    // Extract attributes and options.
    const unset = !!options.unset;
    const silent = !!options.silent;
    const changes: string[] = [];
    const changing: boolean = this._changing;
    this._changing = true;

    if (!changing) {
      this._previousAttributes = _.clone(this.attributes);
      this.changed = {};
    }

    const current = this.attributes;
    const changed = this.changed;
    const prev = this._previousAttributes;

    // For each `set` attribute, update or delete the current value.
    for (const attr in attrs) {
      val = attrs[attr];
      if (!_.isEqual((current as any)[attr], val)) changes.push(attr);
      if (!_.isEqual((prev as any)[attr], val)) {
        (changed as any)[attr] = val;
      } else {
        delete (changed as any)[attr];
      }
      unset ? delete (current as any)[attr] : (current as any)[attr] = val;
    }

    // Update the `id`.
    if (this.idAttribute in attrs) {
      const prevId = this.id;
      this.id = this.get(this.idAttribute as keyof T) as any;
      if (this.id !== prevId) {
        this.trigger('changeId', this, prevId, options);
      }
    }

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length) this._pending = options;
      for (let i = 0; i < changes.length; i++) {
        this.trigger(`change:${changes[i]}`, this, (current as any)[changes[i]], options);
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

  /**
   * Remove an attribute from the model, firing `"change"`. `unset` is a noop
   * if the attribute doesn't exist.
   */
  unset<K extends keyof T>(attr: K, options?: ModelSetOptions): this | false {
    return this.set(attr, void 0 as any, { ...options, unset: true });
  }

  /**
   * Clear all attributes on the model, firing `"change"`.
   */
  clear(options?: ModelSetOptions): this | false {
    const attrs: Partial<T> = {};
    for (const key in this.attributes) attrs[key] = void 0 as any;
    return this.set(attrs, { ...options, unset: true });
  }

  /**
   * Determine if the model has changed since the last `"change"` event.
   * If you specify an attribute name, determine if that attribute has changed.
   */
  hasChanged(attr?: keyof T): boolean {
    if (attr == null) return !_.isEmpty(this.changed);
    return _.has(this.changed, attr as string);
  }

  /**
   * Return an object containing all the attributes that have changed, or
   * false if there are no changed attributes.
   */
  changedAttributes(diff?: Partial<T>): Partial<T> | false {
    if (!diff) return this.hasChanged() ? _.clone(this.changed!) : false;
    const old = this._changing ? this._previousAttributes : this.attributes;
    const changed: Partial<T> = {};
    let hasChanged: boolean | undefined;
    for (const attr in diff) {
      const val = diff![attr];
      if (_.isEqual((old as any)[attr], val)) continue;
      changed[attr] = val;
      hasChanged = true;
    }
    return hasChanged ? changed : false;
  }

  /**
   * Get the previous value of an attribute, recorded at the time the last
   * `"change"` event was fired.
   */
  previous<K extends keyof T>(attr: K): T[K] | undefined {
    if (attr == null || !this._previousAttributes) return undefined;
    return this._previousAttributes[attr];
  }

  /**
   * Get all of the attributes of the model at the time of the previous
   * `"change"` event.
   */
  previousAttributes(): T {
    return _.clone(this._previousAttributes);
  }

  /**
   * Fetch the model from the server, merging the response with the model's
   * local attributes.
   */
  fetch(options?: SyncOptions): XhrLike {
    options = { parse: true, ...options };
    const success = options.success;
    options.success = (resp: unknown) => {
      const serverAttrs = options!.parse ? this.parse(resp, options) : resp;
      if (!this.set(serverAttrs as any, options)) return false;
      success?.call(options!.context, this, resp, options);
      this.trigger('sync', this, resp, options);
    };
    wrapError(this, options);
    return this.sync('read', this, options);
  }

  /**
   * Set a hash of model attributes, and sync the model to the server.
   */
  save(key?: keyof T | Partial<T> | null, val?: any, options?: SyncOptions): XhrLike | false {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs: Partial<T> | null | undefined;
    if (key == null || typeof key === 'object') {
      attrs = key as Partial<T>;
      options = val as SyncOptions;
    } else {
      (attrs = {} as Partial<T>)[key as keyof T] = val;
    }

    options = { validate: true, parse: true, ...options };
    const wait = options.wait;

    // If we're not waiting and attributes exist, save acts as
    // `set(attr).save(null, opts)` with validation. Otherwise, check if
    // the model will be valid when the attributes, if any, are set.
    if (attrs && !wait) {
      if (!this.set(attrs, options as ModelSetOptions)) return false;
    } else if (!this._validate(attrs, options)) {
      return false;
    }

    // After a successful server-side save, the client is (optionally)
    // updated with the server-side state.
    const success = options.success;
    const attributes = this.attributes;
    options.success = (resp: unknown) => {
      // Ensure attributes are restored during synchronous saves.
      this.attributes = attributes;
      let serverAttrs: unknown = options!.parse ? this.parse(resp, options) : resp;
      if (wait) serverAttrs = { ...attrs, ...(serverAttrs as object) };
      if (serverAttrs && !this.set(serverAttrs as any, options as ModelSetOptions)) return false;
      success?.call(options!.context, this, resp, options);
      this.trigger('sync', this, resp, options);
    };
    wrapError(this, options);

    // Set temporary attributes if `{wait: true}` to properly find new ids.
    if (attrs && wait) this.attributes = { ...attributes, ...attrs };

    const method: string = this.isNew() ? 'create' : options.patch ? 'patch' : 'update';
    if (method === 'patch' && !options.attrs) options.attrs = attrs as Record<string, unknown>;
    const xhr = this.sync(method, this, options);

    // Restore attributes.
    this.attributes = attributes;

    return xhr;
  }

  /**
   * Destroy this model on the server if it was already persisted.
   */
  destroy(options?: SyncOptions): XhrLike | false {
    options = { ...(options || {}) };
    const success = options.success;
    const wait = options.wait;

    const destroy = () => {
      this.stopListening();
      this.trigger('destroy', this, this.collection, options);
    };

    options.success = (resp: unknown) => {
      if (wait) destroy();
      success?.call(options!.context, this, resp, options);
      if (!this.isNew()) this.trigger('sync', this, resp, options);
    };

    let xhr: XhrLike | false = false;
    if (this.isNew()) {
      _.defer(options.success);
    } else {
      wrapError(this, options);
      xhr = this.sync('delete', this, options);
    }
    if (!wait) destroy();
    return xhr;
  }

  /**
   * Default URL for the model's representation on the server.
   */
  url(): string {
    const base: string =
      _.result(this, 'urlRoot') ||
      _.result(this.collection, 'url') ||
      urlError();
    if (this.isNew()) return base;
    const id = this.get(this.idAttribute as keyof T);
    return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id as string | number);
  }

  /**
   * **parse** converts a response into the hash of attributes to be `set` on
   * the model.
   */
  parse(resp: any, _options?: any): any {
    return resp;
  }

  /**
   * Create a new model with identical attributes to this one.
   */
  clone(): Model<T> {
    return new (this.constructor as any)(this.attributes);
  }

  /**
   * A model is new if it has never been saved to the server, and lacks an id.
   */
  isNew(): boolean {
    return !this.has(this.idAttribute as keyof T);
  }

  /**
   * Check if the model is currently in a valid state.
   */
  isValid(options?: any): boolean {
    return this._validate({}, { ...options, validate: true });
  }

  /**
   * Run validation against the next complete set of model attributes.
   */
  _validate(attrs: Partial<T> | null | undefined, options: ModelSetOptions | SyncOptions): boolean {
    if (!options.validate || !(this as any).validate) return true;
    attrs = { ...this.attributes, ...attrs };
    const error = this.validationError = (this as any).validate(attrs, options) || null;
    if (!error) return true;
    this.trigger('invalid', this, error, { ...options, validationError: error });
    return false;
  }

  /**
   * preinitialize/initialize are empty by default. Override with your own logic.
   */
  preinitialize(..._args: any[]): void {}
  initialize(..._args: any[]): void {}

  /**
   * Optional validation function.
   */
  validate?(attrs: T, options?: ModelSetOptions | SyncOptions): any;

  /**
   * Optional URL root for the model.
   */
  urlRoot?: string | (() => string);

  /**
   * Optional defaults for the model's attributes.
   */

  [key: string]: any;

  static mixin: (obj: any) => void;
}

// A hash of attributes whose current and previous value differ.
Model.prototype.changed = null;
// The value returned during the last failed validation.
Model.prototype.validationError = null;
// The default name for the JSON `id` attribute is `"id"`.
Model.prototype.idAttribute = 'id';
// The prefix is used to create the client id which is used to identify models locally.
Model.prototype.cidPrefix = 'c';

// Default options for `Collection#set`.
const setOptions: Record<string, boolean> = { add: true, remove: true, merge: true };
const addOptions: Record<string, boolean> = { add: true, remove: false };

// Splices `insert` into `array` at index `at`.
const splice = (array: any[], insert: any[], at: number): void => {
  at = Math.min(Math.max(at, 0), array.length);
  const tail = Array(array.length - at);
  const length = insert.length;
  let i: number;
  for (i = 0; i < tail.length; i++) tail[i] = array[i + at];
  for (i = 0; i < length; i++) array[i + at] = insert[i];
  for (i = 0; i < tail.length; i++) array[i + length + at] = tail[i];
};

/**
 * Ostov **Collections** are the basic data object in the framework --
 * more analogous to a table full of data ... or a small slice or page of that
 * table, or a collection of rows that belong together for a particular reason.
 * Collections maintain indexes of their models, both in order, and for lookup by `id`.
 *
 * @example
 * class Books extends Ostov.Collection<Book> {
 *   model = Book;
 * }
 */
class Collection<TModel extends Model = Model> extends BackboneBase {
  /**
   * The model class for this collection.
   */
  declare model: { new (attrs?: any, opts?: any): TModel; prototype: TModel } | typeof Model;
  private _model?: any;

  /**
   * The internal array of models.
   */
  models!: TModel[];

  /**
   * The number of models in the collection.
   */
  length!: number;

  /**
   * The property or function used to sort the collection.
   */
  declare comparator: string | ((a: any, b?: any) => number) | undefined;
  private _comparator?: string | ((a: any, b?: any) => number);
  _byId!: Record<string, TModel>;

  constructor(models?: TModel[] | any[], options: ModelSetOptions<TModel> & { model?: any; comparator?: any } = {}) {
    super();
    // Create proxy before setup so all internal operations (reset, listenTo)
    // use a consistent 'this', and subclass class fields are intercepted.
    const self = this;
    const proxy: this = new Proxy(this, {
      defineProperty(target, prop, descriptor) {
        // Modern JS/TS with useDefineForClassFields:true uses Object.defineProperty
        // for class fields, bypassing prototype setters. Intercept `model` and
        // `comparator` so they work as expected when assigned as class fields.
        if ('value' in descriptor) {
          if (prop === 'model') {
            self._model = descriptor.value;
            // Also create an own data property so prototype method `model` definitions
            // (which shadow the getter/setter) are properly overridden.
            Reflect.defineProperty(target, prop, { value: descriptor.value, writable: true, configurable: true, enumerable: false });
            return true;
          }
          if (prop === 'comparator') {
            self._comparator = descriptor.value;
            if (descriptor.value && self.models?.length) self.sort({ silent: true });
            // Also create an own data property so prototype method `comparator` definitions
            // (which shadow the getter/setter) are properly overridden.
            Reflect.defineProperty(target, prop, { value: descriptor.value, writable: true, configurable: true, enumerable: false });
            return true;
          }
        }
        return Reflect.defineProperty(target, prop, descriptor);
      }
    }) as unknown as this;
    proxy.preinitialize.apply(proxy, arguments as any);
    if (options.model) (proxy as any).model = options.model;
    if (options.comparator !== void 0) (proxy as any).comparator = options.comparator;
    proxy._reset();
    proxy.initialize.apply(proxy, arguments as any);
    if (models) proxy.reset(models, { silent: true, ...options });
    return proxy;
  }

  /**
   * The JSON representation of a Collection is an array of the
   * models' attributes.
   */
  toJSON(options?: any): any[] {
    return this.map((model: TModel) => model.toJSON(options));
  }

  /**
   * Proxy `Ostov.sync` by default.
   */
  sync(...args: any[]): any {
    return Ostov.sync.apply(this, args as [string, any, any?]);
  }

  /**
   * Add a model, or list of models to the set.
   */
  add(models: TModel | TModel[] | any | any[], options?: ModelSetOptions<TModel>): TModel | TModel[] {
    return this.set(models, { ...{ merge: false }, ...options, ...addOptions }) as any;
  }

  /**
   * Remove a model, or a list of models from the set.
   */
  remove(models: TModel | TModel[] | any | any[], options: ModelSetOptions<TModel> = {}): TModel | TModel[] {
    options = { ...options };
    const singular = !Array.isArray(models);
    const list = (singular ? [models] : (models as unknown[]).slice()) as TModel[];
    const removed = this._removeModels(list, options);
    if (!options.silent && removed.length) {
      options.changes = { added: [], merged: [], removed: removed };
      this.trigger('update', this, options);
    }
    return singular ? removed[0] : removed;
  }

  /**
   * Update a collection by `set`-ing a new list of models, adding new ones,
   * removing models that are no longer present, and merging models that
   * already exist in the collection.
   */
  set(models: any, options?: ModelSetOptions<TModel>): TModel | TModel[] | undefined {
    if (models == null) return;

    options = { ...setOptions, ...options } as ModelSetOptions<TModel>;
    if (options.parse && !this._isModel(models)) {
      models = this.parse(models, options) || [];
    }

    const singular = !Array.isArray(models);
    models = singular ? [models] : models.slice();

    let at: number | undefined = options.at;
    if (at != null) at = +at;
    if (at! > this.length) at = this.length;
    if (at! < 0) at = at! + this.length + 1;

    const set: TModel[] = [];
    const toAdd: TModel[] = [];
    const toMerge: TModel[] = [];
    const toRemove: TModel[] = [];
    const modelMap: Record<string, boolean> = {};

    const add = !!options!.add;
    const merge = !!options!.merge;
    const remove = !!options!.remove;

    let sort = false;
    const sortable: boolean = this.comparator != null && at == null && options.sort !== false;
    const sortAttr: string | null = typeof this.comparator === 'string' ? this.comparator : null;

    // Turn bare objects into model references, and prevent invalid models
    // from being added.
    let model: any, i: number;
    for (i = 0; i < models.length; i++) {
      model = models[i];

      // If a duplicate is found, prevent it from being added and
      // optionally merge it into the existing model.
      let existing = this.get(model);
      if (existing) {
        if (merge && model !== existing) {
          let attrs = this._isModel(model) ? (model as Model).attributes : model;
          if (options.parse) attrs = existing.parse(attrs, options);
          existing.set(attrs, options as any);
          toMerge.push(existing);
          if (sortable && !sort) sort = existing.hasChanged(sortAttr as any);
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
    const replace: boolean = !sortable && add && remove;
    if (set.length && replace) {
      orderChanged = this.length !== set.length || _.some(this.models, (m: TModel, index: number) => {
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
    if (sort) this.sort({ silent: true });

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

  /**
   * When you have more items than you want to add or remove individually,
   * you can reset the entire set with a new list of models.
   */
  reset(models?: any, options?: ModelSetOptions<TModel>): TModel | TModel[] {
    options = { ...(options || {}) } as ModelSetOptions<TModel>;
    for (const model of this.models) this._removeReference(model, options);
    options.previousModels = this.models;
    this._reset();
    models = this.add(models, { silent: true, ...options } as any);
    if (!options.silent) this.trigger('reset', this, options);
    return models as any;
  }

  /**
   * Add a model to the end of the collection.
   */
  push(model: TModel | any, options?: ModelSetOptions<TModel>): TModel | TModel[] {
    return this.add(model, { at: this.length, ...options });
  }

  /**
   * Remove a model from the end of the collection.
   */
  pop(options?: ModelSetOptions<TModel>): TModel | undefined {
    const model = this.at(this.length - 1);
    this.remove(model, options);
    return model;
  }

  /**
   * Add a model to the beginning of the collection.
   */
  unshift(model: TModel | any, options?: ModelSetOptions<TModel>): TModel | TModel[] {
    return this.add(model, { at: 0, ...options });
  }

  /**
   * Remove a model from the beginning of the collection.
   */
  shift(options?: ModelSetOptions<TModel>): TModel | undefined {
    const model = this.at(0);
    this.remove(model, options);
    return model;
  }

  /**
   * Slice out a sub-array of models from the collection.
   */
  slice(start?: number, end?: number): TModel[] {
    return this.models.slice(start, end);
  }

  /**
   * Get a model from the set by id, cid, or model object.
   */
  get(obj: any): TModel | undefined {
    if (obj == null) return void 0;
    return this._byId[obj] ||
      this._byId[this.modelId(this._isModel(obj) ? (obj as Model).attributes : obj, (obj as any).idAttribute)] ||
      (obj.cid && this._byId[obj.cid]);
  }

  /**
   * Returns `true` if the model is in the collection.
   */
  has(obj: any): boolean {
    return this.get(obj) != null;
  }

  /**
   * Get the model at the given index.
   */
  at(index: number): TModel {
    if (index < 0) index += this.length;
    return this.models[index];
  }

  /**
   * Return models with matching attributes.
   */
  where(attrs: any, first?: boolean): TModel | TModel[] {
    return (this as any)[first ? 'find' : 'filter'](attrs);
  }

  /**
   * Return the first model with matching attributes.
   */
  findWhere(attrs: any): TModel | undefined {
    return this.where(attrs, true) as TModel | undefined;
  }

  /**
   * Force the collection to re-sort itself.
   */
  sort(options?: ModelSetOptions<TModel>): this {
    let comparator: any = this.comparator;
    if (!comparator) throw new Error('Cannot sort a set without a comparator');
    options = options || {};

    const length = comparator.length;
    if (typeof comparator === 'function') comparator = comparator.bind(this);

    // Run sort based on type of `comparator`.
    if (length === 1 || typeof comparator === 'string') {
      this.models = (this as any).sortBy(comparator);
    } else {
      this.models.sort(comparator);
    }
    if (!options.silent) this.trigger('sort', this, options);
    return this;
  }

  /**
   * Pluck an attribute from each model in the collection.
   */
  pluck(attr: string): any[] {
    return this.map(attr + '');
  }

  /**
   * Fetch the default set of models for this collection.
   */
  fetch(options?: SyncOptions): XhrLike {
    options = { parse: true, ...options };
    const success = options.success;
    options.success = (resp: unknown) => {
      const method: string = options!.reset ? 'reset' : 'set';
      (this as any)[method](resp, options);
      success?.call(options!.context, this, resp, options);
      this.trigger('sync', this, resp, options);
    };
    wrapError(this, options);
    return this.sync('read', this, options);
  }

  /**
   * Create a new instance of a model in this collection.
   */
  create(model: TModel | any, options?: SyncOptions): TModel | false {
    options = { ...(options || {}) };
    const wait = options.wait;
    const prepared = this._prepareModel(model, options as any);
    if (!prepared) return false;
    if (!wait) this.add(prepared, options as any);
    const success = options.success;
    options.success = (m: any, resp: unknown, callbackOpts: any) => {
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
      prepared.once('error', this._forwardPristineError, this);
    }
    prepared.save(null, options);
    return prepared;
  }

  /**
   * **parse** converts a response into a list of models to be added to the
   * collection.
   */
  parse(resp: any, _options?: any): any {
    return resp;
  }

  /**
   * Create a new collection with an identical list of models as this one.
   */
  clone(): this {
    return new (this.constructor as any)(this.models, {
      model: this.model,
      comparator: this.comparator
    });
  }

  /**
   * Define how to uniquely identify models in the collection.
   */
  modelId(attrs: any, idAttribute?: string): any {
    return attrs[idAttribute || (this.model.prototype as any).idAttribute || 'id'];
  }

  /**
   * Get an iterator of all models in this collection.
   */
  values(): CollectionIterator<TModel> {
    return new CollectionIterator(this as any, ITERATOR_VALUES);
  }

  /**
   * Get an iterator of all model IDs in this collection.
   */
  keys(): CollectionIterator<TModel> {
    return new CollectionIterator(this as any, ITERATOR_KEYS);
  }

  /**
   * Get an iterator of all [ID, model] tuples in this collection.
   */
  entries(): CollectionIterator<TModel> {
    return new CollectionIterator(this as any, ITERATOR_KEYSVALUES);
  }

  // Private method to reset all internal state. Called when the collection
  // is first initialized or reset.
  _reset(): void {
    this.length = 0;
    this.models = [];
    this._byId = {};
  }

  // Prepare a hash of attributes (or other model) to be added to this
  // collection.
  _prepareModel(attrs: any, options?: any): TModel | false {
    if (this._isModel(attrs)) {
      if (!attrs.collection) attrs.collection = this as any;
      return attrs as TModel;
    }
    options = { ...(options || {}), collection: this };
    const model = new (this.model as any)(attrs, options);
    if (!model.validationError) return model as TModel;
    this.trigger('invalid', this, model.validationError, { ...options, validationError: model.validationError });
    return false;
  }

  // Internal method called by both remove and set.
  _removeModels(models: any[], options: any): TModel[] {
    const removed: TModel[] = [];
    for (let i = 0; i < models.length; i++) {
      const model = this.get(models[i]);
      if (!model) continue;

      const index = (this as any).indexOf(model);
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
  _isModel(model: any): model is Model {
    return model instanceof Model;
  }

  // Internal method to create a model's ties to a collection.
  _addReference(model: TModel, _options?: unknown): void {
    this._byId[model.cid] = model;
    const id = this.modelId(model.attributes, model.idAttribute);
    if (id != null) this._byId[id] = model;
    model.on('all', this._onModelEvent, this);
  }

  // Internal method to sever a model's ties to a collection.
  _removeReference(model: TModel, _options?: unknown): void {
    delete this._byId[model.cid];
    const id = this.modelId(model.attributes, model.idAttribute);
    if (id != null) delete this._byId[id];
    if ((this as any) === model.collection) delete model.collection;
    model.off('all', this._onModelEvent, this);
  }

  // Internal method called every time a model in the set fires an event.
  // Sets need to update their indexes when models change ids. All other
  // events simply proxy through. "add" and "remove" events that originate
  // in other collections are ignored.
  _onModelEvent(event: string, model: any, collection: any, options: any): void {
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
    this.trigger.apply(this, arguments as any);
  }

  // Internal callback method used in `create`. It serves as a
  // stand-in for the `_onModelEvent` method, which is not yet bound
  // during the `wait` period of the `create` call. We still want to
  // forward any `'error'` event at the end of the `wait` period,
  // hence a customized callback.
  _forwardPristineError(model: any, collection: any, options: any): void {
    // Prevent double forward if the model was already in the
    // collection before the call to `create`.
    if (this.has(model)) return;
    this._onModelEvent('error', model, collection, options);
  }

  // preinitialize/initialize are empty by default. Override with your own logic.
  preinitialize(..._args: any[]): void {}
  initialize(..._args: any[]): void {}

  // Allow any additional proxy methods from underscore
  [key: string]: any;

  // static mixin
  static mixin: (obj: any) => void;
}

// Defining an @@iterator method implements JavaScript's Iterable protocol.
// In modern ES2015 browsers, this value is found at Symbol.iterator.
if (typeof Symbol === 'function' && Symbol.iterator) {
  (Collection.prototype as any)[Symbol.iterator] = Collection.prototype.values;
}

// CollectionIterator
// ------------------

// A CollectionIterator implements JavaScript's Iterator protocol, allowing the
// use of `for of` loops in modern browsers and interoperation between
// Ostov.Collection and other JavaScript functions and third-party libraries
// which can operate on Iterables.

// This "enum" defines the three possible kinds of values which can be emitted
// by a CollectionIterator that correspond to the values(), keys() and entries()
// methods on Collection, respectively.
const ITERATOR_VALUES: number = 1;
const ITERATOR_KEYS: number = 2;
const ITERATOR_KEYSVALUES: number = 3;

/**
 * A CollectionIterator implements JavaScript's Iterator protocol, allowing the
 * use of `for of` loops.
 */
class CollectionIterator<TModel extends Model = Model> implements Iterator<any> {
  _collection: Collection<TModel> | undefined;
  _kind: number;
  _index: number;

  constructor(collection: Collection<TModel>, kind: number) {
    this._collection = collection;
    this._kind = kind;
    this._index = 0;
  }

  next(): IteratorResult<any> {
    if (this._collection) {

      // Only continue iterating if the iterated collection is long enough.
      if (this._index < this._collection.length) {
        const model = this._collection.at(this._index);
        this._index++;

        // Construct a value depending on what kind of values should be iterated.
        let value: any;
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
        return { value: value, done: false };
      }

      // Once exhausted, remove the reference to the collection so future
      // calls to the next method always return done.
      this._collection = void 0;
    }

    return { value: void 0, done: true };
  }

  // All Iterators should themselves be Iterable.
  [Symbol.iterator](): this {
    return this;
  }
}

// Define model/comparator as prototype accessors on Collection.
// Using Object.defineProperty keeps them as plain properties in the generated
// .d.ts (via `declare` in the class body), so subclasses can override them
// as class fields without hitting TS2610.
Object.defineProperty(Collection.prototype, 'model', {
  configurable: true,
  get(this: Collection): typeof Model { return (this as any)._model ?? Model; },
  set(this: Collection, value: typeof Model) {
    const prev = (this as any)._model;
    (this as any)._model = value;
    if (prev !== value && (this as any).models?.length) {
      const attrs = (this as any).models.map((m: Model) => m.toJSON());
      (this as any)._reset();
      (this as any).add(attrs, { silent: true });
    }
  }
});

Object.defineProperty(Collection.prototype, 'comparator', {
  configurable: true,
  get(this: Collection): string | ((a: Model, b?: Model) => number) | undefined { return (this as any)._comparator; },
  set(this: Collection, value: string | ((a: Model, b?: Model) => number) | undefined) {
    (this as any)._comparator = value;
    if (value && (this as any).models?.length) (this as any).sort({ silent: true });
  }
});

// Ostov.View
// -------------

// Ostov Views are almost more convention than they are actual code. A View
// is simply a JavaScript object that represents a logical chunk of UI in the
// DOM. This might be a single item, an entire list, a sidebar or panel, or
// even the surrounding frame which wraps your whole app. Defining a chunk of
// UI as a **View** allows you to define your DOM events declaratively, without
// having to worry about render order ... and makes it easy for the view to
// react to specific changes in the state of your models.

// Cached regex to split keys for `delegate`.
const delegateEventSplitter: RegExp = /^(\S+)\s*(.*)$/;

// List of view options to be set as properties.
const viewOptions: string[] = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

/**
 * Ostov Views are a logical chunk of UI in the
 * DOM. This might be a single item, an entire list, a sidebar or panel, or
 * even the surrounding frame which wraps your whole app.
 *
 * @example
 * class DocumentView extends Ostov.View<DocumentModel> {
 *   render() {
 *     this.el.innerHTML = this.model.get('title');
 *     return this;
 *   }
 * }
 */
class View<TModel extends Model = Model, TCollection extends Collection = Collection, TEl = HTMLElement> extends BackboneBase {
  /**
   * A unique identifier for the view, generated automatically.
   */
  cid!: string;

  /**
   * The DOM element for this view.
   */
  declare el: TEl;

  /**
   * The events hash (or function returning a hash) for this view.
   */
  declare events: Record<string, string | ((e: Event) => void)> | (() => Record<string, string | ((e: Event) => void)>) | undefined;
  private _el?: any;
  private _constructing: boolean = true;

  /**
   * A jQuery-like (or Ostov.$-wrapped) reference to the view's element.
   */
  $el!: any;

  /**
   * The model associated with this view.
   */
  model?: TModel;

  /**
   * The collection associated with this view.
   */
  collection?: TCollection;

  /**
   * The ID attribute for the view's element.
   */
  id?: string;

  /**
   * The hash of attributes for the view's element.
   */
  attributes?: Record<string, string>;

  /**
   * The class name for the view's element.
   */
  className?: string;

  /**
   * The tag name for the view's element (defaults to "div").
   */
  tagName!: string;
  private _viewEvents?: any;

  constructor(options?: any) {
    super();
    this.cid = _.uniqueId('view');
    // Create proxy before setup so preinitialize/initialize use a consistent
    // 'this', and subclass class fields (which use Object.defineProperty in
    // modern JS/TS) are intercepted for `el` and `events`.
    const self = this;
    const proxy: this = new Proxy(this, {
      defineProperty(target, prop, descriptor) {
        if ('value' in descriptor) {
          if (prop === 'el' && typeof descriptor.value === 'string') {
            self._el = descriptor.value;
            self.setElement(descriptor.value);
            return true;
          }
          if (prop === 'events') {
            self._viewEvents = descriptor.value;
            if (self._el instanceof Element) self.delegateEvents();
            return true;
          }
        }
        return Reflect.defineProperty(target, prop, descriptor);
      }
    }) as unknown as this;
    proxy.preinitialize.apply(proxy, arguments as any);
    _.extend(proxy, _.pick(options || {}, viewOptions));
    proxy._ensureElement();
    proxy.initialize.apply(proxy, arguments as any);
    this._constructing = false;
    return proxy;
  }

  /**
   * Scoped element lookup inside the view's root element.
   */
  $(selector: string): any {
    const nodes = (this.el as unknown as Element).querySelectorAll(selector);
    return Ostov.$ ? Ostov.$(Array.from(nodes)) : nodes;
  }

  /**
   * **render** is the core function that your view should override.
   */
  render(): this {
    return this;
  }

  /**
   * Remove this view by taking the element out of the DOM, and removing any
   * applicable Ostov.Events listeners.
   */
  remove(): this {
    this.undelegateEvents();
    this._removeElement();
    this.stopListening();
    return this;
  }

  /**
   * Remove this view's element from the document.
   */
  _removeElement(): void {
    _.dom.remove(this.el as unknown as Element);
  }

  /**
   * Change the view's element and re-delegate the view's events.
   */
  setElement(element: any): this {
    this.undelegateEvents();
    this._setElement(element);
    this.delegateEvents();
    return this;
  }

  /**
   * Creates the `this.el` and `this.$el` references for this view.
   */
  _setElement(el: any): void {
    const resolved = _.dom.query(el);
    // For string selectors that don't match anything, keep el as null/falsy.
    // For non-string values (DOM elements, jQuery-like wrappers), fall back.
    (this as any).el = resolved !== null ? resolved : typeof el !== 'string' ? el : null;
    this.$el = Ostov.$ ? Ostov.$(this.el) : this.el;
  }

  /**
   * Set callbacks, where `this.events` is a hash of *{"event selector": "callback"}* pairs.
   */
  delegateEvents(events?: any): this {
    events || (events = _.result(this, 'events'));
    if (!events) return this;
    this.undelegateEvents();
    for (const key in events) {
      let method: any = events[key];
      if (typeof method !== 'function') method = (this as any)[method];
      if (!method) continue;
      const match = key.match(delegateEventSplitter);
      this.delegate(match![1], match![2], method.bind(this));
    }
    return this;
  }

  /**
   * Add a single event listener to the view's element.
   */
  delegate(eventName: string, selector?: string | Function, listener?: Function): this {
    if (typeof selector !== 'string') {
      listener = selector as Function;
      selector = undefined;
    }
    _.dom.on(this.el as unknown as Element, '.delegateEvents' + this.cid, eventName, selector || null, listener as EventListener);
    return this;
  }

  /**
   * Clears all callbacks previously bound to the view by `delegateEvents`.
   */
  undelegateEvents(): this {
    if (this._el && (this._el instanceof Element)) _.dom.off(this._el, '.delegateEvents' + this.cid);
    return this;
  }

  /**
   * A finer-grained `undelegateEvents` for removing a single delegated event.
   */
  undelegate(eventName: string, selector?: string | Function, listener?: Function): this {
    if (typeof selector !== 'string') {
      listener = selector as Function;
      selector = undefined;
    }
    _.dom.off(this.el as unknown as Element, '.delegateEvents' + this.cid, eventName, selector || null, listener as EventListener | undefined);
    return this;
  }

  /**
   * Produces a DOM element to be assigned to your view.
   */
  _createElement(tagName: string): HTMLElement {
    return document.createElement(tagName);
  }

  /**
   * Ensure that the View has a DOM element to render into.
   */
  _ensureElement(): void {
    if (!this.el) {
      const attrs: Record<string, any> = { ..._.result(this, 'attributes') };
      if (this.id) attrs.id = _.result(this, 'id');
      if (this.className) attrs['class'] = _.result(this, 'className');
      this.setElement(this._createElement(_.result(this, 'tagName')));
      this._setAttributes(attrs);
    } else {
      this.setElement(_.result(this, 'el'));
    }
  }

  /**
   * Set attributes from a hash on this view's element.
   */
  _setAttributes(attributes: Record<string, any>): void {
    _.dom.setAttributes(this.el as unknown as Element, attributes);
  }

  /**
   * preinitialize/initialize are empty by default. Override with your own logic.
   */
  preinitialize(..._args: any[]): void {}
  initialize(..._args: any[]): void {}

  [key: string]: any;
}

// Define el/events as prototype accessors on View.
// Using Object.defineProperty keeps them as plain properties in the generated
// .d.ts (via `declare` in the class body), so subclasses can override them
// as class fields without hitting TS2610.
Object.defineProperty(View.prototype, 'el', {
  configurable: true,
  get(this: View): Element | string { return (this as any)._el as Element; },
  set(this: View, value: Element | string | null | undefined) {
    (this as any)._el = value ?? undefined;
    // Class field case: el set to a string after constructor finished on a real
    // instance (cid is set). Prototype assignments like View.prototype.el = '...'
    // also call this setter (because they inherit it) — the cid guard prevents
    // treating those as class-field assignments.
    if (!(this as any)._constructing && (this as any).cid && typeof value === 'string') {
      (this as any).setElement(value);
    }
  }
});

Object.defineProperty(View.prototype, 'events', {
  configurable: true,
  get(this: View) { return (this as any)._viewEvents; },
  set(this: View, value: any) {
    (this as any)._viewEvents = value;
    // Class field case: events set after constructor finished and el is already
    // a resolved Element → re-delegate so the new events map takes effect.
    if (!(this as any)._constructing && (this as any)._el instanceof Element) {
      (this as any).delegateEvents();
    }
  }
});

// The default `tagName` of a View's element is `"div"`.
View.prototype.tagName = 'div';

// Proxy Ostov class methods to Underscore functions, wrapping the model's
// `attributes` object or collection's `models` array behind the scenes.
//
// collection.filter(function(model) { return model.get('age') > 10 });
// collection.each(this.addView);
//
// `Function#apply` can be slow so we use the method's arg count, if we know it.
const addMethod = (base: any, length: number, method: string, attribute: string): Function => {
  switch (length) {
    case 1: return function(this: any) {
      return base[method](this[attribute]);
    };
    case 2: return function(this: any, value: any) {
      return base[method](this[attribute], value);
    };
    case 3: return function(this: any, iteratee: any, context: any) {
      return base[method](this[attribute], cb(iteratee, this), context);
    };
    case 4: return function(this: any, iteratee: any, defaultVal: any, context: any) {
      return base[method](this[attribute], cb(iteratee, this), defaultVal, context);
    };
    default: return function(this: any) {
      return base[method](this[attribute], ...arguments);
    };
  }
};

// Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
const cb = (iteratee: any, instance: any): any => {
  if (typeof iteratee === 'function') return iteratee;
  if (_.isObject(iteratee) && !instance._isModel(iteratee)) return modelMatcher(iteratee);
  if (typeof iteratee === 'string') return (model: any) => model.get(iteratee);
  return iteratee;
};
const modelMatcher = (attrs: any): Function => {
  const matcher = _.matches(attrs);
  return (model: any) => matcher(model.attributes);
};

// Underscore methods that we want to implement on the Collection.
// 90% of the core usefulness of Ostov Collections is actually implemented
// right here:
const collectionMethods: Record<string, number> = {
  forEach: 3, each: 3, map: 3, collect: 3, reduce: 0,
  foldl: 0, inject: 0, reduceRight: 0, foldr: 0, find: 3, detect: 3, filter: 3,
  select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3, includes: 3,
  contains: 3, invoke: 0, max: 3, min: 3, toArray: 1, size: 1, first: 3,
  head: 3, take: 3, initial: 3, rest: 3, tail: 3, drop: 3, last: 3,
  without: 0, difference: 0, indexOf: 3, shuffle: 1, lastIndexOf: 3,
  isEmpty: 1, chain: 1, sample: 3, partition: 3, groupBy: 3, countBy: 3,
  sortBy: 3, indexBy: 3, findIndex: 3, findLastIndex: 3
};

// Underscore methods that we want to implement on the Model, mapped to the
// number of arguments they take.
const modelMethods: Record<string, number> = {
  keys: 1, values: 1, pairs: 1, invert: 1, pick: 0,
  omit: 0, chain: 1, isEmpty: 1
};

// Mix in each Underscore method as a proxy to `Collection#models`.
_.each([
  [Collection, collectionMethods, 'models'],
  [Model, modelMethods, 'attributes']
], ([Base, methods, attribute]: any) => {
  Base.mixin = (obj: any) => {
    const mappings = _.reduce(_.functions(obj), (memo: any, name: string) => {
      memo[name] = 0;
      return memo;
    }, {});
    _.each(mappings, (length: number, method: string) => {
      if (obj[method]) Base.prototype[method] = addMethod(obj, length, method, attribute);
    });
  };

  _.each(methods, (length: number, method: string) => {
    if ((_  as any)[method]) Base.prototype[method] = addMethod(_, length, method, attribute);
  });
});

// Ostov.sync
// -------------

// Override this function to change the manner in which Ostov persists
// models to the server. You will be passed the type of request, and the
// model in question. By default, makes a RESTful Ajax request
// to the model's `url()`. Some possible customizations could be:
//
// * Use `setTimeout` to batch rapid-fire updates into a single request.
// * Send up the models as XML instead of JSON.
// * Persist models via WebSockets instead of Ajax.
//
// Turn on `Ostov.emulateHTTP` in order to send `PUT` and `DELETE` requests
// as `POST`, with a `_method` parameter containing the true HTTP method,
// as well as all requests with the body as `application/x-www-form-urlencoded`
// instead of `application/json` with the model in a param named `model`.
// Useful when interfacing with server-side languages like **PHP** that make
// it difficult to read the body of `PUT` requests.

// Map from CRUD to HTTP for our default `Ostov.sync` implementation.
const methodMap: Record<string, string> = {
  'create': 'POST',
  'update': 'PUT',
  'patch': 'PATCH',
  'delete': 'DELETE',
  'read': 'GET'
};

// Ostov.Router
// ---------------

// Routers map faux-URLs to actions, and fire events when routes are
// matched. Creating a new one sets its `routes` hash, if not set statically.

// Cached regular expressions for matching named param parts and splatted
// parts of route strings.
const optionalParam: RegExp = /\((.*?)\)/g;
const namedParam: RegExp = /(\(\?)?:\w+/g;
const splatParam: RegExp = /\*\w+/g;
const escapeRegExp: RegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

/**
 * Ostov **Routers** map faux-URLs to actions, and fire events when routes
 * are matched.
 *
 * @example
 * class MyRouter extends Ostov.Router {
 *   routes = {
 *     "help":                 "help",
 *     "search/:query":        "search",
 *     "search/:query/p:page": "search"
 *   };
 *   help() { ... }
 *   search(query, page) { ... }
 * }
 */
class Router extends BackboneBase {
  /**
   * The routes hash (or function returning a hash) for this router.
   */
  routes?: any;

  constructor(options: any = {}) {
    super();
    this.preinitialize.apply(this, arguments as any);
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments as any);
  }

  /**
   * Manually bind a single named route to a callback.
   * @see http://ostovjs.org/#Router-route
   */
  route(route: string | RegExp, name: string | Function, callback?: Function): this {
    if (!(route instanceof RegExp)) route = this._routeToRegExp(route);
    if (typeof name === 'function') {
      callback = name;
      name = '';
    }
    if (!callback) callback = (this as any)[name as string];
    const router = this;
    Ostov.history.route(route, (fragment: string) => {
      const args = router._extractParameters(route as RegExp, fragment);
      if (router.execute(callback!, args, name as string) !== false) {
        router.trigger(`route:${name}`, ...args);
        router.trigger('route', name, args);
        Ostov.history.trigger('route', router, name, args);
      }
    });
    return this;
  }

  // Execute a route handler with the provided parameters.  This is an
  // excellent place to do pre-route setup or post-route cleanup.
  execute(callback: Function, args: (string | null)[], _name: string): void | false {
    if (callback) callback.apply(this, args);
  }

  // Simple proxy to `Ostov.history` to save a fragment into the history.
  navigate(fragment: string, options?: { trigger?: boolean; replace?: boolean }): this {
    Ostov.history.navigate(fragment, options);
    return this;
  }

  // Bind all defined routes to `Ostov.history`. We have to reverse the
  // order of the routes here to support behavior where the most general
  // routes can be defined at the bottom of the route map.
  _bindRoutes(): void {
    if (!this.routes) return;
    this.routes = _.result(this, 'routes');
    let route: string | undefined, routes: string[] = _.keys(this.routes);
    while ((route = routes.pop()) != null) {
      this.route(route, this.routes[route]);
    }
  }

  // Convert a route string into a regular expression, suitable for matching
  // against the current location hash.
  _routeToRegExp(route: string): RegExp {
    route = route.replace(escapeRegExp, '\\$&')
      .replace(optionalParam, '(?:$1)?')
      .replace(namedParam, (match: string, optional: string) => {
        return optional ? match : '([^/?]+)';
      })
      .replace(splatParam, '([^?]*?)');
    return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
  }

  // Given a route, and a URL fragment that it matches, return the array of
  // extracted decoded parameters. Empty or unmatched parameters will be
  // treated as `null` to normalize cross-browser behavior.
  _extractParameters(route: RegExp, fragment: string): (string | null)[] {
    const params = route.exec(fragment)!.slice(1);
    return _.map(params, (param: string | undefined, i: number) => {
      // Don't decode the search params.
      if (i === params.length - 1) return param || null;
      return param ? decodeURIComponent(param) : null;
    });
  }

  // preinitialize/initialize are empty by default. Override with your own logic.
  preinitialize(..._args: unknown[]): void {}
  initialize(..._args: unknown[]): void {}

  // Allow any additional properties
  [key: string]: any;
}

// Ostov.History
// ----------------

// Handles cross-browser history management, based on either
// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
// and URL fragments. If the browser supports neither (old IE, natch),
// falls back to polling.

// Cached regex for stripping a leading hash/slash and trailing space.
const routeStripper: RegExp = /^[#\/]|\s+$/g;

// Cached regex for stripping leading and trailing slashes.
const rootStripper: RegExp = /^\/+|\/+$/g;

// Cached regex for stripping urls of hash.
const pathStripper: RegExp = /#.*$/;

/**
 * Ostov.History handles cross-browser history management, based on either
 * pushState and real URLs, or onhashchange and URL fragments.
 * @see http://ostovjs.org/#History
 */
class History extends BackboneBase {
  handlers!: Array<{ route: RegExp; callback: (fragment: string) => void }>;
  interval!: number;
  location!: Location;
  history!: globalThis.History;
  fragment!: string;
  root!: string;
  options!: any;
  iframe!: HTMLIFrameElement | null;
  _trailingSlash!: boolean;
  _wantsHashChange!: boolean;
  _hasHashChange!: boolean;
  _useHashChange!: boolean;
  _wantsPushState!: boolean;
  _hasPushState!: boolean;
  _usePushState!: boolean;
  _checkUrlInterval!: ReturnType<typeof setInterval>;

  static started: boolean = false;

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
  atRoot(): boolean {
    const path = this.location.pathname.replace(/[^\/]$/, '$&/');
    return path === this.root && !this.getSearch();
  }

  // Does the pathname match the root?
  matchRoot(): boolean {
    const path = this.decodeFragment(this.location.pathname);
    const rootPath = path.slice(0, this.root.length - 1) + '/';
    return rootPath === this.root;
  }

  // Unicode characters in `location.pathname` are percent encoded so they're
  // decoded for comparison. `%25` should not be decoded since it may be part
  // of an encoded parameter.
  decodeFragment(fragment: string): string {
    return decodeURI(fragment.replace(/%25/g, '%2525'));
  }

  // In IE6, the hash fragment and search params are incorrect if the
  // fragment contains `?`.
  getSearch(): string {
    const match = this.location.href.replace(/#.*/, '').match(/\?.+/);
    return match ? match[0] : '';
  }

  // Gets the true hash value. Cannot use location.hash directly due to bug
  // in Firefox where location.hash will always be decoded.
  getHash(window?: any): string {
    const match = (window || this).location.href.match(/#(.*)$/);
    return match ? match[1] : '';
  }

  // Get the pathname and search params, without the root.
  getPath(): string {
    const path = this.decodeFragment(
      this.location.pathname + this.getSearch()
    ).slice(this.root.length - 1);
    return path.charAt(0) === '/' ? path.slice(1) : path;
  }

  // Get the cross-browser normalized URL fragment from the path or hash.
  getFragment(fragment?: string): string {
    if (fragment == null) {
      if (this._usePushState || !this._wantsHashChange) {
        fragment = this.getPath();
      } else {
        fragment = this.getHash();
      }
    }
    return fragment!.replace(routeStripper, '');
  }

  // Start the hash change handling, returning `true` if the current URL matches
  // an existing route, and `false` otherwise.
  start(options?: any): any {
    if (History.started) throw new Error('Ostov.history has already been started');
    History.started = true;

    // Figure out the initial configuration. Do we need an iframe?
    // Is pushState desired ... is it available?
    this.options = { root: '/', ...this.options, ...options };
    this.root = this.options.root;
    this._trailingSlash = this.options.trailingSlash;
    this._wantsHashChange = this.options.hashChange !== false;
    this._hasHashChange = 'onhashchange' in window && ((document as any).documentMode === void 0 || (document as any).documentMode > 7);
    this._useHashChange = this._wantsHashChange && this._hasHashChange;
    this._wantsPushState = !!this.options.pushState;
    this._hasPushState = !!(this.history && this.history.pushState);
    this._usePushState = this._wantsPushState && this._hasPushState;
    this.fragment = this.getFragment();

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
        this.navigate(this.getHash(), { replace: true });
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
      const iWindow = (body.insertBefore(this.iframe, body.firstChild) as HTMLIFrameElement).contentWindow!;
      iWindow.document.open();
      iWindow.document.close();
      iWindow.location.hash = '#' + this.fragment;
    }

    // Add a cross-platform `addEventListener` shim for older browsers.
    const addEventListener = window.addEventListener || function(eventName: string, listener: EventListener) {
      return (window as any).attachEvent('on' + eventName, listener);
    };

    // Depending on whether we're using pushState or hashes, and whether
    // 'onhashchange' is supported, determine how we check the URL state.
    if (this._usePushState) {
      addEventListener('popstate', this.checkUrl as any, false);
    } else if (this._useHashChange && !this.iframe) {
      addEventListener('hashchange', this.checkUrl as any, false);
    } else if (this._wantsHashChange) {
      this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
    }

    if (!this.options.silent) return this.loadUrl();
  }

  // Disable Ostov.history, perhaps temporarily. Not useful in a real app,
  // but possibly useful for unit testing Routers.
  stop(): void {
    // Add a cross-platform `removeEventListener` shim for older browsers.
    const removeEventListener = window.removeEventListener || function(eventName: string, listener: EventListener) {
      return (window as any).detachEvent('on' + eventName, listener);
    };

    // Remove window listeners.
    if (this._usePushState) {
      removeEventListener('popstate', this.checkUrl as any, false);
    } else if (this._useHashChange && !this.iframe) {
      removeEventListener('hashchange', this.checkUrl as any, false);
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
  route(route: RegExp, callback: (fragment: string) => void): void {
    this.handlers.unshift({ route: route, callback: callback });
  }

  // Checks the current URL to see if it has changed, and if it has,
  // calls `loadUrl`, normalizing across the hidden iframe.
  checkUrl(): any {
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
  loadUrl(fragment?: string): any {
    // If the root doesn't match, no routes can match either.
    if (!this.matchRoot()) return this.notfound();
    fragment = this.fragment = this.getFragment(fragment);
    return _.some(this.handlers, (handler: { route: RegExp; callback: (fragment: string) => void }) => {
      if (handler.route.test(fragment!)) {
        handler.callback(fragment);
        return true;
      }
    }) || this.notfound();
  }

  // When no route could be matched, this method is called internally to
  // trigger the `'notfound'` event. It returns `false` so that it can be used
  // in tail position.
  notfound(): false {
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
  navigate(fragment: string, options?: any): any {
    if (!History.started) return false;
    if (!options || options === true) options = { trigger: !!options };

    // Normalize the fragment.
    fragment = this.getFragment(fragment || '');

    // Strip trailing slash on the root unless _trailingSlash is true
    let rootPath = this.root;
    if (!this._trailingSlash && (fragment === '' || fragment.charAt(0) === '?')) {
      rootPath = rootPath.slice(0, -1) || '/';
    }
    const url: string = rootPath + fragment;

    // Strip the fragment of the query and hash for matching.
    fragment = fragment.replace(pathStripper, '');

    // Decode for matching.
    const decodedFragment: string = this.decodeFragment(fragment);

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
        const iWindow = this.iframe.contentWindow!;

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
  _updateHash(location: Location, fragment: string, replace?: boolean): void {
    if (replace) {
      const href = location.href.replace(/(javascript:|#).*$/, '');
      location.replace(href + '#' + fragment);
    } else {
      // Some browsers require that `hash` contains a leading #.
      location.hash = '#' + fragment;
    }
  }

  // Allow any additional properties
  [key: string]: any;
}

// The default interval to poll for hash changes, if necessary, is
// twenty times a second.
History.prototype.interval = 50;

// Throw an error when a URL is needed, and none is supplied.
const urlError = (): never => {
  throw new Error('A "url" property or function must be specified');
};

// Wrap an optional error callback with a fallback error event.
const wrapError = (model: Model<any> | Collection<any>, options: SyncOptions): void => {
  const error = options.error;
  options.error = function(resp: unknown) {
    if (error) error.call(options.context, model, resp, options);
    model.trigger('error', model, resp, options);
  };
};

// The Ostov object
interface BackboneStatic extends EventsMixin {
  VERSION: string;
  $: any;
  noConflict: () => BackboneStatic;
  emulateHTTP: boolean;
  emulateJSON: boolean;
  Events: EventsMixin;
  Model: typeof Model;
  Collection: typeof Collection;
  View: typeof View;
  Router: typeof Router;
  History: typeof History;
  history: History;
  sync: (method: string, model: Model<any> | Collection<any>, options?: SyncOptions) => XhrLike;
  ajax: (options: AjaxOptions) => XhrLike;
  _debug: () => { root: Record<string, unknown>; _: typeof _ };
  [key: string]: any;
}

const Ostov: BackboneStatic = {} as BackboneStatic;

// Current version of the library. Keep in sync with `package.json`.
Ostov.VERSION = '1.7.6';

// Ostov.$ can be set to jQuery (or a compatible library) by the user if
// they want jQuery-powered DOM helpers. Ostov itself no longer requires it.
Ostov.$ = null;

// Runs Ostov.js in *noConflict* mode, returning the `Ostov` variable
// to its previous owner. Returns a reference to this Ostov object.
Ostov.noConflict = function(): BackboneStatic {
  root.Ostov = previousBackbone;
  return this;
};

// Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
// will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
// set a `X-Http-Method-Override` header.
Ostov.emulateHTTP = false;

// Turn on `emulateJSON` to support legacy servers that can't deal with direct
// `application/json` requests ... this will encode the body as
// `application/x-www-form-urlencoded` instead and will send the model in a
// form param named `model`.
Ostov.emulateJSON = false;

// Events
Ostov.Events = EventsImpl;

// Allow the `Ostov` object to serve as a global event bus, for folks who
// want global "pubsub" in a convenient place.
_.extend(Ostov, EventsImpl);

// Ostov.sync
Ostov.sync = (method: string, model: Model<any> | Collection<any>, options?: SyncOptions): XhrLike => {
  const type: string = methodMap[method];

  // Default options, unless specified.
  // Must mutate (not replace) `options` so that `options.xhr` set below
  // is visible to callbacks that closed over the same object in sync callers.
  if (!options) options = {};
  _.defaults(options, { emulateHTTP: Ostov.emulateHTTP, emulateJSON: Ostov.emulateJSON });

  // Default JSON-request options.
  const params: AjaxOptions = { type: type, dataType: 'json', url: '' };

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
    params.data = params.data ? { model: params.data } : {};
  }

  // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
  // And an `X-HTTP-Method-Override` header.
  if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
    params.type = 'POST';
    if (options.emulateJSON) (params.data as any)._method = type;
    const beforeSend = options.beforeSend;
    options.beforeSend = function(xhr: { setRequestHeader(name: string, value: string): void }) {
      xhr.setRequestHeader('X-HTTP-Method-Override', type);
      if (beforeSend) return beforeSend.apply(this, arguments as any);
    };
  }

  // Don't process data on a non-GET request.
  if (params.type !== 'GET' && !options.emulateJSON) {
    params.processData = false;
  }

  // Pass along `textStatus` and `errorThrown` from jQuery.
  const error = options.error;
  options.error = function(xhr: unknown, textStatus: unknown, errorThrown: unknown) {
    options!.textStatus = textStatus;
    options!.errorThrown = errorThrown;
    (error as Function)?.call(options!.context, xhr, textStatus, errorThrown);
  };

  // Make the request, allowing the user to override any Ajax options.
  const xhr = options.xhr = Ostov.ajax(Object.assign(params, options) as AjaxOptions);
  model.trigger('request', model, xhr, options);
  return xhr;
};

// Default implementation of `Ostov.ajax` using the native Fetch API.
// Override this function if you need custom request handling.
// The options object follows the jQuery.ajax convention used by Ostov.sync:
//   type, url, data, contentType, dataType, beforeSend, success, error, context.
Ostov.ajax = (options: AjaxOptions): XhrLike => {
  const method: string = ((options.type as string) || 'GET').toUpperCase();
  const url: string = options.url;
  const headers: Record<string, string> = {};

  if (options.contentType) headers['Content-Type'] = options.contentType;

  let body: string | undefined;
  if (options.data != null && method !== 'GET') {
    if (options.emulateJSON && typeof options.data === 'object') {
      // Encode as application/x-www-form-urlencoded.
      const data = options.data as Record<string, unknown>;
      body = Object.keys(data).map((k: string) => {
        return `${encodeURIComponent(k)}=${encodeURIComponent(String(data[k]))}`;
      }).join('&');
    } else {
      body = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
    }
  }

  const fetchOptions: RequestInit = { method, headers };
  if (body !== void 0) fetchOptions.body = body;

  // Allow beforeSend to set additional request headers.
  if (options.beforeSend) {
    const mockXhr = {
      setRequestHeader: (name: string, value: string) => { headers[name] = value; }
    };
    options.beforeSend(mockXhr);
  }

  // Provide a minimal xhr-like object (supports abort via AbortController).
  const controller: AbortController | null = typeof AbortController !== 'undefined' ? new AbortController() : null;
  if (controller) fetchOptions.signal = controller.signal;

  const xhr: XhrLike = {
    abort: () => controller?.abort()
  };

  fetch(url, fetchOptions).then((response: Response) => {
    if (!response.ok) {
      const err = Object.assign(new Error(`HTTP error ${response.status}`), { status: response.status });
      options.error?.call(options.context, xhr, response.status, err);
      return;
    }
    const parse: Promise<unknown> = options.dataType === 'json' ||
      (response.headers.get('content-type') || '').indexOf('json') >= 0
      ? response.json()
      : response.text();
    return parse.then((data: unknown) => {
      options.success?.call(options.context, data, response.status, xhr);
    });
  }).catch((err: unknown) => {
    if (err && (err as { name?: string }).name === 'AbortError') return;
    options.error?.call(options.context, xhr, 'error', err);
  });

  return xhr;
};

// Create the default Ostov.history.
Ostov.history = new History();

// Expose classes on Ostov namespace.
Ostov.Model = Model;
Ostov.Collection = Collection;
Ostov.View = View;
Ostov.Router = Router;
Ostov.History = History;

// Provide useful information when things go wrong. This method is not meant
// to be used directly; it merely provides the necessary introspection for the
// external `debugInfo` function.
// Note: `_` is the built-in utils library (no underscore.js dependency).
Ostov._debug = (): { root: Record<string, unknown>; _: typeof _ } => {
  return { root: root, _: _ };
};

// Set on globalThis for noConflict support
root.Ostov = Ostov;

export { _, Model, Collection, View, Router, History, Events };
export default Ostov;
