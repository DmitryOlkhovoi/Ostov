//     Backbone utils.ts
//     Replaces underscore.js and jQuery for Backbone.js.
//     Contains only the functions actually used by Backbone.

'use strict';

type Iteratee = (value: any, key: any, obj: any) => any;
type MatcherFn = (obj: any) => boolean;

interface EventEntry {
  namespace: string;
  eventName: string;
  selector: string | null;
  listener: EventListener;
  wrapped: EventListener;
}

interface DomUtilities {
  query(selector: any): Element | null;
  setAttributes(el: Element, attrs: Record<string, string | null | undefined>): void;
  remove(el: Element): void;
  _registry: WeakMap<object, EventEntry[]> | null;
  _entries(el: any): EventEntry[] | null;
  on(el: Element, namespace: string, eventName: string, selector: string | null, listener: EventListener): void;
  off(el: Element, namespace: string, eventName?: string | null, selector?: string | null, listener?: EventListener | null): void;
}

interface Chain {
  _wrapped: any;
  value(): any;
  [method: string]: any;
}

interface ChainConstructor {
  new (obj: any): Chain;
  prototype: Chain;
}

interface Underscore {
  VERSION: string;
  identity: (v: any) => any;
  isFunction(obj: any): obj is Function;
  isString(obj: any): obj is string;
  isArray(obj: any): obj is any[];
  isRegExp(obj: any): obj is RegExp;
  isObject(obj: any): boolean;
  isEqual(a: any, b: any): boolean;
  keys(obj: any): string[];
  values(obj: any): any[];
  pairs(obj: any): [string, any][];
  invert(obj: Record<string, any>): Record<string, string>;
  extend(obj: any, ...sources: any[]): any;
  defaults(obj: any, ...sources: any[]): any;
  clone(obj: any): any;
  has(obj: any, key: string): boolean;
  pick(obj: any, ...args: any[]): any;
  omit(obj: any, ...args: any[]): any;
  functions(obj: any): string[];
  create(proto: any, props?: any): any;
  result(obj: any, prop: string, fallback?: any): any;
  uniqueId(prefix?: string): string;
  isEmpty(obj: any): boolean;
  escape(str: any): string;
  once<T extends Function>(fn: T): T;
  defer(fn: Function, ...args: any[]): number;
  matches: (attrs: any) => MatcherFn;
  iteratee: (value: any, context?: any) => Iteratee;
  property(path: string): (obj: any) => any;
  pluck(obj: any, key: string): any[];
  each: (obj: any, iteratee: (val: any, key: any, obj: any) => void, context?: any) => any;
  forEach: (obj: any, iteratee: (val: any, key: any, obj: any) => void, context?: any) => any;
  map: (obj: any, iteratee: any, context?: any) => any[];
  collect: (obj: any, iteratee: any, context?: any) => any[];
  reduce: (obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any) => any;
  foldl: (obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any) => any;
  inject: (obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any) => any;
  reduceRight: (obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any) => any;
  foldr: (obj: any, iteratee: (memo: any, val: any, key: any, obj: any) => any, memo?: any, context?: any) => any;
  findIndex(array: any[], predicate: any, context?: any): number;
  findLastIndex(array: any[], predicate: any, context?: any): number;
  find: (obj: any, predicate: any, context?: any) => any;
  detect: (obj: any, predicate: any, context?: any) => any;
  filter: (obj: any, predicate: any, context?: any) => any[];
  select: (obj: any, predicate: any, context?: any) => any[];
  reject(obj: any, predicate: any, context?: any): any[];
  every: (obj: any, predicate: any, context?: any) => boolean;
  all: (obj: any, predicate: any, context?: any) => boolean;
  some: (obj: any, predicate: any, context?: any) => boolean;
  any: (obj: any, predicate: any, context?: any) => boolean;
  contains: (obj: any, item: any, fromIndex?: number) => boolean;
  includes: (obj: any, item: any, fromIndex?: number) => boolean;
  include: (obj: any, item: any, fromIndex?: number) => boolean;
  invoke(obj: any, path: any, ...args: any[]): any[];
  max(obj: any, iteratee?: any, context?: any): any;
  min(obj: any, iteratee?: any, context?: any): any;
  shuffle(obj: any): any[];
  sample(obj: any, n?: number): any;
  sortBy(obj: any, iteratee: any, context?: any): any[];
  groupBy: (obj: any, iteratee: any, context?: any) => Record<string, any[]>;
  indexBy: (obj: any, iteratee: any, context?: any) => Record<string, any>;
  countBy: (obj: any, iteratee: any, context?: any) => Record<string, number>;
  partition: (obj: any, iteratee: any, context?: any) => [any[], any[]];
  toArray(obj: any): any[];
  size(obj: any): number;
  first: (array: any[] | null | undefined, n?: number) => any;
  head: (array: any[] | null | undefined, n?: number) => any;
  take: (array: any[] | null | undefined, n?: number) => any;
  initial(array: any[], n?: number): any[];
  last(array: any[] | null | undefined, n?: number): any;
  rest: (array: any[], n?: number) => any[];
  tail: (array: any[], n?: number) => any[];
  drop: (array: any[], n?: number) => any[];
  compact(array: any[]): any[];
  without(array: any[], ...values: any[]): any[];
  difference(array: any[], ...others: any[][]): any[];
  indexOf(array: any[], item: any, from?: number): number;
  lastIndexOf(array: any[], item: any, from?: number): number;
  chain(obj: any): Chain;
  dom: DomUtilities;
}

