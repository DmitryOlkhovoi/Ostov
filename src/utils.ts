//     Backbone utils.ts
//     Replaces underscore.js and jQuery for Backbone.js.
//     Contains only the functions actually used by Backbone.

'use strict';

type Iteratee = (value: any, key: any, obj: any) => any;
type MatcherFn = (obj: unknown) => boolean;

interface EventEntry {
  namespace: string;
  eventName: string;
  selector: string | null;
  listener: EventListener;
  wrapped: EventListener;
}

type QuerySelector = string | Element | null | { [index: number]: Element; nodeType?: undefined };

interface DomUtilities {
  query(selector: QuerySelector): Element | null;
  setAttributes(el: Element, attrs: Record<string, string | null | undefined>): void;
  remove(el: Element | null): void;
  _registry: WeakMap<object, EventEntry[]> | null;
  _entries(el: Element | null): EventEntry[] | null;
  on(el: Element, namespace: string, eventName: string, selector: string | null, listener: EventListener): void;
  off(el: Element, namespace: string, eventName?: string | null, selector?: string | null, listener?: EventListener | null): void;
}

interface Chain<T = any> {
  _wrapped: T;
  value(): T;
  [method: string]: any;
}

interface ChainConstructor {
  new <T>(obj: T): Chain<T>;
  prototype: Chain;
}

