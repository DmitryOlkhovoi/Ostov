import { describe, it, expect, beforeEach, afterEach } from 'vitest';

var router = null;
var location = null;
var lastRoute = null;
var lastArgs = [];

var onRoute = function(routerParam, route, args) {
  lastRoute = route;
  lastArgs = args;
};

var Location = function(href) {
  this.replace(href);
};

_.extend(Location.prototype, {

  parser: document.createElement('a'),

  replace: function(href) {
    this.parser.href = href;
    _.extend(this, _.pick(this.parser,
      'href',
      'hash',
      'host',
      'search',
      'fragment',
      'pathname',
      'protocol'
    ));

    // In IE, anchor.pathname does not contain a leading slash though
    // window.location.pathname does.
    if (!/^\//.test(this.pathname)) this.pathname = '/' + this.pathname;
  },

  toString: function() {
    return this.href;
  }

});

describe('Ostov.Router', function() {

  beforeEach(function() {
    location = new Location('http://example.com');
    Ostov.history = _.extend(new Ostov.History, {location: location});
    router = new Router({testing: 101});
    Ostov.history.interval = 9;
    Ostov.history.start({pushState: false});
    lastRoute = null;
    lastArgs = [];
    Ostov.history.on('route', onRoute);
  });

  afterEach(function() {
    Ostov.history.stop();
    Ostov.history.off('route', onRoute);
  });

  var ExternalObject = {
    value: 'unset',

    routingFunction: function(value) {
      this.value = value;
    }
  };
  ExternalObject.routingFunction = _.bind(ExternalObject.routingFunction, ExternalObject);

  class Router extends Ostov.Router {

    preinitialize(options) {
      this.testpreinit = 'foo';
    }

    initialize(options) {
      this.testing = options.testing;
      this.route('implicit', 'implicit');
    }

    counter() {
      this.count++;
    }

    implicit() {
      this.count++;
    }

    search(query, page) {
      this.query = query;
      this.page = page;
    }

    charUTF() {
      this.charType = 'UTF';
    }

    charEscaped() {
      this.charType = 'escaped';
    }

    contacts() {
      this.contact = 'index';
    }

    newContact() {
      this.contact = 'new';
    }

    loadContact() {
      this.contact = 'load';
    }

    optionalItem(arg) {
      this.arg = arg !== void 0 ? arg : null;
    }

    splat(args) {
      this.args = args;
    }

    github(repo, from, to) {
      this.repo = repo;
      this.from = from;
      this.to = to;
    }

    complex(first, part, rest) {
      this.first = first;
      this.part = part;
      this.rest = rest;
    }

    query(entity, args) {
      this.entity    = entity;
      this.queryArgs = args;
    }

    anything(whatever) {
      this.anything = whatever;
    }

    namedOptional(z) {
      this.z = z;
    }

    decode(named, path) {
      this.named = named;
      this.path = path;
    }

    routeEvent(arg) {
    }

  }
  Router.prototype.count = 0;
  Router.prototype.routes = {
    'noCallback': 'noCallback',
    'counter': 'counter',
    'search/:query': 'search',
    'search/:query/p:page': 'search',
    'charñ': 'charUTF',
    'char%C3%B1': 'charEscaped',
    'contacts': 'contacts',
    'contacts/new': 'newContact',
    'contacts/:id': 'loadContact',
    'route-event/:arg': 'routeEvent',
    'optional(/:item)': 'optionalItem',
    'named/optional/(y:z)': 'namedOptional',
    'splat/*args/end': 'splat',
    ':repo/compare/*from...*to': 'github',
    'decode/:named/*splat': 'decode',
    '*first/complex-*part/*rest': 'complex',
    'query/:entity': 'query',
    'function/:value': ExternalObject.routingFunction,
    '*anything': 'anything'
  };

  it('initialize', function() {
    expect(router.testing).toBe(101);
  });

  it('preinitialize', function() {
    expect(router.testpreinit).toBe('foo');
  });

  it('routes (simple)', function() {
    location.replace('http://example.com#search/news');
    Ostov.history.checkUrl();
    expect(router.query).toBe('news');
    expect(router.page).toBeNull();
    expect(lastRoute).toBe('search');
    expect(lastArgs[0]).toBe('news');
  });

  it('routes (simple, but unicode)', function() {
    location.replace('http://example.com#search/тест');
    Ostov.history.checkUrl();
    expect(router.query).toBe('тест');
    expect(router.page).toBeNull();
    expect(lastRoute).toBe('search');
    expect(lastArgs[0]).toBe('тест');
  });

  it('routes (two part)', function() {
    location.replace('http://example.com#search/nyc/p10');
    Ostov.history.checkUrl();
    expect(router.query).toBe('nyc');
    expect(router.page).toBe('10');
  });

  it('routes via navigate', function() {
    Ostov.history.navigate('search/manhattan/p20', {trigger: true});
    expect(router.query).toBe('manhattan');
    expect(router.page).toBe('20');
  });

  it('routes via navigate with params', function() {
    Ostov.history.navigate('query/test?a=b', {trigger: true});
    expect(router.queryArgs).toBe('a=b');
  });

  it('routes via navigate for backwards-compatibility', function() {
    Ostov.history.navigate('search/manhattan/p20', true);
    expect(router.query).toBe('manhattan');
    expect(router.page).toBe('20');
  });

  it('reports matched route via nagivate', function() {
    expect(Ostov.history.navigate('search/manhattan/p20', true)).toBeTruthy();
  });

  it('route precedence via navigate', function() {
    // Check both 0.9.x and backwards-compatibility options
    _.each([{trigger: true}, true], function(options) {
      Ostov.history.navigate('contacts', options);
      expect(router.contact).toBe('index');
      Ostov.history.navigate('contacts/new', options);
      expect(router.contact).toBe('new');
      Ostov.history.navigate('contacts/foo', options);
      expect(router.contact).toBe('load');
    });
  });

  it('loadUrl is not called for identical routes.', function() {
    Ostov.history.loadUrl = function() { expect(false).toBeTruthy(); };
    location.replace('http://example.com#route');
    Ostov.history.navigate('route');
    Ostov.history.navigate('/route');
    Ostov.history.navigate('/route');
  });

  it('use implicit callback if none provided', function() {
    router.count = 0;
    router.navigate('implicit', {trigger: true});
    expect(router.count).toBe(1);
  });

  it('routes via navigate with {replace: true}', function() {
    location.replace('http://example.com#start_here');
    Ostov.history.checkUrl();
    location.replace = function(href) {
      expect(href).toBe(new Location('http://example.com#end_here').href);
    };
    Ostov.history.navigate('end_here', {replace: true});
  });

  it('routes (splats)', function() {
    location.replace('http://example.com#splat/long-list/of/splatted_99args/end');
    Ostov.history.checkUrl();
    expect(router.args).toBe('long-list/of/splatted_99args');
  });

  it('routes (github)', function() {
    location.replace('http://example.com#ostov/compare/1.0...braddunbar:with/slash');
    Ostov.history.checkUrl();
    expect(router.repo).toBe('ostov');
    expect(router.from).toBe('1.0');
    expect(router.to).toBe('braddunbar:with/slash');
  });

  it('routes (optional)', function() {
    location.replace('http://example.com#optional');
    Ostov.history.checkUrl();
    expect(!router.arg).toBeTruthy();
    location.replace('http://example.com#optional/thing');
    Ostov.history.checkUrl();
    expect(router.arg).toBe('thing');
  });

  it('routes (complex)', function() {
    location.replace('http://example.com#one/two/three/complex-part/four/five/six/seven');
    Ostov.history.checkUrl();
    expect(router.first).toBe('one/two/three');
    expect(router.part).toBe('part');
    expect(router.rest).toBe('four/five/six/seven');
  });

  it('routes (query)', function() {
    location.replace('http://example.com#query/mandel?a=b&c=d');
    Ostov.history.checkUrl();
    expect(router.entity).toBe('mandel');
    expect(router.queryArgs).toBe('a=b&c=d');
    expect(lastRoute).toBe('query');
    expect(lastArgs[0]).toBe('mandel');
    expect(lastArgs[1]).toBe('a=b&c=d');
  });

  it('routes (anything)', function() {
    location.replace('http://example.com#doesnt-match-a-route');
    Ostov.history.checkUrl();
    expect(router.anything).toBe('doesnt-match-a-route');
  });

  it('routes (function)', function() {
    router.on('route', function(name) {
      expect(name === '').toBeTruthy();
    });
    expect(ExternalObject.value).toBe('unset');
    location.replace('http://example.com#function/set');
    Ostov.history.checkUrl();
    expect(ExternalObject.value).toBe('set');
  });

  it('Decode named parameters, not splats.', function() {
    location.replace('http://example.com#decode/a%2Fb/c%2Fd/e');
    Ostov.history.checkUrl();
    expect(router.named).toBe('a/b');
    expect(router.path).toBe('c/d/e');
  });

  it('fires event when router doesn\'t have callback on it', function() {
    router.on('route:noCallback', function() { expect(true).toBeTruthy(); });
    location.replace('http://example.com#noCallback');
    Ostov.history.checkUrl();
  });

  it('No events are triggered if #execute returns false.', function() {
    class MyRouter extends Ostov.Router {
      execute(callback, args) {
        callback.apply(this, args);
        return false;
      }
    }
    MyRouter.prototype.routes = {
      foo: function() {
        expect(true).toBeTruthy();
      }
    };

    var myRouter = new MyRouter;

    myRouter.on('route route:foo', function() {
      expect(false).toBeTruthy();
    });

    Ostov.history.on('route', function() {
      expect(false).toBeTruthy();
    });

    location.replace('http://example.com#foo');
    Ostov.history.checkUrl();
  });

  it('#933, #908 - leading slash', function() {
    location.replace('http://example.com/root/foo');

    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.start({root: '/root', hashChange: false, silent: true});
    expect(Ostov.history.getFragment()).toBe('foo');

    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.start({root: '/root/', hashChange: false, silent: true});
    expect(Ostov.history.getFragment()).toBe('foo');
  });

  it('#967 - Route callback gets passed encoded values.', function() {
    var route = 'has%2Fslash/complex-has%23hash/has%20space';
    Ostov.history.navigate(route, {trigger: true});
    expect(router.first).toBe('has/slash');
    expect(router.part).toBe('has#hash');
    expect(router.rest).toBe('has space');
  });

  it('correctly handles URLs with % (#868)', function() {
    location.replace('http://example.com#search/fat%3A1.5%25');
    Ostov.history.checkUrl();
    location.replace('http://example.com#search/fat');
    Ostov.history.checkUrl();
    expect(router.query).toBe('fat');
    expect(router.page).toBeNull();
    expect(lastRoute).toBe('search');
  });

  it('#2666 - Hashes with UTF8 in them.', function() {
    Ostov.history.navigate('charñ', {trigger: true});
    expect(router.charType).toBe('UTF');
    Ostov.history.navigate('char%C3%B1', {trigger: true});
    expect(router.charType).toBe('UTF');
  });

  it('#1185 - Use pathname when hashChange is not wanted.', function() {
    Ostov.history.stop();
    location.replace('http://example.com/path/name#hash');
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.start({hashChange: false});
    var fragment = Ostov.history.getFragment();
    expect(fragment).toBe(location.pathname.replace(/^\//, ''));
  });

  it('#1206 - Strip leading slash before location.assign.', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root/');
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.start({hashChange: false, root: '/root/'});
    location.assign = function(pathname) {
      expect(pathname).toBe('/root/fragment');
    };
    Ostov.history.navigate('/fragment');
  });

  it('#1387 - Root fragment without trailing slash.', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root');
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.start({hashChange: false, root: '/root/', silent: true});
    expect(Ostov.history.getFragment()).toBe('');
  });

  it('#1366 - History does not prepend root to fragment.', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root/');
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function(state, title, url) {
          expect(url).toBe('/root/x');
        }
      }
    });
    Ostov.history.start({
      root: '/root/',
      pushState: true,
      hashChange: false
    });
    Ostov.history.navigate('x');
    expect(Ostov.history.fragment).toBe('x');
  });

  it('Normalize root.', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root');
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function(state, title, url) {
          expect(url).toBe('/root/fragment');
        }
      }
    });
    Ostov.history.start({
      pushState: true,
      root: '/root',
      hashChange: false
    });
    Ostov.history.navigate('fragment');
  });

  it('Normalize root. (replaceState)', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root#fragment');
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function(state, title, url) {},
        replaceState: function(state, title, url) {
          expect(url).toBe('/root/fragment');
        }
      }
    });
    Ostov.history.start({
      pushState: true,
      root: '/root'
    });
  });

  it('Normalize root. (loadUrl)', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root');
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.loadUrl = function() { expect(true).toBeTruthy(); };
    Ostov.history.start({
      pushState: true,
      root: '/root'
    });
  });

  it('Normalize root - leading slash.', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root');
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function() {},
        replaceState: function() {}
      }
    });
    Ostov.history.start({root: 'root'});
    expect(Ostov.history.root).toBe('/root/');
  });

  it('Transition from hashChange to pushState.', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root#x/y');
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function() {},
        replaceState: function(state, title, url) {
          expect(url).toBe('/root/x/y');
        }
      }
    });
    Ostov.history.start({
      root: 'root',
      pushState: true
    });
  });

  it('#1619: Router: Normalize empty root', function() {
    Ostov.history.stop();
    location.replace('http://example.com/');
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function() {},
        replaceState: function() {}
      }
    });
    Ostov.history.start({root: ''});
    expect(Ostov.history.root).toBe('/');
  });

  it('#1619: Router: nagivate with empty root', function() {
    Ostov.history.stop();
    location.replace('http://example.com/');
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function(state, title, url) {
          expect(url).toBe('/fragment');
        }
      }
    });
    Ostov.history.start({
      pushState: true,
      root: '',
      hashChange: false
    });
    Ostov.history.navigate('fragment');
  });

  it('Transition from pushState to hashChange.', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root/x/y?a=b');
    location.replace = function(url) {
      expect(url).toBe('/root#x/y?a=b');
    };
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: null,
        replaceState: null
      }
    });
    Ostov.history.start({
      root: 'root',
      pushState: true
    });
  });

  it('#1695 - hashChange to pushState with search.', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root#x/y?a=b');
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function() {},
        replaceState: function(state, title, url) {
          expect(url).toBe('/root/x/y?a=b');
        }
      }
    });
    Ostov.history.start({
      root: 'root',
      pushState: true
    });
  });

  it('#1746 - Router allows empty route.', function() {
    class MyRouter extends Ostov.Router {
      empty() {}
      route(route) {
        expect(route).toBe('');
      }
    }
    MyRouter.prototype.routes = {'': 'empty'};
    new MyRouter;
  });

  it('#1794 - Trailing space in fragments.', function() {
    var history = new Ostov.History;
    expect(history.getFragment('fragment   ')).toBe('fragment');
  });

  it('#1820 - Leading slash and trailing space.', function() {
    var history = new Ostov.History;
    expect(history.getFragment('/fragment ')).toBe('fragment');
  });

  it('#1980 - Optional parameters.', function() {
    location.replace('http://example.com#named/optional/y');
    Ostov.history.checkUrl();
    expect(router.z).toBe(undefined);
    location.replace('http://example.com#named/optional/y123');
    Ostov.history.checkUrl();
    expect(router.z).toBe('123');
  });

  it('#2062 - Trigger "route" event on router instance.', function() {
    router.on('route', function(name, args) {
      expect(name).toBe('routeEvent');
      expect(args).toEqual(['x', null]);
    });
    location.replace('http://example.com#route-event/x');
    Ostov.history.checkUrl();
  });

  it('#2255 - Extend routes by making routes a function.', function() {
    class RouterBase extends Ostov.Router {
    }
    RouterBase.prototype.routes = function() {
      return {
        home: 'root',
        index: 'index.html'
      };
    };

    class RouterExtended extends RouterBase {
    }
    RouterExtended.prototype.routes = function() {
      var _super = RouterBase.prototype.routes;
      return _.extend(_super(), {show: 'show', search: 'search'});
    };

    var myRouter = new RouterExtended();
    expect({home: 'root', index: 'index.html', show: 'show', search: 'search'}).toEqual(myRouter.routes);
  });

  it('#2538 - hashChange to pushState only if both requested.', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root?a=b#x/y');
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function() {},
        replaceState: function() { expect(false).toBeTruthy(); }
      }
    });
    Ostov.history.start({
      root: 'root',
      pushState: true,
      hashChange: false
    });
  });

  it('No hash fallback.', function() {
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function() {},
        replaceState: function() {}
      }
    });

    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {
      hash: function() { expect(false).toBeTruthy(); }
    };
    var myRouter = new MyRouter;

    location.replace('http://example.com/');
    Ostov.history.start({
      pushState: true,
      hashChange: false
    });
    location.replace('http://example.com/nomatch#hash');
    Ostov.history.checkUrl();
  });

  it('#2656 - No trailing slash on root.', function() {
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function(state, title, url) {
          expect(url).toBe('/root');
        }
      }
    });
    location.replace('http://example.com/root/path');
    Ostov.history.start({pushState: true, hashChange: false, root: 'root'});
    Ostov.history.navigate('');
  });

  it('#2656 - No trailing slash on root. (no root)', function() {
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function(state, title, url) {
          expect(url).toBe('/');
        }
      }
    });
    location.replace('http://example.com/path');
    Ostov.history.start({pushState: true, hashChange: false});
    Ostov.history.navigate('');
  });

  it('#2656 - No trailing slash on root. (query string)', function() {
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function(state, title, url) {
          expect(url).toBe('/root?x=1');
        }
      }
    });
    location.replace('http://example.com/root/path');
    Ostov.history.start({pushState: true, hashChange: false, root: 'root'});
    Ostov.history.navigate('?x=1');
  });

  it('#3391 - Empty root normalizes to single slash.', function() {
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function(state, title, url) {
          expect(url).toBe('/');
        }
      }
    });
    location.replace('http://example.com/root/path');
    Ostov.history.start({pushState: true, hashChange: false, root: ''});
    Ostov.history.navigate('');
  });

  it('#3391 - Use trailing slash on root when trailingSlash is true.', function() {
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function(state, title, url) {
          expect(url).toBe('/root/');
        }
      }
    });
    location.replace('http://example.com/root/path');
    Ostov.history.start({pushState: true, hashChange: false, root: 'root', trailingSlash: true});
    Ostov.history.navigate('');
  });

  it('#2765 - Fragment matching sans query/hash.', function() {
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function(state, title, url) {
          expect(url).toBe('/path?query#hash');
        }
      }
    });

    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {
      path: function() { expect(true).toBeTruthy(); }
    };
    var myRouter = new MyRouter;

    location.replace('http://example.com/');
    Ostov.history.start({pushState: true, hashChange: false});
    Ostov.history.navigate('path?query#hash', true);
  });

  it('Do not decode the search params.', function() {
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {
      path: function(params) {
        expect(params).toBe('x=y%3Fz');
      }
    };
    var myRouter = new MyRouter;
    Ostov.history.navigate('path?x=y%3Fz', true);
  });

  it('Navigate to a hash url.', function() {
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.start({pushState: true});
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {
      path: function(params) {
        expect(params).toBe('x=y');
      }
    };
    var myRouter = new MyRouter;
    location.replace('http://example.com/path?x=y#hash');
    Ostov.history.checkUrl();
  });

  it('#navigate to a hash url.', function() {
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.start({pushState: true});
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {
      path: function(params) {
        expect(params).toBe('x=y');
      }
    };
    var myRouter = new MyRouter;
    Ostov.history.navigate('path?x=y#hash', true);
  });

  it('unicode pathname', function() {
    location.replace('http://example.com/myyjä');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {
      myyjä: function() {
        expect(true).toBeTruthy();
      }
    };
    new MyRouter;
    Ostov.history.start({pushState: true});
  });

  it('unicode pathname with % in a parameter', function() {
    location.replace('http://example.com/myyjä/foo%20%25%3F%2f%40%25%20bar');
    location.pathname = '/myyj%C3%A4/foo%20%25%3F%2f%40%25%20bar';
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {
      'myyjä/:query': function(query) {
        expect(query).toBe('foo %?/@% bar');
      }
    };
    new MyRouter;
    Ostov.history.start({pushState: true});
  });

  it('newline in route', function() {
    location.replace('http://example.com/stuff%0Anonsense?param=foo%0Abar');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {
      'stuff\nnonsense': function() {
        expect(true).toBeTruthy();
      }
    };
    new MyRouter;
    Ostov.history.start({pushState: true});
  });

  it('Router#execute receives callback, args, name.', function() {
    location.replace('http://example.com#foo/123/bar?x=y');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    class MyRouter extends Ostov.Router {
      foo() {}
      execute(callback, args, name) {
        expect(callback).toBe(this.foo);
        expect(args).toEqual(['123', 'x=y']);
        expect(name).toBe('foo');
      }
    }
    MyRouter.prototype.routes = {'foo/:id/bar': 'foo'};
    var myRouter = new MyRouter;
    Ostov.history.start();
  });

  it('pushState to hashChange with only search params.', function() {
    Ostov.history.stop();
    location.replace('http://example.com?a=b');
    location.replace = function(url) {
      expect(url).toBe('/#?a=b');
    };
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: null
    });
    Ostov.history.start({pushState: true});
  });

  it('#3123 - History#navigate decodes before comparison.', function() {
    Ostov.history.stop();
    location.replace('http://example.com/shop/search?keyword=short%20dress');
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: function() { expect(false).toBeTruthy(); },
        replaceState: function() { expect(false).toBeTruthy(); }
      }
    });
    Ostov.history.start({pushState: true});
    Ostov.history.navigate('shop/search?keyword=short%20dress', true);
    expect(Ostov.history.fragment).toBe('shop/search?keyword=short dress');
  });

  it('#3175 - Urls in the params', function() {
    Ostov.history.stop();
    location.replace('http://example.com#login?a=value&backUrl=https%3A%2F%2Fwww.msn.com%2Fidp%2Fidpdemo%3Fspid%3Dspdemo%26target%3Db');
    Ostov.history = _.extend(new Ostov.History, {location: location});
    var myRouter = new Ostov.Router;
    myRouter.route('login', function(params) {
      expect(params).toBe('a=value&backUrl=https%3A%2F%2Fwww.msn.com%2Fidp%2Fidpdemo%3Fspid%3Dspdemo%26target%3Db');
    });
    Ostov.history.start();
  });

  it('#3358 - pushState to hashChange transition with search params', function() {
    Ostov.history.stop();
    location.replace('http://example.com/root?foo=bar');
    location.replace = function(url) {
      expect(url).toBe('/root#?foo=bar');
    };
    Ostov.history = _.extend(new Ostov.History, {
      location: location,
      history: {
        pushState: undefined,
        replaceState: undefined
      }
    });
    Ostov.history.start({root: '/root', pushState: true});
  });

  it('Paths that don\'t match the root should not match no root', function() {
    location.replace('http://example.com/foo');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {
      foo: function() {
        expect(false).toBeTruthy();
      }
    };
    var myRouter = new MyRouter;
    Ostov.history.start({root: 'root', pushState: true});
  });

  it('Paths that don\'t match the root should not match roots of the same length', function() {
    location.replace('http://example.com/xxxx/foo');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {
      foo: function() {
        expect(false).toBeTruthy();
      }
    };
    var myRouter = new MyRouter;
    Ostov.history.start({root: 'root', pushState: true});
  });

  it('roots with regex characters', function() {
    location.replace('http://example.com/x+y.z/foo');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {foo: function() { expect(true).toBeTruthy(); }};
    var myRouter = new MyRouter;
    Ostov.history.start({root: 'x+y.z', pushState: true});
  });

  it('roots with unicode characters', function() {
    location.replace('http://example.com/®ooτ/foo');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {foo: function() { expect(true).toBeTruthy(); }};
    var myRouter = new MyRouter;
    Ostov.history.start({root: '®ooτ', pushState: true});
  });

  it('roots without slash', function() {
    location.replace('http://example.com/®ooτ');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {'': function() { expect(true).toBeTruthy(); }};
    var myRouter = new MyRouter;
    Ostov.history.start({root: '®ooτ', pushState: true});
  });

  it('#4025 - navigate updates URL hash as is', function() {
    var route = 'search/has%20space';
    Ostov.history.navigate(route);
    expect(location.hash).toBe('#' + route);
  });

  it('initial non-matching root triggers notfound event', function() {
    location.replace('http://example.com/root#foo');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.on('notfound', function() { expect(true).toBeTruthy(); });
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {foo: function() { expect(false).toBeTruthy(); }};
    var myRouter = new MyRouter;
    Ostov.history.start({root: 'other'});
  });

  it('later non-matching root triggers notfound event', function() {
    location.replace('http://example.com/root#foo');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.on('notfound', function() { expect(true).toBeTruthy(); });
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {foo: function() { expect(true).toBeTruthy(); }};
    var myRouter = new MyRouter;
    Ostov.history.start({root: 'root'});
    location.replace('http://example.com/other#foo');
    Ostov.history.checkUrl();
  });

  it('initial non-matching route triggers notfound event', function() {
    location.replace('http://example.com/root#bar');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.on('notfound', function() { expect(true).toBeTruthy(); });
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {foo: function() { expect(false).toBeTruthy(); }};
    var myRouter = new MyRouter;
    Ostov.history.start({root: 'root'});
  });

  it('later non-matching route triggers notfound event', function() {
    location.replace('http://example.com/root#foo');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.on('notfound', function() { expect(true).toBeTruthy(); });
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {foo: function() { expect(true).toBeTruthy(); }};
    var myRouter = new MyRouter;
    Ostov.history.start({root: 'root'});
    location.replace('http://example.com/other#bar');
    Ostov.history.checkUrl();
  });

  it('non-matching pushState route triggers notfound event', function() {
    location.replace('http://example.com/root/foo');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.on('notfound', function() { expect(true).toBeTruthy(); });
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {foo: function() { expect(true).toBeTruthy(); }};
    var myRouter = new MyRouter;
    Ostov.history.start({root: 'root', pushState: true});
    location.replace('http://example.com/other/bar');
    Ostov.history.checkUrl();
  });

  it('non-matching navigate triggers notfound event', function() {
    location.replace('http://example.com/root#foo');
    Ostov.history.stop();
    Ostov.history = _.extend(new Ostov.History, {location: location});
    Ostov.history.on('notfound', function() { expect(true).toBeTruthy(); });
    class MyRouter extends Ostov.Router {
    }
    MyRouter.prototype.routes = {foo: function() { expect(true).toBeTruthy(); }};
    var myRouter = new MyRouter;
    Ostov.history.start({root: 'root'});
    Ostov.history.navigate('http://example.com/other#bar', {trigger: true});
  });

});
