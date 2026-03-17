//     Ostov utils.ts
//     Replaces underscore.js and jQuery for Ostov.js.
//     Contains only the functions actually used by Ostov.
let idCounter = 0;
function identity(v) { return v; }
function makeIteratee(value, context) {
    if (value == null)
        return identity;
    if (typeof value === 'function') {
        return context !== void 0
            ? function () { return value.apply(context, arguments); }
            : value;
    }
    if (typeof value === 'object' && !Array.isArray(value))
        return makeMatches(value);
    if (typeof value === 'string')
        return function (obj) { return obj == null ? void 0 : obj[value]; };
    return identity;
}
function makeMatches(attrs) {
    const pairs = Object.entries(attrs);
    return function (obj) {
        if (obj == null)
            return !pairs.length;
        const o = Object(obj);
        for (let i = 0; i < pairs.length; i++) {
            if (pairs[i][1] !== o[pairs[i][0]] || !(pairs[i][0] in o))
                return false;
        }
        return true;
    };
}
function deepEqual(a, b, aStack, bStack) {
    if (a === b)
        return a !== 0 || (1 / a) === (1 / b);
    if (a == null || b == null)
        return a === b;
    const tag = Object.prototype.toString.call(a);
    if (tag !== Object.prototype.toString.call(b))
        return false;
    switch (tag) {
        case '[object RegExp]':
        case '[object String]': return '' + a === '' + b;
        case '[object Number]':
            if (+a !== +a)
                return +b !== +b;
            return +a === 0 ? (1 / +a) === (1 / +b) : +a === +b;
        case '[object Date]':
        case '[object Boolean]': return +a === +b;
        case '[object Symbol]':
            return Symbol.prototype.valueOf.call(a) === Symbol.prototype.valueOf.call(b);
    }
    const areArrays = tag === '[object Array]';
    if (!areArrays) {
        if (typeof a !== 'object' || typeof b !== 'object')
            return false;
        const aObj = a;
        const bObj = b;
        const aC = aObj.constructor, bC = bObj.constructor;
        if (aC !== bC &&
            !(typeof aC === 'function' && aC instanceof aC &&
                typeof bC === 'function' && bC instanceof bC) &&
            ('constructor' in aObj && 'constructor' in bObj))
            return false;
    }
    let len = aStack.length;
    while (len--) {
        if (aStack[len] === a)
            return bStack[len] === b;
    }
    aStack.push(a);
    bStack.push(b);
    if (areArrays) {
        const aArr = a;
        const bArr = b;
        len = aArr.length;
        if (len !== bArr.length) {
            aStack.pop();
            bStack.pop();
            return false;
        }
        while (len--) {
            if (!deepEqual(aArr[len], bArr[len], aStack, bStack)) {
                aStack.pop();
                bStack.pop();
                return false;
            }
        }
    }
    else {
        const aRec = a;
        const bRec = b;
        const keys = Object.keys(aRec);
        let key;
        len = keys.length;
        if (Object.keys(bRec).length !== len) {
            aStack.pop();
            bStack.pop();
            return false;
        }
        while (len--) {
            key = keys[len];
            if (!Object.prototype.hasOwnProperty.call(bRec, key) ||
                !deepEqual(aRec[key], bRec[key], aStack, bStack)) {
                aStack.pop();
                bStack.pop();
                return false;
            }
        }
    }
    aStack.pop();
    bStack.pop();
    return true;
}
function createGrouper(behavior, partition) {
    return function (obj, iteratee, context) {
        const result = partition ? [[], []] : {};
        iteratee = makeIteratee(iteratee, context);
        _.each(obj, function (val, idx) { behavior(result, val, iteratee(val, idx, obj)); });
        return result;
    };
}
const _ = {};
_.VERSION = '1.0.0';
_.identity = identity;
_.isFunction = function (obj) { return typeof obj === 'function'; };
_.isString = function (obj) { return typeof obj === 'string'; };
_.isArray = Array.isArray;
_.isRegExp = function (obj) { return obj instanceof RegExp; };
_.isObject = function (obj) {
    const t = typeof obj;
    return t === 'function' || (t === 'object' && !!obj);
};
_.isEqual = function (a, b) { return deepEqual(a, b, [], []); };
_.keys = function (obj) {
    if (!_.isObject(obj))
        return [];
    return Object.keys(obj);
};
_.values = function (obj) { return Object.values(obj); };
_.pairs = function (obj) { return Object.entries(obj); };
_.invert = function (obj) {
    const result = {};
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++)
        result[String(obj[keys[i]])] = keys[i];
    return result;
};
_.extend = function (obj, ...rest) {
    if (!_.isObject(obj))
        return obj;
    for (let i = 0; i < rest.length; i++) {
        if (rest[i])
            Object.assign(obj, rest[i]);
    }
    return obj;
};
_.defaults = function (obj, ...rest) {
    if (!_.isObject(obj))
        return obj;
    for (let i = 0; i < rest.length; i++) {
        const src = rest[i];
        if (src) {
            for (const key in src) {
                if (obj[key] === void 0)
                    obj[key] = src[key];
            }
        }
    }
    return obj;
};
_.clone = function (obj) {
    if (!_.isObject(obj))
        return obj;
    return (_.isArray(obj) ? obj.slice() : Object.assign({}, obj));
};
_.has = function (obj, key) {
    return obj != null && Object.prototype.hasOwnProperty.call(obj, key);
};
_.pick = function (obj, ...args) {
    const result = {};
    if (obj == null)
        return result;
    let i, key;
    if (args.length > 0 && !_.isFunction(args[0])) {
        const keys = _.isArray(args[0])
            ? args[0]
            : args;
        for (i = 0; i < keys.length; i++) {
            key = keys[i];
            if (key in obj)
                result[key] = obj[key];
        }
    }
    else if (_.isFunction(args[0])) {
        const fn = args[0], ctx = args[1];
        for (key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && fn.call(ctx, obj[key], key, obj))
                result[key] = obj[key];
        }
    }
    return result;
};
_.omit = function (obj, ...args) {
    const result = {};
    if (obj == null)
        return result;
    const omitMap = {};
    let keys, key;
    keys = _.isArray(args[0])
        ? args[0]
        : args;
    for (let i = 0; i < keys.length; i++)
        omitMap[keys[i]] = true;
    for (key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && !omitMap[key])
            result[key] = obj[key];
    }
    return result;
};
_.functions = function (obj) {
    const names = [];
    for (const key in obj) {
        if (_.isFunction(obj[key]))
            names.push(key);
    }
    return names.sort();
};
_.create = function (proto, props) {
    const result = Object.create(proto);
    if (props)
        Object.assign(result, props);
    return result;
};
_.result = function (obj, prop, fallback) {
    let value = obj == null ? void 0 : obj[prop];
    if (value === void 0)
        value = fallback;
    return _.isFunction(value) ? value.call(obj) : value;
};
_.uniqueId = function (prefix) {
    const id = ++idCounter + '';
    return prefix ? prefix + id : id;
};
_.isEmpty = function (obj) {
    if (obj == null)
        return true;
    if (_.isArray(obj) || _.isString(obj))
        return obj.length === 0;
    return Object.keys(obj).length === 0;
};
const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '`': '&#x60;' };
_.escape = function (str) {
    if (str == null)
        return '';
    return ('' + str).replace(/[&<>"'`]/g, function (m) { return escapeMap[m]; });
};
_.once = function (fn) {
    let ran = false, memo;
    return function () {
        if (ran)
            return memo;
        ran = true;
        memo = fn.apply(this, arguments);
        return memo;
    };
};
_.defer = function (fn, ...args) {
    return setTimeout(function () { fn.apply(null, args); }, 0);
};
_.matches = makeMatches;
_.iteratee = makeIteratee;
_.property = function (path) {
    return function (obj) { return obj == null ? void 0 : obj[path]; };
};
_.pluck = function (obj, key) { return _.map(obj, _.property(key)); };
_.each = _.forEach = function (obj, iteratee, context) {
    if (obj == null)
        return obj;
    const fn = context !== void 0
        ? function (v, k, o) { return iteratee.call(context, v, k, o); }
        : iteratee;
    if (_.isArray(obj)) {
        for (let i = 0; i < obj.length; i++)
            fn(obj[i], i, obj);
    }
    else {
        const keys = Object.keys(obj);
        for (let j = 0; j < keys.length; j++)
            fn(obj[keys[j]], keys[j], obj);
    }
    return obj;
};
_.map = _.collect = function (obj, iteratee, context) {
    iteratee = makeIteratee(iteratee, context);
    const keys = !_.isArray(obj) && Object.keys(obj);
    const len = (keys || obj).length;
    const result = Array(len);
    for (let i = 0; i < len; i++) {
        const key = keys ? keys[i] : i;
        result[i] = iteratee(obj[key], key, obj);
    }
    return result;
};
_.reduce = _.foldl = _.inject = function (obj, iteratee, memo, context) {
    if (context !== void 0) {
        const orig = iteratee;
        iteratee = function (a, b, c, d) { return orig.call(context, a, b, c, d); };
    }
    const keys = !_.isArray(obj) && Object.keys(obj);
    const len = (keys || obj).length;
    let i = 0;
    if (arguments.length < 3) {
        memo = obj[keys ? keys[0] : 0];
        i = 1;
    }
    for (; i < len; i++) {
        const k = keys ? keys[i] : i;
        memo = iteratee(memo, obj[k], k, obj);
    }
    return memo;
};
_.reduceRight = _.foldr = function (obj, iteratee, memo, context) {
    if (context !== void 0) {
        const orig = iteratee;
        iteratee = function (a, b, c, d) { return orig.call(context, a, b, c, d); };
    }
    const keys = !_.isArray(obj) && Object.keys(obj);
    const len = (keys || obj).length;
    let i = len - 1;
    if (arguments.length < 3) {
        memo = obj[keys ? keys[i] : i];
        i--;
    }
    for (; i >= 0; i--) {
        const k = keys ? keys[i] : i;
        memo = iteratee(memo, obj[k], k, obj);
    }
    return memo;
};
_.findIndex = function (array, predicate, context) {
    predicate = makeIteratee(predicate, context);
    for (let i = 0; i < array.length; i++) {
        if (predicate(array[i], i, array))
            return i;
    }
    return -1;
};
_.findLastIndex = function (array, predicate, context) {
    predicate = makeIteratee(predicate, context);
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i], i, array))
            return i;
    }
    return -1;
};
_.find = _.detect = function (obj, predicate, context) {
    predicate = makeIteratee(predicate, context);
    if (_.isArray(obj)) {
        const idx = _.findIndex(obj, predicate);
        return idx >= 0 ? obj[idx] : void 0;
    }
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        if (predicate(obj[keys[i]], keys[i], obj))
            return obj[keys[i]];
    }
};
_.filter = _.select = function (obj, predicate, context) {
    const results = [];
    predicate = makeIteratee(predicate, context);
    _.each(obj, function (val, key, list) { if (predicate(val, key, list))
        results.push(val); });
    return results;
};
_.reject = function (obj, predicate, context) {
    predicate = makeIteratee(predicate, context);
    const results = [];
    _.each(obj, function (val, key, list) { if (!predicate(val, key, list))
        results.push(val); });
    return results;
};
_.every = _.all = function (obj, predicate, context) {
    predicate = makeIteratee(predicate, context);
    const keys = !_.isArray(obj) && Object.keys(obj);
    const len = (keys || obj).length;
    for (let i = 0; i < len; i++) {
        const k = keys ? keys[i] : i;
        if (!predicate(obj[k], k, obj))
            return false;
    }
    return true;
};
_.some = _.any = function (obj, predicate, context) {
    predicate = makeIteratee(predicate, context);
    const keys = !_.isArray(obj) && Object.keys(obj);
    const len = (keys || obj).length;
    for (let i = 0; i < len; i++) {
        const k = keys ? keys[i] : i;
        if (predicate(obj[k], k, obj))
            return true;
    }
    return false;
};
_.contains = _.includes = _.include = function (obj, item, fromIndex) {
    if (!_.isArray(obj))
        obj = Object.values(obj);
    return obj.indexOf(item, fromIndex) >= 0;
};
_.invoke = function (obj, path, ...args) {
    const isFn = _.isFunction(path);
    return _.map(obj, function (ctx) {
        const fn = isFn ? path : (ctx == null ? void 0 : ctx[path]);
        return fn == null ? fn : fn.apply(ctx, args);
    });
};
_.max = function (obj, iteratee, context) {
    let result = -Infinity, lastComputed = -Infinity, val, computed;
    if (iteratee == null) {
        const list = _.isArray(obj) ? obj : Object.values(obj);
        for (let i = 0; i < list.length; i++) {
            val = list[i];
            if (val != null && val > result)
                result = val;
        }
    }
    else {
        iteratee = makeIteratee(iteratee, context);
        _.each(obj, function (v, k, o) {
            computed = iteratee(v, k, o);
            if (computed > lastComputed || (computed === -Infinity && result === -Infinity)) {
                result = v;
                lastComputed = computed;
            }
        });
    }
    return result;
};
_.min = function (obj, iteratee, context) {
    let result = Infinity, lastComputed = Infinity, val, computed;
    if (iteratee == null) {
        const list = _.isArray(obj) ? obj : Object.values(obj);
        for (let i = 0; i < list.length; i++) {
            val = list[i];
            if (val != null && val < result)
                result = val;
        }
    }
    else {
        iteratee = makeIteratee(iteratee, context);
        _.each(obj, function (v, k, o) {
            computed = iteratee(v, k, o);
            if (computed < lastComputed || (computed === Infinity && result === Infinity)) {
                result = v;
                lastComputed = computed;
            }
        });
    }
    return result;
};
_.shuffle = function (obj) {
    const arr = _.isArray(obj) ? obj.slice() : Object.values(obj);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
};
_.sample = function (obj, n) {
    const list = _.isArray(obj) ? obj : Object.values(obj);
    if (n == null)
        return list[Math.floor(Math.random() * list.length)];
    return _.shuffle(list).slice(0, Math.max(0, n));
};
_.sortBy = function (obj, iteratee, context) {
    let i = 0;
    iteratee = makeIteratee(iteratee, context);
    return _.pluck(_.map(obj, function (val, key, list) {
        return { value: val, index: i++, criteria: iteratee(val, key, list) };
    }).sort(function (left, right) {
        const a = left.criteria, b = right.criteria;
        if (a !== b) {
            if (a > b || a === void 0)
                return 1;
            if (a < b || b === void 0)
                return -1;
        }
        return left.index - right.index;
    }), 'value');
};
_.groupBy = createGrouper(function (r, v, k) { if (_.has(r, k))
    r[k].push(v);
else
    r[k] = [v]; });