interface Underscore {
  VERSION: string;
  identity: <T>(v: T) => T;
  isFunction(obj: unknown): obj is Function;
  isString(obj: unknown): obj is string;
  isArray(obj: unknown): obj is any[];
  isRegExp(obj: unknown): obj is RegExp;
  isObject(obj: unknown): obj is object;
  isEqual(a: unknown, b: unknown): boolean;
  keys(obj: object): string[];
  values<T>(obj: Record<string, T>): T[];
  values(obj: object): unknown[];
  pairs(obj: object): [string, unknown][];
  invert(obj: Record<string, string | number>): Record<string, string>;
  extend<T extends object>(obj: T, ...sources: object[]): T;
  defaults<T extends object>(obj: T, ...sources: object[]): T;
  clone<T>(obj: T): T;
  has(obj: unknown, key: string): boolean;
  pick(obj: object, ...args: any[]): Record<string, any>;
  omit(obj: object, ...args: any[]): Record<string, any>;
  functions(obj: object): string[];
  create(proto: object, props?: object): any;
  result(obj: any, prop: string, fallback?: any): any;
  uniqueId(prefix?: string): string;
  isEmpty(obj: unknown): boolean;
  escape(str: unknown): string;
  once<T extends (...args: any[]) => any>(fn: T): T;
  defer(fn: Function, ...args: any[]): number;
  matches: (attrs: object) => MatcherFn;
  iteratee: (value: any, context?: any) => Iteratee;
  property(path: string): (obj: any) => any;
  pluck(obj: any[], key: string): any[];
  each<T>(obj: T[], iteratee: (val: T, index: number, obj: T[]) => void, context?: any): T[];
  each(obj: object, iteratee: (val: any, key: string, obj: object) => void, context?: any): object;
  forEach<T>(obj: T[], iteratee: (val: T, index: number, obj: T[]) => void, context?: any): T[];
  forEach(obj: object, iteratee: (val: any, key: string, obj: object) => void, context?: any): object;
  map<T, R>(obj: T[], iteratee: (val: T, index: number, obj: T[]) => R, context?: any): R[];
  map(obj: any, iteratee: any, context?: any): any[];
  collect<T, R>(obj: T[], iteratee: (val: T, index: number, obj: T[]) => R, context?: any): R[];
  collect(obj: any, iteratee: any, context?: any): any[];
  reduce<T, R>(obj: T[], iteratee: (memo: R, val: T, index: number, obj: T[]) => R, memo: R, context?: any): R;
  reduce(obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any): any;
  foldl<T, R>(obj: T[], iteratee: (memo: R, val: T, index: number, obj: T[]) => R, memo: R, context?: any): R;
  foldl(obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any): any;
  inject<T, R>(obj: T[], iteratee: (memo: R, val: T, index: number, obj: T[]) => R, memo: R, context?: any): R;
  inject(obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any): any;
  reduceRight<T, R>(obj: T[], iteratee: (memo: R, val: T, index: number, obj: T[]) => R, memo: R, context?: any): R;
  reduceRight(obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any): any;
  foldr<T, R>(obj: T[], iteratee: (memo: R, val: T, index: number, obj: T[]) => R, memo: R, context?: any): R;
  foldr(obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any): any;
  findIndex<T>(array: T[], predicate: ((val: T, index: number, array: T[]) => boolean) | object | string, context?: any): number;
  findLastIndex<T>(array: T[], predicate: ((val: T, index: number, array: T[]) => boolean) | object | string, context?: any): number;
  find<T>(obj: T[], predicate: ((val: T, index: number, obj: T[]) => boolean) | object | string, context?: any): T | undefined;
  find(obj: any, predicate: any, context?: any): any;
  detect<T>(obj: T[], predicate: ((val: T, index: number, obj: T[]) => boolean) | object | string, context?: any): T | undefined;
  detect(obj: any, predicate: any, context?: any): any;
  filter<T>(obj: T[], predicate: (val: T, index: number, obj: T[]) => boolean, context?: any): T[];
  filter(obj: any, predicate: any, context?: any): any[];
  select<T>(obj: T[], predicate: (val: T, index: number, obj: T[]) => boolean, context?: any): T[];
  select(obj: any, predicate: any, context?: any): any[];
  reject<T>(obj: T[], predicate: (val: T, index: number, obj: T[]) => boolean, context?: any): T[];
  reject(obj: any, predicate: any, context?: any): any[];
  every<T>(obj: T[], predicate: (val: T, index: number, obj: T[]) => boolean, context?: any): boolean;
  every(obj: any, predicate: any, context?: any): boolean;
  all<T>(obj: T[], predicate: (val: T, index: number, obj: T[]) => boolean, context?: any): boolean;
  all(obj: any, predicate: any, context?: any): boolean;
  some<T>(obj: T[], predicate: (val: T, index: number, obj: T[]) => boolean, context?: any): boolean;
  some(obj: any, predicate: any, context?: any): boolean;
  any<T>(obj: T[], predicate: (val: T, index: number, obj: T[]) => boolean, context?: any): boolean;
  any(obj: any, predicate: any, context?: any): boolean;
  contains<T>(obj: T[] | Record<string, T>, item: T, fromIndex?: number): boolean;
  includes<T>(obj: T[] | Record<string, T>, item: T, fromIndex?: number): boolean;
  include<T>(obj: T[] | Record<string, T>, item: T, fromIndex?: number): boolean;
  invoke(obj: any[], path: string | Function, ...args: any[]): any[];
  max<T>(obj: T[] | Record<string, T>, iteratee?: ((val: T, key: any, obj: any) => number) | string, context?: any): T;
  min<T>(obj: T[] | Record<string, T>, iteratee?: ((val: T, key: any, obj: any) => number) | string, context?: any): T;
  shuffle<T>(obj: T[] | Record<string, T>): T[];
  sample<T>(obj: T[] | Record<string, T>, n?: number): T | T[];
  sortBy<T>(obj: T[], iteratee: ((val: T, index: number, obj: T[]) => any) | string, context?: any): T[];
  sortBy(obj: any, iteratee: any, context?: any): any[];
  groupBy: (obj: any, iteratee: any, context?: any) => Record<string, any[]>;
  indexBy: (obj: any, iteratee: any, context?: any) => Record<string, any>;
  countBy: (obj: any, iteratee: any, context?: any) => Record<string, number>;
  partition: (obj: any, iteratee: any, context?: any) => [any[], any[]];
  toArray<T>(obj: T[] | Record<string, T>): T[];
  toArray(obj: unknown): any[];
  size(obj: unknown): number;
  first<T>(array: T[] | null | undefined, n?: number): T | T[] | undefined;
  head<T>(array: T[] | null | undefined, n?: number): T | T[] | undefined;
  take<T>(array: T[] | null | undefined, n?: number): T | T[] | undefined;
  initial<T>(array: T[], n?: number): T[];
  last<T>(array: T[] | null | undefined, n?: number): T | T[] | undefined;
  rest<T>(array: T[], n?: number): T[];
  tail<T>(array: T[], n?: number): T[];
  drop<T>(array: T[], n?: number): T[];
  compact<T>(array: T[]): T[];
  without<T>(array: T[], ...values: T[]): T[];
  difference<T>(array: T[], ...others: T[][]): T[];
  indexOf<T>(array: T[], item: T, from?: number): number;
  lastIndexOf<T>(array: T[], item: T, from?: number): number;
  chain<T>(obj: T): Chain<T>;
  dom: DomUtilities;
}

