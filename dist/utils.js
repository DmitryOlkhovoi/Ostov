//     Backbone utils.ts
//     Replaces underscore.js and jQuery for Backbone.js.
//     Contains only the functions actually used by Backbone.
'use strict';
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
        obj = Object(obj);
        for (let i = 0; i < pairs.length; i++) {
            if (pairs[i][1] !== obj[pairs[i][0]] || !(pairs[i][0] in obj))
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
        const aC = a.constructor, bC = b.constructor;
        if (aC !== bC &&
            !(typeof aC === 'function' && aC instanceof aC &&
                typeof bC === 'function' && bC instanceof bC) &&
            ('constructor' in a && 'constructor' in b))
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
        len = a.length;
        if (len !== b.length) {
            aStack.pop();
            bStack.pop();
            return false;
        }
        while (len--) {
            if (!deepEqual(a[len], b[len], aStack, bStack)) {
                aStack.pop();
                bStack.pop();
                return false;
            }
        }
    }
    else {
        const keys = Object.keys(a);
        let key;
        len = keys.length;
        if (Object.keys(b).length !== len) {
            aStack.pop();
            bStack.pop();
            return false;
        }
        while (len--) {
            key = keys[len];
            if (!Object.prototype.hasOwnProperty.call(b, key) ||
                !deepEqual(a[key], b[key], aStack, bStack)) {
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
        result[obj[keys[i]]] = keys[i];
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
    return _.isArray(obj) ? obj.slice() : Object.assign({}, obj);
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
        fn = null;
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
export default _;
//# sourceMappingURL=utils.js.map