_.indexBy = createGrouper(function (r, v, k) { r[k] = v; });
_.countBy = createGrouper(function (r, _v, k) { if (_.has(r, k))
    r[k]++;
else
    r[k] = 1; });
_.partition = createGrouper(function (r, v, pass) { r[pass ? 0 : 1].push(v); }, true);
_.toArray = function (obj) {
    if (!obj)
        return [];
    if (_.isArray(obj))
        return obj.slice();
    if (_.isString(obj))
        return obj.split('');
    return Object.values(obj);
};
_.size = function (obj) {
    if (obj == null)
        return 0;
    return (_.isArray(obj) || _.isString(obj)) ? obj.length : Object.keys(obj).length;
};
_.first = _.head = _.take = function (array, n) {
    if (array == null || array.length < 1)
        return n == null ? void 0 : [];
    return n == null ? array[0] : array.slice(0, n);
};
_.initial = function (array, n) {
    return array.slice(0, Math.max(0, array.length - (n == null ? 1 : n)));
};
_.last = function (array, n) {
    if (array == null || array.length < 1)
        return n == null ? void 0 : [];
    return n == null ? array[array.length - 1] : array.slice(Math.max(array.length - n, 0));
};
_.rest = _.tail = _.drop = function (array, n) {
    return array.slice(n == null ? 1 : n);
};
_.compact = function (array) {
    return array.filter(Boolean);
};
_.without = function (array, ...values) {
    return array.filter(function (v) { return values.indexOf(v) < 0; });
};
_.difference = function (array, ...others) {
    const flat = [].concat(...others);
    return array.filter(function (v) { return flat.indexOf(v) < 0; });
};
_.indexOf = function (array, item, from) { return array.indexOf(item, from); };
_.lastIndexOf = function (array, item, from) {
    return from !== void 0 ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
};
const ChainCtor = function (obj) { this._wrapped = obj; };
const chainMethods = [
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
chainMethods.forEach(function (name) {
    if (_[name]) {
        ChainCtor.prototype[name] = function () {
            const args = [this._wrapped].concat(Array.prototype.slice.call(arguments));
            return new ChainCtor(_[name].apply(_, args));
        };
    }
});
ChainCtor.prototype.value = function () { return this._wrapped; };
_.chain = function (obj) { return new ChainCtor(obj); };
_.dom = {
    query: function (selector) {
        if (selector == null)
            return null;
        if (typeof selector === 'string') {
            if (/^\s*</.test(selector)) {
                const tmp = document.createElement('div');
                tmp.innerHTML = selector.trim();
                return tmp.firstChild;
            }
            return document.querySelector(selector);
        }
        if (selector.nodeType)
            return selector;
        if (selector[0] && selector[0].nodeType)
            return selector[0];
        return null;
    },
    setAttributes: function (el, attrs) {
        for (const key in attrs) {
            if (Object.prototype.hasOwnProperty.call(attrs, key)) {
                if (attrs[key] == null) {
                    el.removeAttribute(key);
                }
                else {
                    el.setAttribute(key, attrs[key]);
                }
            }
        }
    },
    remove: function (el) {
        if (el && el.parentNode)
            el.parentNode.removeChild(el);
    },
    _registry: (function () { try {
        return new WeakMap();
    }
    catch (e) {
        return null;
    } }()),
    _entries: function (el) {
        const reg = _.dom._registry;
        if (!reg || !el || typeof el !== 'object')
            return null;
        if (!reg.has(el))
            reg.set(el, []);
        return reg.get(el);
    },
    on: function (el, namespace, eventName, selector, listener) {
        let wrapped;
        if (selector) {
            wrapped = function (e) {
                let target = e.target;
                while (target && target !== el) {
                    if (target.matches && target.matches(selector)) {
                        listener.call(target, e);
                        return;
                    }
                    target = target.parentElement;
                }
            };
        }
        else {
            wrapped = listener;
        }
        el.addEventListener(eventName, wrapped);
        const entries = _.dom._entries(el);
        if (entries) {
            entries.push({ namespace: namespace, eventName: eventName,
                selector: selector, listener: listener, wrapped: wrapped });
        }
    },
    off: function (el, namespace, eventName, selector, listener) {
        const entries = _.dom._entries(el);
        if (!entries)
            return;
        const remaining = [];
        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            const remove = e.namespace === namespace &&
                (eventName == null || e.eventName === eventName) &&
                (selector == null || e.selector === selector) &&
                (listener == null || e.listener === listener);
            if (remove) {
                el.removeEventListener(e.eventName, e.wrapped);
            }
            else {
                remaining.push(e);
            }
        }
        entries.length = 0;
        for (let j = 0; j < remaining.length; j++)
            entries.push(remaining[j]);
    }
};