let idCounter: number = 0;

function identity<T>(v: T): T { return v; }

function makeIteratee(value: any, context?: any): Iteratee {
  if (value == null) return identity;
  if (typeof value === 'function') {
    return context !== void 0
      ? function(this: any) { return value.apply(context, arguments); }
      : value;
  }
  if (typeof value === 'object' && !Array.isArray(value)) return makeMatches(value);
  if (typeof value === 'string') return function(obj: any) { return obj == null ? void 0 : obj[value]; };
  return identity;
}

function makeMatches(attrs: object): MatcherFn {
  const pairs: [string, unknown][] = Object.entries(attrs);
  return function(obj: unknown): boolean {
    if (obj == null) return !pairs.length;
    const o = Object(obj) as Record<string, unknown>;
    for (let i = 0; i < pairs.length; i++) {
      if (pairs[i][1] !== o[pairs[i][0]] || !(pairs[i][0] in o)) return false;
    }
    return true;
  };
}

function deepEqual(a: unknown, b: unknown, aStack: unknown[], bStack: unknown[]): boolean {
  if (a === b) return (a as number) !== 0 || (1 / (a as number)) === (1 / (b as number));
  if (a == null || b == null) return a === b;

  const tag: string = Object.prototype.toString.call(a);
  if (tag !== Object.prototype.toString.call(b)) return false;

  switch (tag) {
    case '[object RegExp]':
    case '[object String]':  return '' + a === '' + b;
    case '[object Number]':
      if (+(a as number) !== +(a as number)) return +(b as number) !== +(b as number);
      return +(a as number) === 0 ? (1 / +(a as number)) === (1 / +(b as number)) : +(a as number) === +(b as number);
    case '[object Date]':
    case '[object Boolean]': return +(a as number) === +(b as number);
    case '[object Symbol]':
      return Symbol.prototype.valueOf.call(a) === Symbol.prototype.valueOf.call(b);
  }

  const areArrays: boolean = tag === '[object Array]';
  if (!areArrays) {
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    const aObj = a as Record<string, any>;
    const bObj = b as Record<string, any>;
    const aC = aObj.constructor, bC = bObj.constructor;
    if (aC !== bC &&
        !(typeof aC === 'function' && aC instanceof aC &&
          typeof bC === 'function' && bC instanceof bC) &&
        ('constructor' in aObj && 'constructor' in bObj)) return false;
  }

  let len: number = aStack.length;
  while (len--) {
    if (aStack[len] === a) return bStack[len] === b;
  }
  aStack.push(a); bStack.push(b);

  if (areArrays) {
    const aArr = a as unknown[];
    const bArr = b as unknown[];
    len = aArr.length;
    if (len !== bArr.length) { aStack.pop(); bStack.pop(); return false; }
    while (len--) {
      if (!deepEqual(aArr[len], bArr[len], aStack, bStack)) { aStack.pop(); bStack.pop(); return false; }
    }
  } else {
    const aRec = a as Record<string, unknown>;
    const bRec = b as Record<string, unknown>;
    const keys: string[] = Object.keys(aRec);
    let key: string;
    len = keys.length;
    if (Object.keys(bRec).length !== len) { aStack.pop(); bStack.pop(); return false; }
    while (len--) {
      key = keys[len];
      if (!Object.prototype.hasOwnProperty.call(bRec, key) ||
          !deepEqual(aRec[key], bRec[key], aStack, bStack)) { aStack.pop(); bStack.pop(); return false; }
    }
  }

  aStack.pop(); bStack.pop();
  return true;
}

