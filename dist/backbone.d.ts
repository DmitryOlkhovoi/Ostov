import _ from './utils.js';
interface EventsHash {
    [event: string]: EventHandler[];
}
interface EventHandler {
    callback: Function;
    context: any;
    ctx: any;
    listening: Listening | undefined;
}
export interface EventsMixin {
    on(name: string | {
        [event: string]: Function;
    }, callback?: Function, context?: any): this;
    off(name?: string | {
        [event: string]: Function;
    }, callback?: Function, context?: any): this;
    trigger(name: string, ...args: any[]): this;
    bind(name: string | {
        [event: string]: Function;
    }, callback?: Function, context?: any): this;
    unbind(name?: string | {
        [event: string]: Function;
    }, callback?: Function, context?: any): this;
    once(name: string | {
        [event: string]: Function;
    }, callback?: Function, context?: any): this;
    listenTo(obj: any, name: string | {
        [event: string]: Function;
    }, callback?: Function): this;
    stopListening(obj?: any, name?: string | {
        [event: string]: Function;
    }, callback?: Function): this;
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
declare class Model extends BackboneBase {
    cid: string;
    attributes: Record<string, any>;
    changed: Record<string, any> | null;
    validationError: any;
    idAttribute: string;
    cidPrefix: string;
    id: any;
    collection?: any;
    _changing: boolean;
    _pending: any;
    _previousAttributes: Record<string, any>;
    constructor(attributes?: any, options?: any);
    toJSON(options?: any): any;
    sync(...args: any[]): any;
    get(attr: string): any;
    escape(attr: string): string;
    has(attr: string): boolean;
    matches(attrs: any): boolean;
    set(key: any, val?: any, options?: any): any;
    unset(attr: string, options?: any): any;
    clear(options?: any): any;
    hasChanged(attr?: string): boolean;
    changedAttributes(diff?: Record<string, any>): Record<string, any> | false;
    previous(attr?: string): any;
    previousAttributes(): Record<string, any>;
    fetch(options?: any): any;
    save(key?: any, val?: any, options?: any): any;
    destroy(options?: any): any;
    url(): string;
    parse(resp: any, options?: any): any;
    clone(): Model;
    isNew(): boolean;
    isValid(options?: any): boolean;
    _validate(attrs: any, options: any): boolean;
    preinitialize(...args: any[]): void;
    initialize(...args: any[]): void;
    validate?(attrs: any, options?: any): any;
    urlRoot?: string | (() => string);
    defaults?: any;
    [key: string]: any;
    static mixin: (obj: any) => void;
}
declare class Collection extends BackboneBase {
    model: any;
    models: Model[];
    length: number;
    comparator?: string | ((a: any, b?: any) => number);
    _byId: Record<string, Model>;
    constructor(models?: any, options?: any);
    toJSON(options?: any): any[];
    sync(...args: any[]): any;
    add(models: any, options?: any): any;
    remove(models: any, options?: any): any;
    set(models: any, options?: any): any;
    reset(models?: any, options?: any): any;
    push(model: any, options?: any): any;
    pop(options?: any): any;
    unshift(model: any, options?: any): any;
    shift(options?: any): any;
    slice(...args: any[]): Model[];
    get(obj: any): Model | undefined;
    has(obj: any): boolean;
    at(index: number): Model;
    where(attrs: any, first?: boolean): any;
    findWhere(attrs: any): any;
    sort(options?: any): this;
    pluck(attr: string): any[];
    fetch(options?: any): any;
    create(model: any, options?: any): any;
    parse(resp: any, options?: any): any;
    clone(): Collection;
    modelId(attrs: any, idAttribute?: string): any;
    values(): CollectionIterator;
    keys(): CollectionIterator;
    entries(): CollectionIterator;
    _reset(): void;
    _prepareModel(attrs: any, options?: any): any;
    _removeModels(models: any[], options: any): Model[];
    _isModel(model: any): model is Model;
    _addReference(model: Model, options?: any): void;
    _removeReference(model: Model, options?: any): void;
    _onModelEvent(event: string, model: any, collection: any, options: any): void;
    _forwardPristineError(model: any, collection: any, options: any): void;
    preinitialize(...args: any[]): void;
    initialize(...args: any[]): void;
    [key: string]: any;
    static mixin: (obj: any) => void;
}
declare class CollectionIterator implements Iterator<any> {
    _collection: Collection | undefined;
    _kind: number;
    _index: number;
    constructor(collection: Collection, kind: number);
    next(): IteratorResult<any>;
    [Symbol.iterator](): this;
}
declare class View extends BackboneBase {
    cid: string;
    el: any;
    $el: any;
    model?: any;
    collection?: any;
    id?: string;
    attributes?: any;
    className?: string;
    tagName: string;
    events?: any;
    constructor(options?: any);
    $(selector: string): any;
    render(): this;
    remove(): this;
    _removeElement(): void;
    setElement(element: any): this;
    _setElement(el: any): void;
    delegateEvents(events?: any): this;
    delegate(eventName: string, selector?: string | Function, listener?: Function): this;
    undelegateEvents(): this;
    undelegate(eventName: string, selector?: string | Function, listener?: Function): this;
    _createElement(tagName: string): HTMLElement;
    _ensureElement(): void;
    _setAttributes(attributes: Record<string, any>): void;
    preinitialize(...args: any[]): void;
    initialize(...args: any[]): void;
    [key: string]: any;
}
declare class Router extends BackboneBase {
    routes?: any;
    constructor(options?: any);
    route(route: string | RegExp, name: string | Function, callback?: Function): this;
    execute(callback: Function, args: any[], name: string): any;
    navigate(fragment: string, options?: any): this;
    _bindRoutes(): void;
    _routeToRegExp(route: string): RegExp;
    _extractParameters(route: RegExp, fragment: string): (string | null)[];
    preinitialize(...args: any[]): void;
    initialize(...args: any[]): void;
    [key: string]: any;
}
declare class History extends BackboneBase {
    handlers: Array<{
        route: RegExp;
        callback: Function;
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
    route(route: RegExp, callback: Function): void;
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
    sync: (method: string, model: any, options?: any) => any;
    ajax: (options: any) => any;
    _debug: () => {
        root: any;
        _: any;
    };
    [key: string]: any;
}
declare const Backbone: BackboneStatic;
export { _, Model, Collection, View, Router, History, Events };
export default Backbone;