let idCounter: number = 0;

function identity(v: any): any { return v; }

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

function makeMatches(attrs: any): MatcherFn {
  const pairs: [string, any][] = Object.entries(attrs);
  return function(obj: any): boolean {
    if (obj == null) return !pairs.length;
    obj = Object(obj);
    for (let i = 0; i < pairs.length; i++) {
      if (pairs[i][1] !== obj[pairs[i][0]] || !(pairs[i][0] in obj)) return false;
    }
    return true;
  };
}

function deepEqual(a: any, b: any, aStack: any[], bStack: any[]): boolean {
  if (a === b) return a !== 0 || (1 / a) === (1 / b);
  if (a == null || b == null) return a === b;

  const tag: string = Object.prototype.toString.call(a);
  if (tag !== Object.prototype.toString.call(b)) return false;

  switch (tag) {
    case '[object RegExp]':
    case '[object String]':  return '' + a === '' + b;
    case '[object Number]':
      if (+a !== +a) return +b !== +b;
      return +a === 0 ? (1 / +a) === (1 / +b) : +a === +b;
    case '[object Date]':
    case '[object Boolean]': return +a === +b;
    case '[object Symbol]':
      return Symbol.prototype.valueOf.call(a) === Symbol.prototype.valueOf.call(b);
  }

  const areArrays: boolean = tag === '[object Array]';
  if (!areArrays) {
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    const aC = a.constructor, bC = b.constructor;
    if (aC !== bC &&
        !(typeof aC === 'function' && aC instanceof aC &&
          typeof bC === 'function' && bC instanceof bC) &&
        ('constructor' in a && 'constructor' in b)) return false;
  }

  let len: number = aStack.length;
  while (len--) {
    if (aStack[len] === a) return bStack[len] === b;
  }
  aStack.push(a); bStack.push(b);

  if (areArrays) {
    len = a.length;
    if (len !== b.length) { aStack.pop(); bStack.pop(); return false; }
    while (len--) {
      if (!deepEqual(a[len], b[len], aStack, bStack)) { aStack.pop(); bStack.pop(); return false; }
    }
  } else {
    const keys: string[] = Object.keys(a);
    let key: string;
    len = keys.length;
    if (Object.keys(b).length !== len) { aStack.pop(); bStack.pop(); return false; }
    while (len--) {
      key = keys[len];
      if (!Object.prototype.hasOwnProperty.call(b, key) ||
          !deepEqual(a[key], b[key], aStack, bStack)) { aStack.pop(); bStack.pop(); return false; }
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

_.isFunction = function(obj: any): obj is Function { return typeof obj === 'function'; };
_.isString   = function(obj: any): obj is string { return typeof obj === 'string'; };
_.isArray    = Array.isArray;
_.isRegExp   = function(obj: any): obj is RegExp { return obj instanceof RegExp; };
_.isObject   = function(obj: any): boolean {
  const t: string = typeof obj;
  return t === 'function' || (t === 'object' && !!obj);
};

_.isEqual = function(a: any, b: any): boolean { return deepEqual(a, b, [], []); };

_.keys = function(obj: any): string[] {
  if (!_.isObject(obj)) return [];
  return Object.keys(obj);
};

_.values = function(obj: any): any[] { return Object.values(obj); };
_.pairs  = function(obj: any): [string, any][] { return Object.entries(obj) as [string, any][]; };

_.invert = function(obj: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};
  const keys: string[] = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) result[obj[keys[i]]] = keys[i];
  return result;
};

_.extend = function(obj: any, ...rest: any[]): any {
  if (!_.isObject(obj)) return obj;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i]) Object.assign(obj, rest[i]);
  }
  return obj;
};

_.defaults = function(obj: any, ...rest: any[]): any {
  if (!_.isObject(obj)) return obj;
  for (let i = 0; i < rest.length; i++) {
    const src: any = rest[i];
    if (src) {
      for (const key in src) {
        if (obj[key] === void 0) obj[key] = src[key];
      }
    }
  }
  return obj;
};