function createGrouper(behavior: (result: any, value: any, key: any) => void, partition?: boolean): (obj: any, iteratee: any, context?: any) => any {
  return function(obj: any, iteratee: any, context?: any): any {
    const result: any = partition ? [[], []] : {};
    iteratee = makeIteratee(iteratee, context);
    _.each(obj, function(val: any, idx: any) { behavior(result, val, iteratee(val, idx, obj)); });
    return result;
  };
}

const _: Underscore = {} as Underscore;

_.VERSION = '1.0.0';
_.identity = identity;

_.isFunction = function(obj: unknown): obj is Function { return typeof obj === 'function'; };
_.isString   = function(obj: unknown): obj is string { return typeof obj === 'string'; };
_.isArray    = Array.isArray;
_.isRegExp   = function(obj: unknown): obj is RegExp { return obj instanceof RegExp; };
_.isObject   = function(obj: unknown): obj is object {
  const t: string = typeof obj;
  return t === 'function' || (t === 'object' && !!obj);
};

_.isEqual = function(a: unknown, b: unknown): boolean { return deepEqual(a, b, [], []); };

_.keys = function(obj: unknown): string[] {
  if (!_.isObject(obj)) return [];
  return Object.keys(obj);
};

_.values = function(obj: object): any[] { return Object.values(obj); };
_.pairs  = function(obj: object): [string, unknown][] { return Object.entries(obj) as [string, unknown][]; };

_.invert = function(obj: Record<string, string | number>): Record<string, string> {
  const result: Record<string, string> = {};
  const keys: string[] = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) result[String(obj[keys[i]])] = keys[i];
  return result;
};

_.extend = function<T extends object>(obj: T, ...rest: object[]): T {
  if (!_.isObject(obj)) return obj;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i]) Object.assign(obj, rest[i]);
  }
  return obj;
};

_.defaults = function<T extends object>(obj: T, ...rest: object[]): T {
  if (!_.isObject(obj)) return obj;
  for (let i = 0; i < rest.length; i++) {
    const src = rest[i] as Record<string, unknown>;
    if (src) {
      for (const key in src) {
        if ((obj as Record<string, unknown>)[key] === void 0) (obj as Record<string, unknown>)[key] = src[key];
      }
    }
  }
  return obj;
};

_.clone = function<T>(obj: T): T {
  if (!_.isObject(obj)) return obj;
  return (_.isArray(obj) ? obj.slice() : Object.assign({}, obj)) as T;
};

_.has = function(obj: unknown, key: string): boolean {
  return obj != null && Object.prototype.hasOwnProperty.call(obj, key);
};

_.pick = function(obj: any, ...args: any[]): Record<string, any> {
  const result: Record<string, any> = {};
  if (obj == null) return result;
  let i: number, key: string;
  if (args.length > 0 && !_.isFunction(args[0])) {
    const keys: string[] = _.isArray(args[0])
      ? args[0]
      : args;
    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      if (key in obj) result[key] = obj[key];
    }
  } else if (_.isFunction(args[0])) {
    const fn: Function = args[0], ctx: any = args[1];
    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && fn.call(ctx, obj[key], key, obj))
        result[key] = obj[key];
    }
  }
  return result;
};

_.omit = function(obj: any, ...args: any[]): Record<string, any> {
  const result: Record<string, any> = {};
  if (obj == null) return result;
  const omitMap: Record<string, boolean> = {};
  let keys: string[], key: string;
  keys = _.isArray(args[0])
    ? args[0]
    : args;
  for (let i = 0; i < keys.length; i++) omitMap[keys[i]] = true;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !omitMap[key])
      result[key] = obj[key];
  }
  return result;
};