//     Ostov.js 1.7.7
//     (c) 2010-2024 Olkhovoy Dmitry
//     Ostov may be freely distributed under the MIT license.
//     For all details and documentation:
//     https://ostovjs.org
// Establish the root object, `window` (`self`) in the browser, or `global` on the server.
// We use `self` instead of `window` for `WebWorker` support.
const root = (typeof self === 'object' && self.self === self && self) ||
    (typeof globalThis === 'object' && globalThis) ||
    {};
// Initial Setup
// -------------
// Save the previous value of the `Ostov` variable, so that it can be
// restored later on, if `noConflict` is used.
const previousBackbone = root.Ostov;
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
        if (callback !== void 0 && 'context' in opts && opts.context === void 0)
            opts.context = callback;
        for (names = Object.keys(name); i < names.length; i++) {
            events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
        }
    }
    else if (name && eventSplitter.test(name)) {
        // Handle space-separated event names by delegating them individually.
        for (names = name.split(eventSplitter); i < names.length; i++) {
            events = iteratee(events, names[i], callback, opts);
        }
    }
    else {
        // Finally, standard events.
        events = iteratee(events, name, callback, opts);
    }
    return events;
};
const EventsImpl = {};
// Bind an event to a `callback` function. Passing `"all"` will bind
// the callback to all events fired.
EventsImpl.on = function (name, callback, context) {
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
EventsImpl.listenTo = function (obj, name, callback) {
    if (!obj)
        return this;
    obj._listenId ?? (obj._listenId = _.uniqueId('l'));
    const id = obj._listenId;
    this._listeningTo ?? (this._listeningTo = {});
    const listeningTo = this._listeningTo;
    let listening = _listening = listeningTo[id];
    // This object is not listening to any other events on `obj` yet.
    // Setup the necessary references to track the listening callbacks.
    if (!listening) {
        this._listenId ?? (this._listenId = _.uniqueId('l'));
        listening = _listening = listeningTo[id] = new Listening(this, obj);
    }
    // Bind callbacks on obj.
    const error = tryCatchOn(obj, name, callback, this);
    _listening = void 0;
    if (error)
        throw error;
    // If the target obj is not Ostov.Events, track events manually.
    if (listening.interop)
        listening.on(name, callback);
    return this;
};
// The reducing API that adds a callback to the `events` object.
const onApi = (events, name, callback, options) => {
    if (callback) {
        events[name] ?? (events[name] = []);
        const handlers = events[name];
        const context = options.context, ctx = options.ctx, listening = options.listening;
        if (listening)
            listening.count++;
        handlers.push({ callback: callback, context: context, ctx: context || ctx, listening: listening });
    }
    return events;
};
// An try-catch guarded #on function, to prevent poisoning the global
// `_listening` variable.
const tryCatchOn = (obj, name, callback, context) => {
    try {
        obj.on(name, callback, context);
    }
    catch (e) {
        return e;
    }
};
// Remove one or many callbacks. If `context` is null, removes all
// callbacks with that function. If `callback` is null, removes all
// callbacks for the event. If `name` is null, removes all bound
// callbacks for all events.
EventsImpl.off = function (name, callback, context) {
    if (!this._events)
        return this;
    this._events = eventsApi(offApi, this._events, name, callback, {
        context: context,
        listeners: this._listeners
    });
    return this;
};
// Tell this object to stop listening to either specific events ... or
// to every object it's currently listening to.
EventsImpl.stopListening = function (obj, name, callback) {
    const listeningTo = this._listeningTo;
    if (!listeningTo)
        return this;
    const ids = obj ? [obj._listenId] : Object.keys(listeningTo);
    for (let i = 0; i < ids.length; i++) {
        const listening = listeningTo[ids[i]];
        // If listening doesn't exist, this object is not currently
        // listening to obj. Break out early.
        if (!listening)
            break;
        listening.obj.off(name, callback, this);
        if (listening.interop)
            listening.off(name, callback);
    }
    if (_.isEmpty(listeningTo))
        this._listeningTo = void 0;
    return this;
};
// The reducing API that removes a callback from the `events` object.
const offApi = (events, name, callback, options) => {
    if (!events)
        return;
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
        if (!handlers)
            break;
        // Find any remaining events.
        const remaining = [];
        for (let j = 0; j < handlers.length; j++) {
            const handler = handlers[j];
            if (callback && callback !== handler.callback &&
                callback !== handler.callback._callback ||
                context && context !== handler.context) {
                remaining.push(handler);
            }
            else {
                handler.listening?.off(name, callback);
            }
        }
        // Replace events if there are any remaining.  Otherwise, clean up.
        if (remaining.length) {
            events[name] = remaining;
        }
        else {
            delete events[name];
        }
    }
    return events;
};
// Bind an event to only be triggered a single time. After the first time
// the callback is invoked, its listener will be removed. If multiple events
// are passed in using the space-separated syntax, the handler will fire
// once for each event, not once for a combination of all events.
EventsImpl.once = function (name, callback, context) {
    // Map the event into a `{event: once}` object.
    const events = eventsApi(onceMap, {}, name, callback, this.off.bind(this));
    if (typeof name === 'string' && context == null)
        callback = void 0;
    return this.on(events, callback, context);
};
// Inversion-of-control versions of `once`.
EventsImpl.listenToOnce = function (obj, name, callback) {
    // Map the event into a `{event: once}` object.
    const events = eventsApi(onceMap, {}, name, callback, this.stopListening.bind(this, obj));
    return this.listenTo(obj, events);
};
// Reduces the event callbacks into a map of `{event: onceWrapper}`.
// `offer` unbinds the `onceWrapper` after it has been called.
const onceMap = (map, name, callback, offer) => {
    if (callback) {
        const once = map[name] = _.once(function () {
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
EventsImpl.trigger = function (name, ...args) {
    if (!this._events)
        return this;
    eventsApi(triggerApi, this._events, name, void 0, args);
    return this;
};
// Handles triggering the appropriate event callbacks.
const triggerApi = (objEvents, name, _callback, args) => {
    if (objEvents) {
        const events = objEvents[name];
        let allEvents = objEvents.all;
        if (events && allEvents)
            allEvents = allEvents.slice();
        if (events)
            triggerEvents(events, args);
        if (allEvents)
            triggerEvents(allEvents, [name].concat(args));
    }
    return objEvents;
};
// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Ostov events have 3 arguments).
const triggerEvents = (events, args) => {
    let ev, i = -1;
    const l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
        case 0:
            while (++i < l)
                (ev = events[i]).callback.call(ev.ctx);
            return;
        case 1:
            while (++i < l)
                (ev = events[i]).callback.call(ev.ctx, a1);
            return;
        case 2:
            while (++i < l)
                (ev = events[i]).callback.call(ev.ctx, a1, a2);
            return;
        case 3:
            while (++i < l)
                (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
            return;
        default:
            while (++i < l)
                (ev = events[i]).callback.apply(ev.ctx, args);
            return;
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
        this.on = EventsImpl.on;
    }
    // Offs a callback (or several).
    // Uses an optimized counter if the listenee uses Ostov.Events.
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
        }
        else {
            this.count--;
            cleanup = this.count === 0;
        }
        if (cleanup)
            this.cleanup();
    }
    // Cleans up memory bindings between the listener and the listenee.
    cleanup() {
        delete this.listener._listeningTo[this.obj._listenId];
        if (!this.interop)
            delete this.obj._listeners[this.id];
    }
}
// Aliases for backwards compatibility.
EventsImpl.bind = EventsImpl.on;
EventsImpl.unbind = EventsImpl.off;
// Allow the `Ostov` object to serve as a global event bus, for folks who
// want global "pubsub" in a convenient place.
const Events = EventsImpl;
// Base class for all Ostov classes, with Events mixed in.
class BackboneBase {
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
class Model extends BackboneBase {
    constructor(attributes, options = {}) {
        super();
        // Create proxy before setup so all internal operations (set, initialize,
        // listenTo) use a consistent 'this', and subclass class fields are intercepted.
        const self = this;
        const proxy = new Proxy(this, {
            defineProperty(target, prop, descriptor) {
                // Modern JS/TS with useDefineForClassFields:true uses Object.defineProperty
                // for class fields, bypassing prototype setters. Intercept `defaults` so
                // it merges into attributes even when assigned as a class field.
                if ('value' in descriptor && prop === 'defaults') {
                    const value = descriptor.value;
                    const resolved = typeof value === 'function' ? value.call(self) : value;
                    if (resolved && self.attributes) {
                        for (const key in resolved) {
                            if (!(key in self.attributes))
                                self.attributes[key] = resolved[key];
                        }
                    }
                    return true;
                }
                return Reflect.defineProperty(target, prop, descriptor);
            }
        });
        let attrs = (attributes || {});
        proxy.preinitialize.apply(proxy, arguments);
        this.cid = _.uniqueId(this.cidPrefix);
        this.attributes = {};
        if (options.collection)
            this.collection = options.collection;
        if (options.parse)
            attrs = (proxy.parse(attrs, options) || {});
        const defaults = _.result(proxy, 'defaults');
        // Just _.defaults would work fine, but the additional _.extends
        // is in there for historical reasons. See #3843.
        attrs = _.defaults({ ...defaults, ...attrs }, defaults);
        proxy.set(attrs, options);
        this.changed = {};
        proxy.initialize.apply(proxy, arguments);
        return proxy;
    }
    /**
     * Return a copy of the model's `attributes` object.
     */
    toJSON(_options) {
        return _.clone(this.attributes);
    }
    /**
     * Proxy `Ostov.sync` by default -- but override this if you need
     * custom syncing semantics for *this* particular model.
     */
    sync(...args) {
        return Ostov.sync.apply(this, args);
    }
    /**
     * Get the current value of an attribute from the model.
     * @example note.get("title")
     * @see http://ostovjs.org/#Model-get
     */
    get(attr) {
        return this.attributes[attr];
    }
    /**
     * Get the HTML-escaped value of an attribute.
     * @see http://ostovjs.org/#Model-escape
     */
    escape(attr) {
        return _.escape(this.get(attr));
    }
    /**
     * Returns `true` if the attribute contains a value that is not null
     * or undefined.
     * @see http://ostovjs.org/#Model-has
     */
    has(attr) {
        return this.get(attr) != null;
    }
    /**
     * Special-cased proxy to underscore's `_.matches` method.
     * @see http://ostovjs.org/#Model-matches
     */
    matches(attrs) {
        return !!_.iteratee(attrs, this)(this.attributes);
    }
    set(key, val, options = {}) {
        if (key == null)
            return this;
        // Handle both `"key", value` and `{key: value}` -style arguments.
        let attrs;
        if (typeof key === 'object') {
            attrs = key;
            options = val || {};
        }
        else {
            (attrs = {})[key] = val;
        }
        // Run validation.
        if (!this._validate(attrs, options))
            return false;
        // Extract attributes and options.
        const unset = !!options.unset;
        const silent = !!options.silent;
        const changes = [];
        const changing = this._changing;
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
            if (!_.isEqual(current[attr], val))
                changes.push(attr);
            if (!_.isEqual(prev[attr], val)) {
                changed[attr] = val;
            }
            else {
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
            if (changes.length)
                this._pending = options;
            for (let i = 0; i < changes.length; i++) {
                this.trigger(`change:${changes[i]}`, this, current[changes[i]], options);
            }
        }
        // You might be wondering why there's a `while` loop here. Changes can
        // be recursively nested within `"change"` events.
        if (changing)
            return this;
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
    unset(attr, options) {
        return this.set(attr, void 0, { ...options, unset: true });
    }
    /**
     * Clear all attributes on the model, firing `"change"`.
     */
    clear(options) {
        const attrs = {};
        for (const key in this.attributes)
            attrs[key] = void 0;
        return this.set(attrs, { ...options, unset: true });
    }
    /**
     * Determine if the model has changed since the last `"change"` event.
     * If you specify an attribute name, determine if that attribute has changed.
     */
    hasChanged(attr) {
        if (attr == null)
            return !_.isEmpty(this.changed);
        return _.has(this.changed, attr);
    }
    /**
     * Return an object containing all the attributes that have changed, or
     * false if there are no changed attributes.
     */
    changedAttributes(diff) {
        if (!diff)
            return this.hasChanged() ? _.clone(this.changed) : false;
        const old = this._changing ? this._previousAttributes : this.attributes;
        const changed = {};
        let hasChanged;
        for (const attr in diff) {
            const val = diff[attr];
            if (_.isEqual(old[attr], val))
                continue;
            changed[attr] = val;
            hasChanged = true;
        }
        return hasChanged ? changed : false;
    }
    /**
     * Get the previous value of an attribute, recorded at the time the last
     * `"change"` event was fired.
     */
    previous(attr) {
        if (attr == null || !this._previousAttributes)
            return undefined;
        return this._previousAttributes[attr];
    }
    /**
     * Get all of the attributes of the model at the time of the previous
     * `"change"` event.
     */
    previousAttributes() {
        return _.clone(this._previousAttributes);
    }
    /**
     * Fetch the model from the server, merging the response with the model's
     * local attributes.
     */
    fetch(options) {
        options = { parse: true, ...options };
        const success = options.success;
        options.success = (resp) => {
            const serverAttrs = options.parse ? this.parse(resp, options) : resp;
            if (!this.set(serverAttrs, options))
                return false;
            success?.call(options.context, this, resp, options);
            this.trigger('sync', this, resp, options);
        };
        wrapError(this, options);
        return this.sync('read', this, options);
    }
    /**
     * Set a hash of model attributes, and sync the model to the server.
     */
    save(key, val, options) {
        // Handle both `"key", value` and `{key: value}` -style arguments.
        let attrs;
        if (key == null || typeof key === 'object') {
            attrs = key;
            options = val;
        }
        else {
            (attrs = {})[key] = val;
        }
        options = { validate: true, parse: true, ...options };
        const wait = options.wait;
        // If we're not waiting and attributes exist, save acts as
        // `set(attr).save(null, opts)` with validation. Otherwise, check if
        // the model will be valid when the attributes, if any, are set.
        if (attrs && !wait) {
            if (!this.set(attrs, options))
                return false;
        }
        else if (!this._validate(attrs, options)) {
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
            if (wait)
                serverAttrs = { ...attrs, ...serverAttrs };
            if (serverAttrs && !this.set(serverAttrs, options))
                return false;
            success?.call(options.context, this, resp, options);
            this.trigger('sync', this, resp, options);
        };
        wrapError(this, options);
        // Set temporary attributes if `{wait: true}` to properly find new ids.
        if (attrs && wait)
            this.attributes = { ...attributes, ...attrs };
        const method = this.isNew() ? 'create' : options.patch ? 'patch' : 'update';
        if (method === 'patch' && !options.attrs)
            options.attrs = attrs;
        const xhr = this.sync(method, this, options);
        // Restore attributes.
        this.attributes = attributes;
        return xhr;
    }
    /**
     * Destroy this model on the server if it was already persisted.
     */
    destroy(options) {
        options = { ...(options || {}) };
        const success = options.success;
        const wait = options.wait;
        const destroy = () => {
            this.stopListening();
            this.trigger('destroy', this, this.collection, options);
        };
        options.success = (resp) => {
            if (wait)
                destroy();
            success?.call(options.context, this, resp, options);
            if (!this.isNew())
                this.trigger('sync', this, resp, options);
        };
        let xhr = false;
        if (this.isNew()) {
            _.defer(options.success);
        }
        else {
            wrapError(this, options);
            xhr = this.sync('delete', this, options);
        }
        if (!wait)
            destroy();
        return xhr;
    }
    /**
     * Default URL for the model's representation on the server.
     */
    url() {
        const base = _.result(this, 'urlRoot') ||
            _.result(this.collection, 'url') ||
            urlError();
        if (this.isNew())
            return base;
        const id = this.get(this.idAttribute);
        return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
    }
    /**
     * **parse** converts a response into the hash of attributes to be `set` on
     * the model.
     */
    parse(resp, _options) {
        return resp;
    }
    /**
     * Create a new model with identical attributes to this one.
     */
    clone() {
        return new this.constructor(this.attributes);
    }
    /**
     * A model is new if it has never been saved to the server, and lacks an id.
     */
    isNew() {
        return !this.has(this.idAttribute);
    }
    /**
     * Check if the model is currently in a valid state.
     */
    isValid(options) {
        return this._validate({}, { ...options, validate: true });
    }
    /**
     * Run validation against the next complete set of model attributes.
     */
    _validate(attrs, options) {
        if (!options.validate || !this.validate)
            return true;
        attrs = { ...this.attributes, ...attrs };
        const error = this.validationError = this.validate(attrs, options) || null;
        if (!error)
            return true;
        this.trigger('invalid', this, error, { ...options, validationError: error });
        return false;
    }
    /**
     * preinitialize/initialize are empty by default. Override with your own logic.
     */
    preinitialize(..._args) { }
    initialize(..._args) { }
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
const setOptions = { add: true, remove: true, merge: true };
const addOptions = { add: true, remove: false };
// Splices `insert` into `array` at index `at`.
const splice = (array, insert, at) => {
    at = Math.min(Math.max(at, 0), array.length);
    const tail = Array(array.length - at);
    const length = insert.length;
    let i;
    for (i = 0; i < tail.length; i++)
        tail[i] = array[i + at];
    for (i = 0; i < length; i++)
        array[i + at] = insert[i];
    for (i = 0; i < tail.length; i++)
        array[i + length + at] = tail[i];
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
class Collection extends BackboneBase {
    constructor(models, options = {}) {
        super();
        // Create proxy before setup so all internal operations (reset, listenTo)
        // use a consistent 'this', and subclass class fields are intercepted.
        const self = this;
        const proxy = new Proxy(this, {
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
                        if (descriptor.value && self.models?.length)
                            self.sort({ silent: true });
                        // Also create an own data property so prototype method `comparator` definitions
                        // (which shadow the getter/setter) are properly overridden.
                        Reflect.defineProperty(target, prop, { value: descriptor.value, writable: true, configurable: true, enumerable: false });
                        return true;
                    }
                }
                return Reflect.defineProperty(target, prop, descriptor);
            }
        });
        proxy.preinitialize.apply(proxy, arguments);
        if (options.model)
            proxy.model = options.model;
        if (options.comparator !== void 0)
            proxy.comparator = options.comparator;
        proxy._reset();
        proxy.initialize.apply(proxy, arguments);
        if (models)
            proxy.reset(models, { silent: true, ...options });
        return proxy;
    }
    /**
     * The JSON representation of a Collection is an array of the
     * models' attributes.
     */
    toJSON(options) {
        return this.map((model) => model.toJSON(options));
    }
    /**
     * Proxy `Ostov.sync` by default.
     */
    sync(...args) {
        return Ostov.sync.apply(this, args);
    }
    /**
     * Add a model, or list of models to the set.
     */
    add(models, options) {
        return this.set(models, { ...{ merge: false }, ...options, ...addOptions });
    }
    /**
     * Remove a model, or a list of models from the set.
     */
    remove(models, options = {}) {
        options = { ...options };
        const singular = !Array.isArray(models);
        const list = (singular ? [models] : models.slice());
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
    set(models, options) {
        if (models == null)
            return;
        options = { ...setOptions, ...options };
        if (options.parse && !this._isModel(models)) {
            models = this.parse(models, options) || [];
        }
        const singular = !Array.isArray(models);
        models = singular ? [models] : models.slice();
        let at = options.at;
        if (at != null)
            at = +at;
        if (at > this.length)
            at = this.length;
        if (at < 0)
            at = at + this.length + 1;
        const set = [];
        const toAdd = [];
        const toMerge = [];
        const toRemove = [];
        const modelMap = {};
        const add = !!options.add;
        const merge = !!options.merge;
        const remove = !!options.remove;
        let sort = false;
        const sortable = this.comparator != null && at == null && options.sort !== false;
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
                    if (options.parse)
                        attrs = existing.parse(attrs, options);
                    existing.set(attrs, options);
                    toMerge.push(existing);
                    if (sortable && !sort)
                        sort = existing.hasChanged(sortAttr);
                }
                if (!modelMap[existing.cid]) {
                    modelMap[existing.cid] = true;
                    set.push(existing);
                }
                models[i] = existing;
                // If this is a new, valid model, push it to the `toAdd` list.
            }
            else if (add) {
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
                if (!modelMap[model.cid])
                    toRemove.push(model);
            }
            if (toRemove.length)
                this._removeModels(toRemove, options);
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
        }
        else if (toAdd.length) {
            if (sortable)
                sort = true;
            splice(this.models, toAdd, at == null ? this.length : at);
            this.length = this.models.length;
        }
        // Silently sort the collection if appropriate.
        if (sort)
            this.sort({ silent: true });
        // Unless silenced, it's time to fire all appropriate add/sort/update events.
        if (!options.silent) {
            for (i = 0; i < toAdd.length; i++) {
                if (at != null)
                    options.index = at + i;
                model = toAdd[i];
                model.trigger('add', model, this, options);
            }
            if (sort || orderChanged)
                this.trigger('sort', this, options);
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
    reset(models, options) {
        options = { ...(options || {}) };
        for (const model of this.models)
            this._removeReference(model, options);
        options.previousModels = this.models;
        this._reset();
        models = this.add(models, { silent: true, ...options });
        if (!options.silent)
            this.trigger('reset', this, options);
        return models;
    }
    /**
     * Add a model to the end of the collection.
     */
    push(model, options) {
        return this.add(model, { at: this.length, ...options });
    }
    /**
     * Remove a model from the end of the collection.
     */
    pop(options) {
        const model = this.at(this.length - 1);
        this.remove(model, options);
        return model;
    }
    /**
     * Add a model to the beginning of the collection.
     */
    unshift(model, options) {
        return this.add(model, { at: 0, ...options });
    }
    /**
     * Remove a model from the beginning of the collection.
     */
    shift(options) {
        const model = this.at(0);
        this.remove(model, options);
        return model;
    }
    /**
     * Slice out a sub-array of models from the collection.
     */
    slice(start, end) {
        return this.models.slice(start, end);
    }
    /**
     * Get a model from the set by id, cid, or model object.
     */
    get(obj) {
        if (obj == null)
            return void 0;
        return this._byId[obj] ||
            this._byId[this.modelId(this._isModel(obj) ? obj.attributes : obj, obj.idAttribute)] ||
            (obj.cid && this._byId[obj.cid]);
    }
    /**
     * Returns `true` if the model is in the collection.
     */
    has(obj) {
        return this.get(obj) != null;
    }
    /**
     * Get the model at the given index.
     */
    at(index) {
        if (index < 0)
            index += this.length;
        return this.models[index];
    }
    /**
     * Return models with matching attributes.
     */
    where(attrs, first) {
        return this[first ? 'find' : 'filter'](attrs);
    }
    /**
     * Return the first model with matching attributes.
     */
    findWhere(attrs) {
        return this.where(attrs, true);
    }
    /**
     * Force the collection to re-sort itself.
     */
    sort(options) {
        let comparator = this.comparator;
        if (!comparator)
            throw new Error('Cannot sort a set without a comparator');
        options = options || {};
        const length = comparator.length;
        if (typeof comparator === 'function')
            comparator = comparator.bind(this);
        // Run sort based on type of `comparator`.
        if (length === 1 || typeof comparator === 'string') {
            this.models = this.sortBy(comparator);
        }
        else {
            this.models.sort(comparator);
        }
        if (!options.silent)
            this.trigger('sort', this, options);
        return this;
    }
    /**
     * Pluck an attribute from each model in the collection.
     */
    pluck(attr) {
        return this.map(attr + '');
    }
    /**
     * Fetch the default set of models for this collection.
     */
    fetch(options) {
        options = { parse: true, ...options };
        const success = options.success;
        options.success = (resp) => {
            const method = options.reset ? 'reset' : 'set';
            this[method](resp, options);
            success?.call(options.context, this, resp, options);
            this.trigger('sync', this, resp, options);
        };
        wrapError(this, options);
        return this.sync('read', this, options);
    }
    /**
     * Create a new instance of a model in this collection.
     */
    create(model, options) {
        options = { ...(options || {}) };
        const wait = options.wait;
        const prepared = this._prepareModel(model, options);
        if (!prepared)
            return false;
        if (!wait)
            this.add(prepared, options);
        const success = options.success;
        options.success = (m, resp, callbackOpts) => {
            if (wait) {
                m.off('error', this._forwardPristineError, this);
                this.add(m, callbackOpts);
            }
            if (success)
                success.call(callbackOpts.context, m, resp, callbackOpts);
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
    parse(resp, _options) {
        return resp;
    }
    /**
     * Create a new collection with an identical list of models as this one.
     */
    clone() {
        return new this.constructor(this.models, {
            model: this.model,
            comparator: this.comparator
        });
    }
    /**
     * Define how to uniquely identify models in the collection.
     */
    modelId(attrs, idAttribute) {
        return attrs[idAttribute || this.model.prototype.idAttribute || 'id'];
    }
    /**
     * Get an iterator of all models in this collection.
     */
    values() {
        return new CollectionIterator(this, ITERATOR_VALUES);
    }
    /**
     * Get an iterator of all model IDs in this collection.
     */
    keys() {
        return new CollectionIterator(this, ITERATOR_KEYS);
    }
    /**
     * Get an iterator of all [ID, model] tuples in this collection.
     */
    entries() {
        return new CollectionIterator(this, ITERATOR_KEYSVALUES);
    }
    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset() {
        this.length = 0;
        this.models = [];
        this._byId = {};
    }
    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel(attrs, options) {
        if (this._isModel(attrs)) {
            if (!attrs.collection)
                attrs.collection = this;
            return attrs;
        }
        options = { ...(options || {}), collection: this };
        const model = new this.model(attrs, options);
        if (!model.validationError)
            return model;
        this.trigger('invalid', this, model.validationError, { ...options, validationError: model.validationError });
        return false;
    }
    // Internal method called by both remove and set.
    _removeModels(models, options) {
        const removed = [];
        for (let i = 0; i < models.length; i++) {
            const model = this.get(models[i]);
            if (!model)
                continue;
            const index = this.indexOf(model);
            this.models.splice(index, 1);
            this.length--;
            // Remove references before triggering 'remove' event to prevent an
            // infinite loop. #3693
            delete this._byId[model.cid];
            const id = this.modelId(model.attributes, model.idAttribute);
            if (id != null)
                delete this._byId[id];
            if (!options.silent) {
                options.index = index;
                model.trigger('remove', model, this, options);
            }
            removed.push(model);
            this._removeReference(model, options);
        }
        if (models.length > 0 && !options.silent)
            delete options.index;
        return removed;
    }
    // Method for checking whether an object should be considered a model for
    // the purposes of adding to the collection.
    _isModel(model) {
        return model instanceof Model;
    }
    // Internal method to create a model's ties to a collection.
    _addReference(model, _options) {
        this._byId[model.cid] = model;
        const id = this.modelId(model.attributes, model.idAttribute);
        if (id != null)
            this._byId[id] = model;
        model.on('all', this._onModelEvent, this);
    }
    // Internal method to sever a model's ties to a collection.
    _removeReference(model, _options) {
        delete this._byId[model.cid];
        const id = this.modelId(model.attributes, model.idAttribute);
        if (id != null)
            delete this._byId[id];
        if (this === model.collection)
            delete model.collection;
        model.off('all', this._onModelEvent, this);
    }
    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent(event, model, collection, options) {
        if (model) {
            if ((event === 'add' || event === 'remove') && collection !== this)
                return;
            if (event === 'destroy')
                this.remove(model, options);
            if (event === 'changeId') {
                const prevId = this.modelId(model.previousAttributes(), model.idAttribute);
                const id = this.modelId(model.attributes, model.idAttribute);
                if (prevId != null)
                    delete this._byId[prevId];
                if (id != null)
                    this._byId[id] = model;
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
        if (this.has(model))
            return;
        this._onModelEvent('error', model, collection, options);
    }
    // preinitialize/initialize are empty by default. Override with your own logic.
    preinitialize(..._args) { }
    initialize(..._args) { }
}
// Defining an @@iterator method implements JavaScript's Iterable protocol.
// In modern ES2015 browsers, this value is found at Symbol.iterator.
if (typeof Symbol === 'function' && Symbol.iterator) {
    Collection.prototype[Symbol.iterator] = Collection.prototype.values;
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
const ITERATOR_VALUES = 1;
const ITERATOR_KEYS = 2;
const ITERATOR_KEYSVALUES = 3;
/**
 * A CollectionIterator implements JavaScript's Iterator protocol, allowing the
 * use of `for of` loops.
 */
class CollectionIterator {
    constructor(collection, kind) {
        this._collection = collection;
        this._kind = kind;
        this._index = 0;
    }
    next() {
        if (this._collection) {
            // Only continue iterating if the iterated collection is long enough.
            if (this._index < this._collection.length) {
                const model = this._collection.at(this._index);
                this._index++;
                // Construct a value depending on what kind of values should be iterated.
                let value;
                if (this._kind === ITERATOR_VALUES) {
                    value = model;
                }
                else {
                    const id = this._collection.modelId(model.attributes, model.idAttribute);
                    if (this._kind === ITERATOR_KEYS) {
                        value = id;
                    }
                    else { // ITERATOR_KEYSVALUES
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
    [Symbol.iterator]() {
        return this;
    }
}
// Define model/comparator as prototype accessors on Collection.
// Using Object.defineProperty keeps them as plain properties in the generated
// .d.ts (via `declare` in the class body), so subclasses can override them
// as class fields without hitting TS2610.
Object.defineProperty(Collection.prototype, 'model', {
    configurable: true,
    get() { return this._model ?? Model; },
    set(value) {
        const prev = this._model;
        this._model = value;
        if (prev !== value && this.models?.length) {
            const attrs = this.models.map((m) => m.toJSON());
            this._reset();
            this.add(attrs, { silent: true });
        }
    }
});
Object.defineProperty(Collection.prototype, 'comparator', {
    configurable: true,
    get() { return this._comparator; },
    set(value) {
        this._comparator = value;
        if (value && this.models?.length)
            this.sort({ silent: true });
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
const delegateEventSplitter = /^(\S+)\s*(.*)$/;
// List of view options to be set as properties.
const viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
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
class View extends BackboneBase {
    constructor(options) {
        super();
        this._constructing = true;
        this.cid = _.uniqueId('view');
        // Create proxy before setup so preinitialize/initialize use a consistent
        // 'this', and subclass class fields (which use Object.defineProperty in
        // modern JS/TS) are intercepted for `el` and `events`.
        const self = this;
        const proxy = new Proxy(this, {
            defineProperty(target, prop, descriptor) {
                if ('value' in descriptor) {
                    if (prop === 'el' && typeof descriptor.value === 'string') {
                        self._el = descriptor.value;
                        self.setElement(descriptor.value);
                        return true;
                    }
                    if (prop === 'events') {
                        self._viewEvents = descriptor.value;
                        if (self._el instanceof Element)
                            self.delegateEvents();
                        return true;
                    }
                }
                return Reflect.defineProperty(target, prop, descriptor);
            }
        });
        proxy.preinitialize.apply(proxy, arguments);
        _.extend(proxy, _.pick(options || {}, viewOptions));
        proxy._ensureElement();
        proxy.initialize.apply(proxy, arguments);
        this._constructing = false;
        return proxy;
    }
    /**
     * Scoped element lookup inside the view's root element.
     */
    $(selector) {
        const nodes = this.el.querySelectorAll(selector);
        return Ostov.$ ? Ostov.$(Array.from(nodes)) : nodes;
    }
    /**
     * **render** is the core function that your view should override.
     */
    render() {
        return this;
    }
    /**
     * Remove this view by taking the element out of the DOM, and removing any
     * applicable Ostov.Events listeners.
     */
    remove() {
        this.undelegateEvents();
        this._removeElement();
        this.stopListening();
        return this;
    }
    /**
     * Remove this view's element from the document.
     */
    _removeElement() {
        _.dom.remove(this.el);
    }
    /**
     * Change the view's element and re-delegate the view's events.
     */
    setElement(element) {
        this.undelegateEvents();
        this._setElement(element);
        this.delegateEvents();
        return this;
    }
    /**
     * Creates the `this.el` and `this.$el` references for this view.
     */
    _setElement(el) {
        const resolved = _.dom.query(el);
        // For string selectors that don't match anything, keep el as null/falsy.
        // For non-string values (DOM elements, jQuery-like wrappers), fall back.
        this.el = resolved !== null ? resolved : typeof el !== 'string' ? el : null;
        this.$el = Ostov.$ ? Ostov.$(this.el) : this.el;
    }
    /**
     * Set callbacks, where `this.events` is a hash of *{"event selector": "callback"}* pairs.
     */
    delegateEvents(events) {
        events || (events = _.result(this, 'events'));
        if (!events)
            return this;
        this.undelegateEvents();
        for (const key in events) {
            let method = events[key];
            if (typeof method !== 'function')
                method = this[method];
            if (!method)
                continue;
            const match = key.match(delegateEventSplitter);
            this.delegate(match[1], match[2], method.bind(this));
        }
        return this;
    }
    /**
     * Add a single event listener to the view's element.
     */
    delegate(eventName, selector, listener) {
        if (typeof selector !== 'string') {
            listener = selector;
            selector = undefined;
        }
        _.dom.on(this.el, '.delegateEvents' + this.cid, eventName, selector || null, listener);
        return this;
    }
    /**
     * Clears all callbacks previously bound to the view by `delegateEvents`.
     */
    undelegateEvents() {
        if (this._el && (this._el instanceof Element))
            _.dom.off(this._el, '.delegateEvents' + this.cid);
        return this;
    }
    /**
     * A finer-grained `undelegateEvents` for removing a single delegated event.
     */
    undelegate(eventName, selector, listener) {
        if (typeof selector !== 'string') {
            listener = selector;
            selector = undefined;
        }
        _.dom.off(this.el, '.delegateEvents' + this.cid, eventName, selector || null, listener);
        return this;
    }
    /**
     * Produces a DOM element to be assigned to your view.
     */
    _createElement(tagName) {
        return document.createElement(tagName);
    }
    /**
     * Ensure that the View has a DOM element to render into.
     */
    _ensureElement() {
        if (!this.el) {
            const attrs = { ..._.result(this, 'attributes') };
            if (this.id)
                attrs.id = _.result(this, 'id');
            if (this.className)
                attrs['class'] = _.result(this, 'className');
            this.setElement(this._createElement(_.result(this, 'tagName')));
            this._setAttributes(attrs);
        }
        else {
            this.setElement(_.result(this, 'el'));
        }
    }
    /**
     * Set attributes from a hash on this view's element.
     */
    _setAttributes(attributes) {
        _.dom.setAttributes(this.el, attributes);
    }
    /**
     * preinitialize/initialize are empty by default. Override with your own logic.
     */
    preinitialize(..._args) { }
    initialize(..._args) { }
}
// Define el/events as prototype accessors on View.
// Using Object.defineProperty keeps them as plain properties in the generated
// .d.ts (via `declare` in the class body), so subclasses can override them
// as class fields without hitting TS2610.
Object.defineProperty(View.prototype, 'el', {
    configurable: true,
    get() { return this._el; },
    set(value) {
        this._el = value ?? undefined;
        // Class field case: el set to a string after constructor finished on a real
        // instance (cid is set). Prototype assignments like View.prototype.el = '...'
        // also call this setter (because they inherit it) — the cid guard prevents
        // treating those as class-field assignments.
        if (!this._constructing && this.cid && typeof value === 'string') {
            this.setElement(value);
        }
    }
});
Object.defineProperty(View.prototype, 'events', {
    configurable: true,
    get() { return this._viewEvents; },
    set(value) {
        this._viewEvents = value;
        // Class field case: events set after constructor finished and el is already
        // a resolved Element → re-delegate so the new events map takes effect.
        if (!this._constructing && this._el instanceof Element) {
            this.delegateEvents();
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
const addMethod = (base, length, method, attribute) => {
    switch (length) {
        case 1: return function () {
            return base[method](this[attribute]);
        };
        case 2: return function (value) {
            return base[method](this[attribute], value);
        };
        case 3: return function (iteratee, context) {
            return base[method](this[attribute], cb(iteratee, this), context);
        };
        case 4: return function (iteratee, defaultVal, context) {
            return base[method](this[attribute], cb(iteratee, this), defaultVal, context);
        };
        default: return function () {
            return base[method](this[attribute], ...arguments);
        };
    }
};
// Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
const cb = (iteratee, instance) => {
    if (typeof iteratee === 'function')
        return iteratee;
    if (_.isObject(iteratee) && !instance._isModel(iteratee))
        return modelMatcher(iteratee);
    if (typeof iteratee === 'string')
        return (model) => model.get(iteratee);
    return iteratee;
};
const modelMatcher = (attrs) => {
    const matcher = _.matches(attrs);
    return (model) => matcher(model.attributes);
};
// Underscore methods that we want to implement on the Collection.
// 90% of the core usefulness of Ostov Collections is actually implemented
// right here:
const collectionMethods = {
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
const modelMethods = {
    keys: 1, values: 1, pairs: 1, invert: 1, pick: 0,
    omit: 0, chain: 1, isEmpty: 1
};
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
            if (obj[method])
                Base.prototype[method] = addMethod(obj, length, method, attribute);
        });
    };
    _.each(methods, (length, method) => {
        if (_[method])
            Base.prototype[method] = addMethod(_, length, method, attribute);
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
const methodMap = {
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
const optionalParam = /\((.*?)\)/g;
const namedParam = /(\(\?)?:\w+/g;
const splatParam = /\*\w+/g;
const escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
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
    constructor(options = {}) {
        super();
        this.preinitialize.apply(this, arguments);
        if (options.routes)
            this.routes = options.routes;
        this._bindRoutes();
        this.initialize.apply(this, arguments);
    }
    /**
     * Manually bind a single named route to a callback.
     * @see http://ostovjs.org/#Router-route
     */
    route(route, name, callback) {
        if (!(route instanceof RegExp))
            route = this._routeToRegExp(route);
        if (typeof name === 'function') {
            callback = name;
            name = '';
        }
        if (!callback)
            callback = this[name];
        const router = this;
        Ostov.history.route(route, (fragment) => {
            const args = router._extractParameters(route, fragment);
            if (router.execute(callback, args, name) !== false) {
                router.trigger(`route:${name}`, ...args);
                router.trigger('route', name, args);
                Ostov.history.trigger('route', router, name, args);
            }
        });
        return this;
    }
    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute(callback, args, _name) {
        if (callback)
            callback.apply(this, args);
    }
    // Simple proxy to `Ostov.history` to save a fragment into the history.
    navigate(fragment, options) {
        Ostov.history.navigate(fragment, options);
        return this;
    }
    // Bind all defined routes to `Ostov.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes() {
        if (!this.routes)
            return;
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
            if (i === params.length - 1)
                return param || null;
            return param ? decodeURIComponent(param) : null;
        });
    }
    // preinitialize/initialize are empty by default. Override with your own logic.
    preinitialize(..._args) { }
    initialize(..._args) { }
}
// Ostov.History
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
/**
 * Ostov.History handles cross-browser history management, based on either
 * pushState and real URLs, or onhashchange and URL fragments.
 * @see http://ostovjs.org/#History
 */
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
        const path = this.decodeFragment(this.location.pathname + this.getSearch()).slice(this.root.length - 1);
        return path.charAt(0) === '/' ? path.slice(1) : path;
    }
    // Get the cross-browser normalized URL fragment from the path or hash.
    getFragment(fragment) {
        if (fragment == null) {
            if (this._usePushState || !this._wantsHashChange) {
                fragment = this.getPath();
            }
            else {
                fragment = this.getHash();
            }
        }
        return fragment.replace(routeStripper, '');
    }
    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start(options) {
        if (History.started)
            throw new Error('Ostov.history has already been started');
        History.started = true;
        // Figure out the initial configuration. Do we need an iframe?
        // Is pushState desired ... is it available?
        this.options = { root: '/', ...this.options, ...options };
        this.root = this.options.root;
        this._trailingSlash = this.options.trailingSlash;
        this._wantsHashChange = this.options.hashChange !== false;
        this._hasHashChange = 'onhashchange' in window && (document.documentMode === void 0 || document.documentMode > 7);
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
            }
            else if (this._hasPushState && this.atRoot()) {
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
            const iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
            iWindow.document.open();
            iWindow.document.close();
            iWindow.location.hash = '#' + this.fragment;
        }
        // Add a cross-platform `addEventListener` shim for older browsers.
        const addEventListener = window.addEventListener || function (eventName, listener) {
            return window.attachEvent('on' + eventName, listener);
        };
        // Depending on whether we're using pushState or hashes, and whether
        // 'onhashchange' is supported, determine how we check the URL state.
        if (this._usePushState) {
            addEventListener('popstate', this.checkUrl, false);
        }
        else if (this._useHashChange && !this.iframe) {
            addEventListener('hashchange', this.checkUrl, false);
        }
        else if (this._wantsHashChange) {
            this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
        }
        if (!this.options.silent)
            return this.loadUrl();
    }
    // Disable Ostov.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop() {
        // Add a cross-platform `removeEventListener` shim for older browsers.
        const removeEventListener = window.removeEventListener || function (eventName, listener) {
            return window.detachEvent('on' + eventName, listener);
        };
        // Remove window listeners.
        if (this._usePushState) {
            removeEventListener('popstate', this.checkUrl, false);
        }
        else if (this._useHashChange && !this.iframe) {
            removeEventListener('hashchange', this.checkUrl, false);
        }
        // Clean up the iframe if necessary.
        if (this.iframe) {
            document.body.removeChild(this.iframe);
            this.iframe = null;
        }
        // Some environments will throw when clearing an undefined interval.
        if (this._checkUrlInterval)
            clearInterval(this._checkUrlInterval);
        History.started = false;
    }
    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route(route, callback) {
        this.handlers.unshift({ route: route, callback: callback });
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
            if (!this.matchRoot())
                return this.notfound();
            return false;
        }
        if (this.iframe)
            this.navigate(current);
        this.loadUrl();
    }
    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl(fragment) {
        // If the root doesn't match, no routes can match either.
        if (!this.matchRoot())
            return this.notfound();
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
        if (!History.started)
            return false;
        if (!options || options === true)
            options = { trigger: !!options };
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
        if (this.fragment === decodedFragment)
            return;
        this.fragment = decodedFragment;
        // If pushState is available, we use it to set the fragment as a real URL.
        if (this._usePushState) {
            this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);
            // If hash changes haven't been explicitly disabled, update the hash
            // fragment to store history.
        }
        else if (this._wantsHashChange) {
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
        }
        else {
            return this.location.assign(url);
        }
        if (options.trigger)
            return this.loadUrl(fragment);
    }
    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash(location, fragment, replace) {
        if (replace) {
            const href = location.href.replace(/(javascript:|#).*$/, '');
            location.replace(href + '#' + fragment);
        }
        else {
            // Some browsers require that `hash` contains a leading #.
            location.hash = '#' + fragment;
        }
    }
}
History.started = false;
// The default interval to poll for hash changes, if necessary, is
// twenty times a second.
History.prototype.interval = 50;
// Throw an error when a URL is needed, and none is supplied.
const urlError = () => {
    throw new Error('A "url" property or function must be specified');
};
// Wrap an optional error callback with a fallback error event.
const wrapError = (model, options) => {
    const error = options.error;
    options.error = function (resp) {
        if (error)
            error.call(options.context, model, resp, options);
        model.trigger('error', model, resp, options);
    };
};
const Ostov = {};
// Current version of the library. Keep in sync with `package.json`.
Ostov.VERSION = '1.7.7';
// Ostov.$ can be set to jQuery (or a compatible library) by the user if
// they want jQuery-powered DOM helpers. Ostov itself no longer requires it.
Ostov.$ = null;
// Runs Ostov.js in *noConflict* mode, returning the `Ostov` variable
// to its previous owner. Returns a reference to this Ostov object.
Ostov.noConflict = function () {
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
Ostov.sync = (method, model, options) => {
    const type = methodMap[method];
    // Default options, unless specified.
    // Must mutate (not replace) `options` so that `options.xhr` set below
    // is visible to callbacks that closed over the same object in sync callers.
    if (!options)
        options = {};
    _.defaults(options, { emulateHTTP: Ostov.emulateHTTP, emulateJSON: Ostov.emulateJSON });
    // Default JSON-request options.
    const params = { type: type, dataType: 'json', url: '' };
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
        if (options.emulateJSON)
            params.data._method = type;
        const beforeSend = options.beforeSend;
        options.beforeSend = function (xhr) {
            xhr.setRequestHeader('X-HTTP-Method-Override', type);
            if (beforeSend)
                return beforeSend.apply(this, arguments);
        };
    }
    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
        params.processData = false;
    }
    // Pass along `textStatus` and `errorThrown` from jQuery.
    const error = options.error;
    options.error = function (xhr, textStatus, errorThrown) {
        options.textStatus = textStatus;
        options.errorThrown = errorThrown;
        error?.call(options.context, xhr, textStatus, errorThrown);
    };
    // Make the request, allowing the user to override any Ajax options.
    const xhr = options.xhr = Ostov.ajax(Object.assign(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
};
// Default implementation of `Ostov.ajax` using the native Fetch API.
// Override this function if you need custom request handling.
// The options object follows the jQuery.ajax convention used by Ostov.sync:
//   type, url, data, contentType, dataType, beforeSend, success, error, context.
Ostov.ajax = (options) => {
    const method = (options.type || 'GET').toUpperCase();
    const url = options.url;
    const headers = {};
    if (options.contentType)
        headers['Content-Type'] = options.contentType;
    let body;
    if (options.data != null && method !== 'GET') {
        if (options.emulateJSON && typeof options.data === 'object') {
            // Encode as application/x-www-form-urlencoded.
            const data = options.data;
            body = Object.keys(data).map((k) => {
                return `${encodeURIComponent(k)}=${encodeURIComponent(String(data[k]))}`;
            }).join('&');
        }
        else {
            body = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
        }
    }
    const fetchOptions = { method, headers };
    if (body !== void 0)
        fetchOptions.body = body;
    // Allow beforeSend to set additional request headers.
    if (options.beforeSend) {
        const mockXhr = {
            setRequestHeader: (name, value) => { headers[name] = value; }
        };
        options.beforeSend(mockXhr);
    }
    // Provide a minimal xhr-like object (supports abort via AbortController).
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (controller)
        fetchOptions.signal = controller.signal;
    const xhr = {
        abort: () => controller?.abort()
    };
    fetch(url, fetchOptions).then((response) => {
        if (!response.ok) {
            const err = Object.assign(new Error(`HTTP error ${response.status}`), { status: response.status });
            options.error?.call(options.context, xhr, response.status, err);
            return;
        }
        const parse = options.dataType === 'json' ||
            (response.headers.get('content-type') || '').indexOf('json') >= 0
            ? response.json()
            : response.text();
        return parse.then((data) => {
            options.success?.call(options.context, data, response.status, xhr);
        });
    }).catch((err) => {
        if (err && err.name === 'AbortError')
            return;
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
Ostov._debug = () => {
    return { root: root, _: _ };
};
// Set on globalThis for noConflict support
root.Ostov = Ostov;

export { Collection, Events, History, Model, Router, View, _, Ostov as default };
//# sourceMappingURL=ostov.js.map