_.clone = function(obj: any): any {
  if (!_.isObject(obj)) return obj;
  return _.isArray(obj) ? obj.slice() : Object.assign({}, obj);
};

_.has = function(obj: any, key: string): boolean {
  return obj != null && Object.prototype.hasOwnProperty.call(obj, key);
};

_.pick = function(obj: any, ...args: any[]): any {
  const result: any = {};
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

_.omit = function(obj: any, ...args: any[]): any {
  const result: any = {};
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

_.functions = function(obj: any): string[] {
  const names: string[] = [];
  for (const key in obj) { if (_.isFunction(obj[key])) names.push(key); }
  return names.sort();
};

_.create = function(proto: any, props?: any): any {
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

_.isEmpty = function(obj: any): boolean {
  if (obj == null) return true;
  if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
  return Object.keys(obj).length === 0;
};

const escapeMap: Record<string, string> = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '`': '&#x60;'};

_.escape = function(str: any): string {
  if (str == null) return '';
  return ('' + str).replace(/[&<>"'`]/g, function(m: string) { return escapeMap[m]; });
};

_.once = function(fn: any): any {
  let ran: boolean = false, memo: any;
  return function(this: any) {
    if (ran) return memo;
    ran = true;
    memo = fn.apply(this, arguments);
    fn = null;
    return memo;
  };
};

_.defer = function(fn: Function, ...args: any[]): number {
  return setTimeout(function() { fn.apply(null, args); }, 0) as unknown as number;
};

_.matches  = makeMatches;
_.iteratee = makeIteratee;

_.property = function(path: string): (obj: any) => any {
  return function(obj: any): any { return obj == null ? void 0 : obj[path]; };
};

_.pluck = function(obj: any, key: string): any[] { return _.map(obj, _.property(key)); };

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
    const key: any = keys ? keys[i] : i;
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
    const k: any = keys ? keys[i] : i;
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
    const k: any = keys ? keys[i] : i;
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
    const k: any = keys ? keys[i] : i;
    if (!predicate(obj[k], k, obj)) return false;
  }
  return true;
};

_.some = _.any = function(obj: any, predicate: any, context?: any): boolean {
  predicate = makeIteratee(predicate, context);
  const keys: string[] | false = !_.isArray(obj) && Object.keys(obj);
  const len: number = (keys || obj).length;
  for (let i = 0; i < len; i++) {
    const k: any = keys ? keys[i] : i;
    if (predicate(obj[k], k, obj)) return true;
  }
  return false;
};

_.contains = _.includes = _.include = function(obj: any, item: any, fromIndex?: number): boolean {
  if (!_.isArray(obj)) obj = Object.values(obj);
  return obj.indexOf(item, fromIndex) >= 0;
};

_.invoke = function(obj: any, path: any, ...args: any[]): any[] {
  const isFn: boolean = _.isFunction(path);
  return _.map(obj, function(ctx: any) {
    const fn: any = isFn ? path : (ctx == null ? void 0 : ctx[path]);
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
    }).sort(function(left: any, right: any) {
      const a: any = left.criteria, b: any = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }),
    'value'
  );
};

_.groupBy   = createGrouper(function(r: any, v: any, k: any) { if (_.has(r, k)) r[k].push(v); else r[k] = [v]; });
_.indexBy   = createGrouper(function(r: any, v: any, k: any) { r[k] = v; });
_.countBy   = createGrouper(function(r: any, _v: any, k: any) { if (_.has(r, k)) r[k]++; else r[k] = 1; });
_.partition = createGrouper(function(r: any, v: any, pass: any) { r[pass ? 0 : 1].push(v); }, true);

_.toArray = function(obj: any): any[] {
  if (!obj) return [];
  if (_.isArray(obj)) return obj.slice();
  if (_.isString(obj)) return obj.split('');
  return Object.values(obj);
};

_.size = function(obj: any): number {
  if (obj == null) return 0;
  return (_.isArray(obj) || _.isString(obj)) ? obj.length : Object.keys(obj).length;
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
  query: function(selector: any): Element | null {
    if (selector == null) return null;
    if (typeof selector === 'string') {
      if (/^\s*</.test(selector)) {
        const tmp: HTMLDivElement = document.createElement('div');
        tmp.innerHTML = selector.trim();
        return tmp.firstChild as Element;
      }
      return document.querySelector(selector);
    }
    if (selector.nodeType) return selector;
    if (selector[0] && selector[0].nodeType) return selector[0];
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

  remove: function(el: Element): void {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  },

  _registry: (function(): WeakMap<object, EventEntry[]> | null { try { return new WeakMap(); } catch (e) { return null; } }()),

  _entries: function(el: any): EventEntry[] | null {
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