_.functions = function(obj: object): string[] {
  const names: string[] = [];
  for (const key in obj) { if (_.isFunction((obj as any)[key])) names.push(key); }
  return names.sort();
};

_.create = function(proto: object, props?: object): any {
  const result: any = Object.create(proto);
  if (props) Object.assign(result, props);
  return result;
};

_.result = function(obj: any, prop: string, fallback?: any): any {
  let value: any = obj == null ? void 0 : obj[prop];
  if (value === void 0) value = fallback;
  return _.isFunction(value) ? value.call(obj) : value;
};

_.uniqueId = function(prefix?: string): string {
  const id: string = ++idCounter + '';
  return prefix ? prefix + id : id;
};

_.isEmpty = function(obj: unknown): boolean {
  if (obj == null) return true;
  if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
  return Object.keys(obj as object).length === 0;
};

const escapeMap: Record<string, string> = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '`': '&#x60;'};

_.escape = function(str: unknown): string {
  if (str == null) return '';
  return ('' + str).replace(/[&<>"'`]/g, function(m: string) { return escapeMap[m]; });
};

_.once = function<T extends (...args: any[]) => any>(fn: T): T {
  let ran: boolean = false, memo: any;
  return function(this: any) {
    if (ran) return memo;
    ran = true;
    memo = fn.apply(this, arguments as any);
    return memo;
  } as unknown as T;
};

_.defer = function(fn: Function, ...args: any[]): number {
  return setTimeout(function() { fn.apply(null, args); }, 0) as unknown as number;
};

_.matches  = makeMatches;
_.iteratee = makeIteratee;

_.property = function(path: string): (obj: any) => any {
  return function(obj: any): any { return obj == null ? void 0 : obj[path]; };
};

_.pluck = function(obj: any[], key: string): any[] { return _.map(obj, _.property(key)); };

_.each = _.forEach = function(obj: any, iteratee: (val: any, key: any, obj: any) => void, context?: any): any {
  if (obj == null) return obj;
  const fn: (val: any, key: any, obj: any) => void = context !== void 0
    ? function(v: any, k: any, o: any) { return iteratee.call(context, v, k, o); }
    : iteratee;
  if (_.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) fn(obj[i], i, obj);
  } else {
    const keys: string[] = Object.keys(obj);
    for (let j = 0; j < keys.length; j++) fn(obj[keys[j]], keys[j], obj);
  }
  return obj;
};

_.map = _.collect = function(obj: any, iteratee: any, context?: any): any[] {
  iteratee = makeIteratee(iteratee, context);
  const keys: string[] | false = !_.isArray(obj) && Object.keys(obj);
  const len: number = (keys || obj).length;
  const result: any[] = Array(len);
  for (let i = 0; i < len; i++) {
    const key: string | number = keys ? keys[i] : i;
    result[i] = iteratee(obj[key], key, obj);
  }
  return result;
};

_.reduce = _.foldl = _.inject = function(obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any): any {
  if (context !== void 0) {
    const orig = iteratee;
    iteratee = function(a: any, b: any, c: any, d: any) { return orig.call(context, a, b, c, d); };
  }
  const keys: string[] | false = !_.isArray(obj) && Object.keys(obj);
  const len: number = (keys || obj).length;
  let i: number = 0;
  if (arguments.length < 3) { memo = obj[keys ? keys[0] : 0]; i = 1; }
  for (; i < len; i++) {
    const k: string | number = keys ? keys[i] : i;
    memo = iteratee(memo, obj[k], k, obj);
  }
  return memo;
};

_.reduceRight = _.foldr = function(obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any): any {
  if (context !== void 0) {
    const orig = iteratee;
    iteratee = function(a: any, b: any, c: any, d: any) { return orig.call(context, a, b, c, d); };
  }
  const keys: string[] | false = !_.isArray(obj) && Object.keys(obj);
  const len: number = (keys || obj).length;
  let i: number = len - 1;
  if (arguments.length < 3) { memo = obj[keys ? keys[i] : i]; i--; }
  for (; i >= 0; i--) {
    const k: string | number = keys ? keys[i] : i;
    memo = iteratee(memo, obj[k], k, obj);
  }
  return memo;
};

_.findIndex = function(array: any[], predicate: any, context?: any): number {
  predicate = makeIteratee(predicate, context);
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i, array)) return i;
  }
  return -1;
};

