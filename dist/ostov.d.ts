import _ from './utils.js';
interface EventsHash {
    [event: string]: EventHandler[];
}
interface EventHandler {
    callback: Function;
    context: unknown;
    ctx: unknown;
    listening: Listening | undefined;
}
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
    beforeSend?: (xhr: {
        setRequestHeader(name: string, value: string): void;
    }) => void;
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
    changes?: {
        added: TModel[];
        removed: TModel[];
        merged: TModel[];
    };
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
    beforeSend?: (xhr: {
        setRequestHeader(name: string, value: string): void;
    }) => void;
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
    on(name: string | {
        [event: string]: Function;
    }, callback?: Function, context?: any): this;
    /**
     * Remove a previously-bound callback function from an object.
     * @see http://ostovjs.org/#Events-off
     */
    off(name?: string | {
        [event: string]: Function;
    }, callback?: Function, context?: any): this;
    /**
     * Trigger callbacks for the given event.
     * @see http://ostovjs.org/#Events-trigger
     */
    trigger(name: string, ...args: any[]): this;
    /** Alias for on */
    bind(name: string | {
        [event: string]: Function;
    }, callback?: Function, context?: any): this;
    /** Alias for off */
    unbind(name?: string | {
        [event: string]: Function;
    }, callback?: Function, context?: any): this;
    /**
     * Just like `on`, but causes the bound callback to only fire once.
     * @see http://ostovjs.org/#Events-once
     */
    once(name: string | {
        [event: string]: Function;
    }, callback?: Function, context?: any): this;
    /**
     * Tell an object to listen to a particular event on another object.
     * @see http://ostovjs.org/#Events-listenTo
     */
    listenTo(obj: any, name: string | {
        [event: string]: Function;
    }, callback?: Function): this;
    /**
     * Tell an object to stop listening to events.
     * @see http://ostovjs.org/#Events-stopListening
     */
    stopListening(obj?: any, name?: string | {
        [event: string]: Function;
    }, callback?: Function): this;
    /**
     * Just like `listenTo`, but causes the bound callback to only fire once.
     * @see http://ostovjs.org/#Events-listenToOnce
     */
    listenToOnce(obj: any, name: string | {
        [event: string]: Function;
    }, callback?: Function): this;
    _events?: EventsHash;
    _listeners?: {
        [id: string]: Listening;
    };
    _listeningTo?: {
        [id: string]: Listening;
    };
    _listenId?: string;
}
declare class Listening {
    id: string;
    listener: any;
    obj: any;
    interop: boolean;
    count: number;
    _events: EventsHash | undefined;
    on: EventsMixin['on'];
    constructor(listener: any, obj: any);
    off(name?: string, callback?: Function): void;
    cleanup(): void;
}
declare const Events: EventsMixin;
declare class BackboneBase {
    _events?: EventsHash;
    _listeners?: {
        [id: string]: Listening;
    };
    _listeningTo?: {
        [id: string]: Listening;
    };
    _listenId?: string;
    on: EventsMixin['on'];
    off: EventsMixin['off'];
    trigger: EventsMixin['trigger'];
    bind: EventsMixin['bind'];
    unbind: EventsMixin['unbind'];
    once: EventsMixin['once'];
    listenTo: EventsMixin['listenTo'];
    stopListening: EventsMixin['stopListening'];
    listenToOnce: EventsMixin['listenToOnce'];
}
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
declare class Model<T extends Record<string, any> = any> extends BackboneBase {
    /**
     * A unique identifier for the model, generated automatically.
     */
    cid: string;
    /**
     * The hash of attributes for this model.
     */
    attributes: T;
    /**
     * A hash of attributes that have changed since the last "change" event.
     */
    changed: Partial<T> | null;
    /**
     * The value returned during the last failed validation.
     */
    validationError: any;
    /**
     * The name of the property that is used as the unique identifier.
     */
    idAttribute: string;
    /**
     * The prefix used to create the client id (cid).
     */
    cidPrefix: string;
    /**
     * The unique identifier for this model (usually from the server).
     */
    id: T extends {
        id: infer ID;
    } ? ID : (string | number | undefined);
    /**
     * The collection this model belongs to.
     */
    collection?: Collection<any>;
    _changing: boolean;
    _pending: false | ModelSetOptions;
    _previousAttributes: T;
    constructor(attributes?: Partial<T>, options?: ModelSetOptions<any>);
    /**
     * Return a copy of the model's `attributes` object.
     */
    toJSON(_options?: unknown): T;
    /**
     * Proxy `Ostov.sync` by default -- but override this if you need
     * custom syncing semantics for *this* particular model.
     */
    sync(...args: any[]): any;
    /**
     * Get the current value of an attribute from the model.
     * @example note.get("title")
     * @see http://ostovjs.org/#Model-get
     */
    get<K extends keyof T>(attr: K): T[K];
    /**
     * Get the HTML-escaped value of an attribute.
     * @see http://ostovjs.org/#Model-escape
     */
    escape<K extends keyof T>(attr: K): string;
    /**
     * Returns `true` if the attribute contains a value that is not null
     * or undefined.
     * @see http://ostovjs.org/#Model-has
     */
    has<K extends keyof T>(attr: K): boolean;
    /**
     * Special-cased proxy to underscore's `_.matches` method.
     * @see http://ostovjs.org/#Model-matches
     */
    matches(attrs: Partial<T>): boolean;
    /**
     * Set a hash of model attributes on the object, firing `"change"`.
     * This is the core primitive operation of a model, updating the data
     * and notifying anyone who needs to know about the change in state.
     * @see http://ostovjs.org/#Model-set
     */
    set(key: Partial<T> | null | undefined, options?: ModelSetOptions<any>): this | false;
    set<K extends keyof T>(key: K, val: T[K], options?: ModelSetOptions<any>): this | false;
    /**
     * Remove an attribute from the model, firing `"change"`. `unset` is a noop
     * if the attribute doesn't exist.
     */
    unset<K extends keyof T>(attr: K, options?: ModelSetOptions): this | false;
    /**
     * Clear all attributes on the model, firing `"change"`.
     */
    clear(options?: ModelSetOptions): this | false;
    /**
     * Determine if the model has changed since the last `"change"` event.
     * If you specify an attribute name, determine if that attribute has changed.
     */
    hasChanged(attr?: keyof T): boolean;
    /**
     * Return an object containing all the attributes that have changed, or
     * false if there are no changed attributes.
     */
    changedAttributes(diff?: Partial<T>): Partial<T> | false;
    /**
     * Get the previous value of an attribute, recorded at the time the last
     * `"change"` event was fired.
     */
    previous<K extends keyof T>(attr: K): T[K] | undefined;
    /**
     * Get all of the attributes of the model at the time of the previous
     * `"change"` event.
     */
    previousAttributes(): T;
    /**
     * Fetch the model from the server, merging the response with the model's
     * local attributes.
     */
    fetch(options?: SyncOptions): XhrLike;
    /**
     * Set a hash of model attributes, and sync the model to the server.
     */
    save(key?: keyof T | Partial<T> | null, val?: any, options?: SyncOptions): XhrLike | false;
    /**
     * Destroy this model on the server if it was already persisted.
     */
    destroy(options?: SyncOptions): XhrLike | false;
    /**
     * Default URL for the model's representation on the server.
     */
    url(): string;
    /**
     * **parse** converts a response into the hash of attributes to be `set` on
     * the model.
     */
    parse(resp: any, _options?: any): any;
    /**
     * Create a new model with identical attributes to this one.
     */
    clone(): Model<T>;
    /**
     * A model is new if it has never been saved to the server, and lacks an id.
     */
    isNew(): boolean;
    /**
     * Check if the model is currently in a valid state.
     */
    isValid(options?: any): boolean;
    /**
     * Run validation against the next complete set of model attributes.
     */
    _validate(attrs: Partial<T> | null | undefined, options: ModelSetOptions | SyncOptions): boolean;
    /**
     * preinitialize/initialize are empty by default. Override with your own logic.
     */
    preinitialize(..._args: any[]): void;
    initialize(..._args: any[]): void;
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
declare class Collection<TModel extends Model = Model> extends BackboneBase {
    /**
     * The model class for this collection.
     */
    model: {
        new (attrs?: any, opts?: any): TModel;
        prototype: TModel;
    } | typeof Model;
    private _model?;
    /**
     * The internal array of models.
     */
    models: TModel[];
    /**
     * The number of models in the collection.
     */
    length: number;
    /**
     * The property or function used to sort the collection.
     */
    comparator: string | ((a: any, b?: any) => number) | undefined;
    private _comparator?;
    _byId: Record<string, TModel>;
    constructor(models?: TModel[] | any[], options?: ModelSetOptions<TModel> & {
        model?: any;
        comparator?: any;
    });
    /**
     * The JSON representation of a Collection is an array of the
     * models' attributes.
     */
    toJSON(options?: any): any[];
    /**
     * Proxy `Ostov.sync` by default.
     */
    sync(...args: any[]): any;
    /**
     * Add a model, or list of models to the set.
     */
    add(models: TModel | TModel[] | any | any[], options?: ModelSetOptions<TModel>): TModel | TModel[];
    /**
     * Remove a model, or a list of models from the set.
     */
    remove(models: TModel | TModel[] | any | any[], options?: ModelSetOptions<TModel>): TModel | TModel[];
    /**
     * Update a collection by `set`-ing a new list of models, adding new ones,
     * removing models that are no longer present, and merging models that
     * already exist in the collection.
     */
    set(models: any, options?: ModelSetOptions<TModel>): TModel | TModel[] | undefined;
    /**
     * When you have more items than you want to add or remove individually,
     * you can reset the entire set with a new list of models.
     */
    reset(models?: any, options?: ModelSetOptions<TModel>): TModel | TModel[];
    /**
     * Add a model to the end of the collection.
     */
    push(model: TModel | any, options?: ModelSetOptions<TModel>): TModel | TModel[];
    /**
     * Remove a model from the end of the collection.
     */
    pop(options?: ModelSetOptions<TModel>): TModel | undefined;
    /**
     * Add a model to the beginning of the collection.
     */
    unshift(model: TModel | any, options?: ModelSetOptions<TModel>): TModel | TModel[];
    /**
     * Remove a model from the beginning of the collection.
     */
    shift(options?: ModelSetOptions<TModel>): TModel | undefined;
    /**
     * Slice out a sub-array of models from the collection.
     */
    slice(start?: number, end?: number): TModel[];
    /**
     * Get a model from the set by id, cid, or model object.
     */
    get(obj: any): TModel | undefined;
    /**
     * Returns `true` if the model is in the collection.
     */
    has(obj: any): boolean;
    /**
     * Get the model at the given index.
     */
    at(index: number): TModel;
    /**
     * Return models with matching attributes.
     */
    where(attrs: any, first?: boolean): TModel | TModel[];
    /**
     * Return the first model with matching attributes.
     */
    findWhere(attrs: any): TModel | undefined;
    /**
     * Force the collection to re-sort itself.
     */
    sort(options?: ModelSetOptions<TModel>): this;
    /**
     * Pluck an attribute from each model in the collection.
     */
    pluck(attr: string): any[];
    /**
     * Fetch the default set of models for this collection.
     */
    fetch(options?: SyncOptions): XhrLike;
    /**
     * Create a new instance of a model in this collection.
     */
    create(model: TModel | any, options?: SyncOptions): TModel | false;
    /**
     * **parse** converts a response into a list of models to be added to the
     * collection.
     */
    parse(resp: any, _options?: any): any;
    /**
     * Create a new collection with an identical list of models as this one.
     */
    clone(): this;
    /**
     * Define how to uniquely identify models in the collection.
     */
    modelId(attrs: any, idAttribute?: string): any;
    /**
     * Get an iterator of all models in this collection.
     */
    values(): CollectionIterator<TModel>;
    /**
     * Get an iterator of all model IDs in this collection.
     */
    keys(): CollectionIterator<TModel>;
    /**
     * Get an iterator of all [ID, model] tuples in this collection.
     */
    entries(): CollectionIterator<TModel>;
    _reset(): void;
    _prepareModel(attrs: any, options?: any): TModel | false;
    _removeModels(models: any[], options: any): TModel[];
    _isModel(model: any): model is Model;
    _addReference(model: TModel, _options?: unknown): void;
    _removeReference(model: TModel, _options?: unknown): void;
    _onModelEvent(event: string, model: any, collection: any, options: any): void;
    _forwardPristineError(model: any, collection: any, options: any): void;
    preinitialize(..._args: any[]): void;
    initialize(..._args: any[]): void;
    [key: string]: any;
    static mixin: (obj: any) => void;
}
/**
 * A CollectionIterator implements JavaScript's Iterator protocol, allowing the
 * use of `for of` loops.
 */
declare class CollectionIterator<TModel extends Model = Model> implements Iterator<any> {
    _collection: Collection<TModel> | undefined;
    _kind: number;
    _index: number;
    constructor(collection: Collection<TModel>, kind: number);
    next(): IteratorResult<any>;
    [Symbol.iterator](): this;
}
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
declare class View<TModel extends Model = Model, TCollection extends Collection = Collection, TEl = HTMLElement> extends BackboneBase {
    /**
     * A unique identifier for the view, generated automatically.
     */
    cid: string;
    /**
     * The events hash (or function returning a hash) for this view.
     */
    events: Record<string, string | ((e: Event) => void)> | (() => Record<string, string | ((e: Event) => void)>) | undefined;
    private _el?;
    private _constructing;
    /**
     * A jQuery-like (or Ostov.$-wrapped) reference to the view's element.
     */
    $el: any;
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
    tagName: string;
    private _viewEvents?;
    constructor(options?: any);
    /**
     * Scoped element lookup inside the view's root element.
     */
    $(selector: string): any;
    /**
     * **render** is the core function that your view should override.
     */
    render(): this;
    /**
     * Remove this view by taking the element out of the DOM, and removing any
     * applicable Ostov.Events listeners.
     */
    remove(): this;
    /**
     * Remove this view's element from the document.
     */
    _removeElement(): void;
    /**
     * Change the view's element and re-delegate the view's events.
     */
    setElement(element: any): this;
    /**
     * Creates the `this.el` and `this.$el` references for this view.
     */
    _setElement(el: any): void;
    /**
     * Set callbacks, where `this.events` is a hash of *{"event selector": "callback"}* pairs.
     */
    delegateEvents(events?: any): this;
    /**
     * Add a single event listener to the view's element.
     */
    delegate(eventName: string, selector?: string | Function, listener?: Function): this;
    /**
     * Clears all callbacks previously bound to the view by `delegateEvents`.
     */
    undelegateEvents(): this;
    /**
     * A finer-grained `undelegateEvents` for removing a single delegated event.
     */
    undelegate(eventName: string, selector?: string | Function, listener?: Function): this;
    /**
     * Produces a DOM element to be assigned to your view.
     */
    _createElement(tagName: string): HTMLElement;
    /**
     * Ensure that the View has a DOM element to render into.
     */
    _ensureElement(): void;
    /**
     * Set attributes from a hash on this view's element.
     */
    _setAttributes(attributes: Record<string, any>): void;
    /**
     * preinitialize/initialize are empty by default. Override with your own logic.
     */
    preinitialize(..._args: any[]): void;
    initialize(..._args: any[]): void;
    [key: string]: any;
}
/**
 * Asymmetric el type: reading returns TEl, writing accepts TEl | string (CSS selector).
 */
interface View<TModel extends Model, TCollection extends Collection, TEl> {
    get el(): TEl;
    set el(value: TEl | string);
}
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
declare class Router extends BackboneBase {
    /**
     * The routes hash (or function returning a hash) for this router.
     */
    routes?: any;
    constructor(options?: any);
    /**
     * Manually bind a single named route to a callback.
     * @see http://ostovjs.org/#Router-route
     */
    route(route: string | RegExp, name: string | Function, callback?: Function): this;
    execute(callback: Function, args: (string | null)[], _name: string): void | false;
    navigate(fragment: string, options?: {
        trigger?: boolean;
        replace?: boolean;
    }): this;
    _bindRoutes(): void;
    _routeToRegExp(route: string): RegExp;
    _extractParameters(route: RegExp, fragment: string): (string | null)[];
    preinitialize(..._args: unknown[]): void;
    initialize(..._args: unknown[]): void;
    [key: string]: any;
}
/**
 * Ostov.History handles cross-browser history management, based on either
 * pushState and real URLs, or onhashchange and URL fragments.
 * @see http://ostovjs.org/#History
 */
declare class History extends BackboneBase {
    handlers: Array<{
        route: RegExp;
        callback: (fragment: string) => void;
    }>;
    interval: number;
    location: Location;
    history: globalThis.History;
    fragment: string;
    root: string;
    options: any;
    iframe: HTMLIFrameElement | null;
    _trailingSlash: boolean;
    _wantsHashChange: boolean;
    _hasHashChange: boolean;
    _useHashChange: boolean;
    _wantsPushState: boolean;
    _hasPushState: boolean;
    _usePushState: boolean;
    _checkUrlInterval: ReturnType<typeof setInterval>;
    static started: boolean;
    constructor();
    atRoot(): boolean;
    matchRoot(): boolean;
    decodeFragment(fragment: string): string;
    getSearch(): string;
    getHash(window?: any): string;
    getPath(): string;
    getFragment(fragment?: string): string;
    start(options?: any): any;
    stop(): void;
    route(route: RegExp, callback: (fragment: string) => void): void;
    checkUrl(): any;
    loadUrl(fragment?: string): any;
    notfound(): false;
    navigate(fragment: string, options?: any): any;
    _updateHash(location: Location, fragment: string, replace?: boolean): void;
    [key: string]: any;
}
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
    _debug: () => {
        root: Record<string, unknown>;
        _: typeof _;
    };
    [key: string]: any;
}
declare const Ostov: BackboneStatic;
export { _, Model, Collection, View, Router, History, Events };
export default Ostov;
