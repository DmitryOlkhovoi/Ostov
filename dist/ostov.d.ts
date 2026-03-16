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
export interface ModelSetOptions {
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
    collection?: Collection;
    changes?: {
        added: Model[];
        removed: Model[];
        merged: Model[];
    };
    previousModels?: Model[];
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
    attributes: Record<string, unknown>;
    changed: Record<string, unknown> | null;
    validationError: unknown;
    idAttribute: string;
    cidPrefix: string;
    id: string | number | undefined;
    collection?: Collection;
    _changing: boolean;
    _pending: false | ModelSetOptions;
    _previousAttributes: Record<string, unknown>;
    constructor(attributes?: Record<string, unknown> | unknown, options?: ModelSetOptions);
    toJSON(_options?: unknown): Record<string, unknown>;
    sync(...args: any[]): any;
    get(attr: string): unknown;
    escape(attr: string): string;
    has(attr: string): boolean;
    matches(attrs: any): boolean;
    set(key: string | Record<string, unknown> | null | undefined, val?: unknown, options?: ModelSetOptions): this | false;
    unset(attr: string, options?: ModelSetOptions): this | false;
    clear(options?: ModelSetOptions): this | false;
    hasChanged(attr?: string): boolean;
    changedAttributes(diff?: Record<string, unknown>): Record<string, unknown> | false;
    previous(attr?: string): unknown;
    previousAttributes(): Record<string, unknown>;
    fetch(options?: SyncOptions): XhrLike;
    save(key?: string | Record<string, unknown> | null, val?: unknown, options?: SyncOptions): XhrLike | false;
    destroy(options?: SyncOptions): XhrLike | false;
    url(): string;
    parse(resp: unknown, _options?: unknown): unknown;
    clone(): Model;
    isNew(): boolean;
    isValid(options?: any): boolean;
    _validate(attrs: Record<string, unknown> | null | undefined, options: ModelSetOptions | SyncOptions): boolean;
    preinitialize(..._args: unknown[]): void;
    initialize(..._args: unknown[]): void;
    validate?(attrs: Record<string, unknown>, options?: ModelSetOptions | SyncOptions): unknown;
    urlRoot?: string | (() => string);
    private _instanceDefaults?;
    get defaults(): Record<string, unknown> | (() => Record<string, unknown>) | undefined;
    set defaults(value: Record<string, unknown> | (() => Record<string, unknown>) | undefined);
    [key: string]: any;
    static mixin: (obj: any) => void;
}
declare class Collection extends BackboneBase {
    model: typeof Model;
    private _model?;
    models: Model[];
    length: number;
    comparator: string | ((a: Model, b?: Model) => number) | undefined;
    private _comparator?;
    _byId: Record<string, Model>;
    constructor(models?: Model[] | Record<string, unknown>[], options?: ModelSetOptions & {
        model?: typeof Model;
        comparator?: string | ((a: Model, b?: Model) => number);
    });
    toJSON(options?: unknown): Record<string, unknown>[];
    sync(...args: any[]): any;
    add(models: Model | Model[] | Record<string, unknown> | Record<string, unknown>[], options?: ModelSetOptions): Model | Model[];
    remove(models: Model | Model[] | Record<string, unknown> | Record<string, unknown>[], options?: ModelSetOptions): Model | Model[];
    set(models: any, options?: ModelSetOptions): any;
    reset(models?: any, options?: ModelSetOptions): any;
    push(model: Model | Record<string, unknown>, options?: ModelSetOptions): any;
    pop(options?: ModelSetOptions): any;
    unshift(model: Model | Record<string, unknown>, options?: ModelSetOptions): any;
    shift(options?: ModelSetOptions): any;
    slice(start?: number, end?: number): Model[];
    get(obj: any): Model | undefined;
    has(obj: any): boolean;
    at(index: number): Model;
    where(attrs: Record<string, unknown>, first?: boolean): Model | Model[];
    findWhere(attrs: Record<string, unknown>): Model | undefined;
    sort(options?: ModelSetOptions): this;
    pluck(attr: string): any[];
    fetch(options?: SyncOptions): XhrLike;
    create(model: Model | Record<string, unknown>, options?: SyncOptions): Model | false;
    parse(resp: unknown, _options?: unknown): unknown;
    clone(): Collection;
    modelId(attrs: any, idAttribute?: string): any;
    values(): CollectionIterator;
    keys(): CollectionIterator;
    entries(): CollectionIterator;
    _reset(): void;
    _prepareModel(attrs: any, options?: any): any;
    _removeModels(models: any[], options: any): Model[];
    _isModel(model: any): model is Model;
    _addReference(model: Model, _options?: unknown): void;
    _removeReference(model: Model, _options?: unknown): void;
    _onModelEvent(event: string, model: any, collection: any, options: any): void;
    _forwardPristineError(model: any, collection: any, options: any): void;
    preinitialize(..._args: unknown[]): void;
    initialize(..._args: unknown[]): void;
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
declare class View<TEl = Element> extends BackboneBase {
    cid: string;
    el: Element | string;
    events: Record<string, string | ((e: Event) => void)> | (() => Record<string, string | ((e: Event) => void)>) | undefined;
    private _el?;
    private _constructing;
    $el: TEl;
    model?: Model;
    collection?: Collection;
    id?: string;
    attributes?: Record<string, string>;
    className?: string;
    tagName: string;
    private _viewEvents?;
    constructor(options?: Record<string, unknown>);
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
    preinitialize(..._args: unknown[]): void;
    initialize(..._args: unknown[]): void;
    [key: string]: any;
}
declare class Router extends BackboneBase {
    routes?: any;
    constructor(options?: any);
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
    sync: (method: string, model: Model | Collection, options?: SyncOptions) => XhrLike;
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