_.findLastIndex = function(array: any[], predicate: any, context?: any): number {
  predicate = makeIteratee(predicate, context);
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i, array)) return i;
  }
  return -1;
};

_.find = _.detect = function(obj: any, predicate: any, context?: any): any {
  predicate = makeIteratee(predicate, context);
  if (_.isArray(obj)) {
    const idx: number = _.findIndex(obj, predicate);
    return idx >= 0 ? obj[idx] : void 0;
  }
  const keys: string[] = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    if (predicate(obj[keys[i]], keys[i], obj)) return obj[keys[i]];
  }
};

_.filter = _.select = function(obj: any, predicate: any, context?: any): any[] {
  const results: any[] = [];
  predicate = makeIteratee(predicate, context);
  _.each(obj, function(val: any, key: any, list: any) { if (predicate(val, key, list)) results.push(val); });
  return results;
};

_.reject = function(obj: any, predicate: any, context?: any): any[] {
  predicate = makeIteratee(predicate, context);
  const results: any[] = [];
  _.each(obj, function(val: any, key: any, list: any) { if (!predicate(val, key, list)) results.push(val); });
  return results;
};

_.every = _.all = function(obj: any, predicate: any, context?: any): boolean {
  predicate = makeIteratee(predicate, context);
  const keys: string[] | false = !_.isArray(obj) && Object.keys(obj);
  const len: number = (keys || obj).length;
  for (let i = 0; i < len; i++) {
    const k: string | number = keys ? keys[i] : i;
    if (!predicate(obj[k], k, obj)) return false;
  }
  return true;
};

_.some = _.any = function(obj: any, predicate: any, context?: any): boolean {
  predicate = makeIteratee(predicate, context);
  const keys: string[] | false = !_.isArray(obj) && Object.keys(obj);
  const len: number = (keys || obj).length;
  for (let i = 0; i < len; i++) {
    const k: string | number = keys ? keys[i] : i;
    if (predicate(obj[k], k, obj)) return true;
  }
  return false;
};

_.contains = _.includes = _.include = function(obj: any, item: unknown, fromIndex?: number): boolean {
  if (!_.isArray(obj)) obj = Object.values(obj);
  return obj.indexOf(item, fromIndex) >= 0;
};

_.invoke = function(obj: any[], path: string | Function, ...args: any[]): any[] {
  const isFn: boolean = _.isFunction(path);
  return _.map(obj, function(ctx: any) {
    const fn: any = isFn ? path : (ctx == null ? void 0 : ctx[path as string]);
    return fn == null ? fn : fn.apply(ctx, args);
  });
};

_.max = function(obj: any, iteratee?: any, context?: any): any {
  let result: any = -Infinity, lastComputed: number = -Infinity, val: any, computed: number;
  if (iteratee == null) {
    const list: any[] = _.isArray(obj) ? obj : Object.values(obj);
    for (let i = 0; i < list.length; i++) {
      val = list[i];
      if (val != null && val > result) result = val;
    }
  } else {
    iteratee = makeIteratee(iteratee, context);
    _.each(obj, function(v: any, k: any, o: any) {
      computed = iteratee(v, k, o);
      if (computed > lastComputed || (computed === -Infinity && result === -Infinity)) {
        result = v; lastComputed = computed;
      }
    });
  }
  return result;
};

_.min = function(obj: any, iteratee?: any, context?: any): any {
  let result: any = Infinity, lastComputed: number = Infinity, val: any, computed: number;
  if (iteratee == null) {
    const list: any[] = _.isArray(obj) ? obj : Object.values(obj);
    for (let i = 0; i < list.length; i++) {
      val = list[i];
      if (val != null && val < result) result = val;
    }
  } else {
    iteratee = makeIteratee(iteratee, context);
    _.each(obj, function(v: any, k: any, o: any) {
      computed = iteratee(v, k, o);
      if (computed < lastComputed || (computed === Infinity && result === Infinity)) {
        result = v; lastComputed = computed;
      }
    });
  }
  return result;
};

_.shuffle = function(obj: any): any[] {
  const arr: any[] = _.isArray(obj) ? obj.slice() : Object.values(obj);
  for (let i = arr.length - 1; i > 0; i--) {
    const j: number = Math.floor(Math.random() * (i + 1));
    const tmp: any = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
};

_.sample = function(obj: any, n?: number): any {
  const list: any[] = _.isArray(obj) ? obj : Object.values(obj);
  if (n == null) return list[Math.floor(Math.random() * list.length)];
  return _.shuffle(list).slice(0, Math.max(0, n));
};

_.sortBy = function(obj: any, iteratee: any, context?: any): any[] {
  let i: number = 0;
  iteratee = makeIteratee(iteratee, context);
  return _.pluck(
    _.map(obj, function(val: any, key: any, list: any) {
      return {value: val, index: i++, criteria: iteratee(val, key, list)};
    }).sort(function(left: {value: any; index: number; criteria: any}, right: {value: any; index: number; criteria: any}) {
      const a = left.criteria, b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }),
    'value'
  );
};

_.groupBy   = createGrouper(function(r: Record<string, any[]>, v: any, k: string) { if (_.has(r, k)) r[k].push(v); else r[k] = [v]; });
_.indexBy   = createGrouper(function(r: Record<string, any>, v: any, k: string) { r[k] = v; });
_.countBy   = createGrouper(function(r: Record<string, number>, _v: any, k: string) { if (_.has(r, k)) r[k]++; else r[k] = 1; });
_.partition = createGrouper(function(r: [any[], any[]], v: any, pass: boolean) { r[pass ? 0 : 1].push(v); }, true);

_.toArray = function(obj: unknown): any[] {
  if (!obj) return [];
  if (_.isArray(obj)) return obj.slice();
  if (_.isString(obj)) return obj.split('');
  return Object.values(obj as object);
};

_.size = function(obj: unknown): number {
  if (obj == null) return 0;
  return (_.isArray(obj) || _.isString(obj)) ? obj.length : Object.keys(obj as object).length;
};

_.first = _.head = _.take = function(array: any[] | null | undefined, n?: number): any {
  if (array == null || array.length < 1) return n == null ? void 0 : [];
  return n == null ? array[0] : array.slice(0, n);
};

_.initial = function(array: any[], n?: number): any[] {
  return array.slice(0, Math.max(0, array.length - (n == null ? 1 : n)));
};

_.last = function(array: any[] | null | undefined, n?: number): any {
  if (array == null || array.length < 1) return n == null ? void 0 : [];
  return n == null ? array[array.length - 1] : array.slice(Math.max(array.length - n, 0));
};

_.rest = _.tail = _.drop = function(array: any[], n?: number): any[] {
  return array.slice(n == null ? 1 : n);
};

_.compact = function(array: any[]): any[] {
  return array.filter(Boolean);
};

_.without = function(array: any[], ...values: any[]): any[] {
  return array.filter(function(v: any) { return values.indexOf(v) < 0; });
};

_.difference = function(array: any[], ...others: any[][]): any[] {
  const flat: any[] = ([] as any[]).concat(...others);
  return array.filter(function(v: any) { return flat.indexOf(v) < 0; });
};

_.indexOf     = function(array: any[], item: any, from?: number): number { return array.indexOf(item, from); };
_.lastIndexOf = function(array: any[], item: any, from?: number): number {
  return from !== void 0 ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
};

const ChainCtor: ChainConstructor = function(this: Chain, obj: any) { this._wrapped = obj; } as any;

const chainMethods: string[] = [
  'map', 'collect', 'filter', 'select', 'reject', 'sortBy', 'groupBy',
  'indexBy', 'countBy', 'partition', 'shuffle', 'sample',
  'first', 'head', 'take', 'initial', 'rest', 'tail', 'drop', 'last',
  'without', 'difference', 'toArray', 'invoke', 'pluck',
  'values', 'keys', 'pairs', 'invert',
  'pick', 'omit', 'clone', 'functions', 'compact',
  'each', 'forEach',
  'reduce', 'foldl', 'inject',
  'reduceRight', 'foldr',
  'find', 'detect',
  'every', 'all', 'some', 'any',
  'contains', 'includes', 'include',
  'max', 'min', 'size', 'isEmpty',
  'indexOf', 'lastIndexOf', 'findIndex', 'findLastIndex',
  'extend', 'defaults'
];

chainMethods.forEach(function(name: string) {
  if ((_ as any)[name]) {
    ChainCtor.prototype[name] = function(this: Chain) {
      const args: any[] = [this._wrapped].concat(Array.prototype.slice.call(arguments));
      return new ChainCtor((_ as any)[name].apply(_, args));
    };
  }
});

ChainCtor.prototype.value = function(this: Chain): any { return this._wrapped; };

_.chain = function(obj: any): Chain { return new ChainCtor(obj); };

_.dom = {
  query: function(selector: QuerySelector): Element | null {
    if (selector == null) return null;
    if (typeof selector === 'string') {
      if (/^\s*</.test(selector)) {
        const tmp: HTMLDivElement = document.createElement('div');
        tmp.innerHTML = selector.trim();
        return tmp.firstChild as Element;
      }
      return document.querySelector(selector);
    }
    if ((selector as Element).nodeType) return selector as Element;
    if ((selector as { [index: number]: Element })[0] && ((selector as { [index: number]: Element })[0] as Element).nodeType) return (selector as { [index: number]: Element })[0];
    return null;
  },

  setAttributes: function(el: Element, attrs: Record<string, string | null | undefined>): void {
    for (const key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        if (attrs[key] == null) {
          el.removeAttribute(key);
        } else {
          el.setAttribute(key, attrs[key] as string);
        }
      }
    }
  },

  remove: function(el: Element | null): void {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  },

  _registry: (function(): WeakMap<object, EventEntry[]> | null { try { return new WeakMap(); } catch (e) { return null; } }()),

  _entries: function(el: Element | null): EventEntry[] | null {
    const reg: WeakMap<object, EventEntry[]> | null = _.dom._registry;
    if (!reg || !el || typeof el !== 'object') return null;
    if (!reg.has(el)) reg.set(el, []);
    return reg.get(el)!;
  },

  on: function(el: Element, namespace: string, eventName: string, selector: string | null, listener: EventListener): void {
    let wrapped: EventListener;
    if (selector) {
      wrapped = function(e: Event): void {
        let target: Element | null = e.target as Element;
        while (target && target !== el) {
          if (target.matches && target.matches(selector)) {
            listener.call(target, e);
            return;
          }
          target = target.parentElement;
        }
      };
    } else {
      wrapped = listener;
    }

    el.addEventListener(eventName, wrapped);

    const entries: EventEntry[] | null = _.dom._entries(el);
    if (entries) {
      entries.push({namespace: namespace, eventName: eventName,
                    selector: selector, listener: listener, wrapped: wrapped});
    }
  },

  off: function(el: Element, namespace: string, eventName?: string | null, selector?: string | null, listener?: EventListener | null): void {
    const entries: EventEntry[] | null = _.dom._entries(el);
    if (!entries) return;

    const remaining: EventEntry[] = [];
    for (let i = 0; i < entries.length; i++) {
      const e: EventEntry = entries[i];
      const remove: boolean = e.namespace === namespace &&
        (eventName == null || e.eventName === eventName) &&
        (selector  == null || e.selector  === selector)  &&
        (listener  == null || e.listener  === listener);
      if (remove) {
        el.removeEventListener(e.eventName, e.wrapped);
      } else {
        remaining.push(e);
      }
    }

    entries.length = 0;
    for (let j = 0; j < remaining.length; j++) entries.push(remaining[j]);
  }
};

export default _;
