import { describe, it, expect, beforeEach } from 'vitest';

describe('Ostov.Events', () => {

  it('on and trigger', () => {
    var obj = {counter: 0};
    _.extend(obj, Ostov.Events);
    obj.on('event', function() { obj.counter += 1; });
    obj.trigger('event');
    expect(obj.counter).toBe(1);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    expect(obj.counter).toBe(5);
  });

  it('binding and triggering multiple events', () => {
    var obj = {counter: 0};
    _.extend(obj, Ostov.Events);

    obj.on('a b c', function() { obj.counter += 1; });

    obj.trigger('a');
    expect(obj.counter).toBe(1);

    obj.trigger('a b');
    expect(obj.counter).toBe(3);

    obj.trigger('c');
    expect(obj.counter).toBe(4);

    obj.off('a c');
    obj.trigger('a b c');
    expect(obj.counter).toBe(5);
  });

  it('binding and triggering with event maps', () => {
    var obj = {counter: 0};
    _.extend(obj, Ostov.Events);

    var increment = function() {
      this.counter += 1;
    };

    obj.on({
      a: increment,
      b: increment,
      c: increment
    }, obj);

    obj.trigger('a');
    expect(obj.counter).toBe(1);

    obj.trigger('a b');
    expect(obj.counter).toBe(3);

    obj.trigger('c');
    expect(obj.counter).toBe(4);

    obj.off({
      a: increment,
      c: increment
    }, obj);
    obj.trigger('a b c');
    expect(obj.counter).toBe(5);
  });

  it('binding and triggering multiple event names with event maps', () => {
    var obj = {counter: 0};
    _.extend(obj, Ostov.Events);

    var increment = function() {
      this.counter += 1;
    };

    obj.on({
      'a b c': increment
    });

    obj.trigger('a');
    expect(obj.counter).toBe(1);

    obj.trigger('a b');
    expect(obj.counter).toBe(3);

    obj.trigger('c');
    expect(obj.counter).toBe(4);

    obj.off({
      'a c': increment
    });
    obj.trigger('a b c');
    expect(obj.counter).toBe(5);
  });

  it('binding and trigger with event maps context', () => {
    var obj = {counter: 0};
    var context = {};
    _.extend(obj, Ostov.Events);

    obj.on({
      a: function() {
        expect(this).toBe(context);
      }
    }, context).trigger('a');

    obj.off().on({
      a: function() {
        expect(this).toBe(context);
      }
    }, this, context).trigger('a');
  });

  it('listenTo and stopListening', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var called = false;
    a.listenTo(b, 'all', function(){ called = true; });
    b.trigger('anything');
    expect(called).toBeTruthy();
    a.listenTo(b, 'all', function(){ throw new Error('should not be called'); });
    a.stopListening();
    b.trigger('anything');
  });

  it('listenTo and stopListening with event maps', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var callCount = 0;
    var cb = function(){ callCount++; };
    a.listenTo(b, {event: cb});
    b.trigger('event');
    expect(callCount).toBe(1);
    a.listenTo(b, {event2: cb});
    b.on('event2', cb);
    a.stopListening(b, {event2: cb});
    b.trigger('event event2');
    expect(callCount).toBe(3);
    a.stopListening();
    b.trigger('event event2');
    expect(callCount).toBe(4);
  });

  it('stopListening with omitted args', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var callCount = 0;
    var cb = function() { callCount++; };
    a.listenTo(b, 'event', cb);
    b.on('event', cb);
    a.listenTo(b, 'event2', cb);
    a.stopListening(null, {event: cb});
    b.trigger('event event2');
    expect(callCount).toBe(2);
    b.off();
    a.listenTo(b, 'event event2', cb);
    a.stopListening(null, 'event');
    a.stopListening();
    b.trigger('event2');
  });

  it('listenToOnce', () => {
    // Same as the previous test, but we use once rather than having to explicitly unbind
    var obj = {counterA: 0, counterB: 0};
    _.extend(obj, Ostov.Events);
    var incrA = function(){ obj.counterA += 1; obj.trigger('event'); };
    var incrB = function(){ obj.counterB += 1; };
    obj.listenToOnce(obj, 'event', incrA);
    obj.listenToOnce(obj, 'event', incrB);
    obj.trigger('event');
    expect(obj.counterA).toBe(1);
    expect(obj.counterB).toBe(1);
  });

  it('listenToOnce and stopListening', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var called = false;
    a.listenToOnce(b, 'all', function() { called = true; });
    b.trigger('anything');
    expect(called).toBeTruthy();
    b.trigger('anything');
    a.listenToOnce(b, 'all', function() { throw new Error('should not be called'); });
    a.stopListening();
    b.trigger('anything');
  });

  it('listenTo, listenToOnce and stopListening', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var called = false;
    a.listenToOnce(b, 'all', function() { called = true; });
    b.trigger('anything');
    expect(called).toBeTruthy();
    b.trigger('anything');
    a.listenTo(b, 'all', function() { throw new Error('should not be called'); });
    a.stopListening();
    b.trigger('anything');
  });

  it('listenTo and stopListening with event maps', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var called = false;
    a.listenTo(b, {change: function(){ called = true; }});
    b.trigger('change');
    expect(called).toBeTruthy();
    a.listenTo(b, {change: function(){ throw new Error('should not be called'); }});
    a.stopListening();
    b.trigger('change');
  });

  it('listenTo yourself', () => {
    var e = _.extend({}, Ostov.Events);
    var called = false;
    e.listenTo(e, 'foo', function(){ called = true; });
    e.trigger('foo');
    expect(called).toBeTruthy();
  });

  it('listenTo yourself cleans yourself up with stopListening', () => {
    var e = _.extend({}, Ostov.Events);
    var called = false;
    e.listenTo(e, 'foo', function(){ called = true; });
    e.trigger('foo');
    expect(called).toBeTruthy();
    e.stopListening();
    e.trigger('foo');
  });

  it('stopListening cleans up references', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var fn = function() {};
    b.on('event', fn);
    a.listenTo(b, 'event', fn).stopListening();
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._events.event)).toBe(1);
    expect(_.size(b._listeners)).toBe(0);
    a.listenTo(b, 'event', fn).stopListening(b);
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._events.event)).toBe(1);
    expect(_.size(b._listeners)).toBe(0);
    a.listenTo(b, 'event', fn).stopListening(b, 'event');
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._events.event)).toBe(1);
    expect(_.size(b._listeners)).toBe(0);
    a.listenTo(b, 'event', fn).stopListening(b, 'event', fn);
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._events.event)).toBe(1);
    expect(_.size(b._listeners)).toBe(0);
  });

  it('stopListening cleans up references from listenToOnce', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var fn = function() {};
    b.on('event', fn);
    a.listenToOnce(b, 'event', fn).stopListening();
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._events.event)).toBe(1);
    expect(_.size(b._listeners)).toBe(0);
    a.listenToOnce(b, 'event', fn).stopListening(b);
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._events.event)).toBe(1);
    expect(_.size(b._listeners)).toBe(0);
    a.listenToOnce(b, 'event', fn).stopListening(b, 'event');
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._events.event)).toBe(1);
    expect(_.size(b._listeners)).toBe(0);
    a.listenToOnce(b, 'event', fn).stopListening(b, 'event', fn);
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._events.event)).toBe(1);
    expect(_.size(b._listeners)).toBe(0);
  });

  it('listenTo and off cleaning up references', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var fn = function() {};
    a.listenTo(b, 'event', fn);
    b.off();
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._listeners)).toBe(0);
    a.listenTo(b, 'event', fn);
    b.off('event');
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._listeners)).toBe(0);
    a.listenTo(b, 'event', fn);
    b.off(null, fn);
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._listeners)).toBe(0);
    a.listenTo(b, 'event', fn);
    b.off(null, null, a);
    expect(_.size(a._listeningTo)).toBe(0);
    expect(_.size(b._listeners)).toBe(0);
  });

  it('listenTo and stopListening cleaning up references', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var called = false;
    a.listenTo(b, 'all', function(){ called = true; });
    b.trigger('anything');
    expect(called).toBeTruthy();
    a.listenTo(b, 'other', function(){ throw new Error('should not be called'); });
    a.stopListening(b, 'other');
    a.stopListening(b, 'all');
    expect(_.size(a._listeningTo)).toBe(0);
  });

  it('listenToOnce without context cleans up references after the event has fired', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var called = false;
    a.listenToOnce(b, 'all', function(){ called = true; });
    b.trigger('anything');
    expect(called).toBeTruthy();
    expect(_.size(a._listeningTo)).toBe(0);
  });

  it('listenToOnce with event maps cleans up references', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    var called = false;
    a.listenToOnce(b, {
      one: function() { called = true; },
      two: function() { throw new Error('should not be called'); }
    });
    b.trigger('one');
    expect(called).toBeTruthy();
    expect(_.size(a._listeningTo)).toBe(1);
  });

  it('listenToOnce with event maps binds the correct `this`', () => {
    var a = _.extend({}, Ostov.Events);
    var b = _.extend({}, Ostov.Events);
    a.listenToOnce(b, {
      one: function() { expect(this === a).toBeTruthy(); },
      two: function() { throw new Error('should not be called'); }
    });
    b.trigger('one');
  });

  it("listenTo with empty callback doesn't throw an error", () => {
    var e = _.extend({}, Ostov.Events);
    e.listenTo(e, 'foo', null);
    e.trigger('foo');
    expect(true).toBeTruthy();
  });

  it('trigger all for each event', () => {
    var a, b, obj = {counter: 0};
    _.extend(obj, Ostov.Events);
    obj.on('all', function(event) {
      obj.counter++;
      if (event === 'a') a = true;
      if (event === 'b') b = true;
    })
    .trigger('a b');
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(obj.counter).toBe(2);
  });

  it('on, then unbind all functions', () => {
    var obj = {counter: 0};
    _.extend(obj, Ostov.Events);
    var callback = function() { obj.counter += 1; };
    obj.on('event', callback);
    obj.trigger('event');
    obj.off('event');
    obj.trigger('event');
    expect(obj.counter).toBe(1);
  });

  it('bind two callbacks, unbind only one', () => {
    var obj = {counterA: 0, counterB: 0};
    _.extend(obj, Ostov.Events);
    var callback = function() { obj.counterA += 1; };
    obj.on('event', callback);
    obj.on('event', function() { obj.counterB += 1; });
    obj.trigger('event');
    obj.off('event', callback);
    obj.trigger('event');
    expect(obj.counterA).toBe(1);
    expect(obj.counterB).toBe(2);
  });

  it('unbind a callback in the midst of it firing', () => {
    var obj = {counter: 0};
    _.extend(obj, Ostov.Events);
    var callback = function() {
      obj.counter += 1;
      obj.off('event', callback);
    };
    obj.on('event', callback);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    expect(obj.counter).toBe(1);
  });

  it('two binds that unbind themeselves', () => {
    var obj = {counterA: 0, counterB: 0};
    _.extend(obj, Ostov.Events);
    var incrA = function(){ obj.counterA += 1; obj.off('event', incrA); };
    var incrB = function(){ obj.counterB += 1; obj.off('event', incrB); };
    obj.on('event', incrA);
    obj.on('event', incrB);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    expect(obj.counterA).toBe(1);
    expect(obj.counterB).toBe(1);
  });

  it('bind a callback with a default context when none supplied', () => {
    var obj = _.extend({
      assertTrue: function() {
        expect(this).toBe(obj);
      }
    }, Ostov.Events);

    obj.once('event', obj.assertTrue);
    obj.trigger('event');
  });

  it('bind a callback with a supplied context', () => {
    var TestClass = function() {
      return this;
    };
    TestClass.prototype.assertTrue = function() {
      expect(true).toBeTruthy();
    };

    var obj = _.extend({}, Ostov.Events);
    obj.on('event', function() { this.assertTrue(); }, new TestClass);
    obj.trigger('event');
  });

  it('nested trigger with unbind', () => {
    var obj = {counter: 0};
    _.extend(obj, Ostov.Events);
    var incr1 = function(){ obj.counter += 1; obj.off('event', incr1); obj.trigger('event'); };
    var incr2 = function(){ obj.counter += 1; };
    obj.on('event', incr1);
    obj.on('event', incr2);
    obj.trigger('event');
    expect(obj.counter).toBe(3);
  });

  it('callback list is not altered during trigger', () => {
    var counter = 0, obj = _.extend({}, Ostov.Events);
    var incr = function(){ counter++; };
    var incrOn = function(){ obj.on('event all', incr); };
    var incrOff = function(){ obj.off('event all', incr); };

    obj.on('event all', incrOn).trigger('event');
    expect(counter).toBe(0);

    obj.off().on('event', incrOff).on('event all', incr).trigger('event');
    expect(counter).toBe(2);
  });

  it("#1282 - 'all' callback list is retrieved after each event.", () => {
    var counter = 0;
    var obj = _.extend({}, Ostov.Events);
    var incr = function(){ counter++; };
    obj.on('x', function() {
      obj.on('y', incr).on('all', incr);
    })
    .trigger('x y');
    expect(counter).toBe(2);
  });

  it('if no callback is provided, `on` is a noop', () => {
    _.extend({}, Ostov.Events).on('test').trigger('test');
  });

  it('if callback is truthy but not a function, `on` should throw an error just like jQuery', () => {
    var view = _.extend({}, Ostov.Events).on('test', 'noop');
    expect(function() {
      view.trigger('test');
    }).toThrow();
  });

  it('remove all events for a specific context', () => {
    var obj = _.extend({}, Ostov.Events);
    var callCount = 0;
    obj.on('x y all', function() { callCount++; });
    obj.on('x y all', function() { throw new Error('should not be called'); }, obj);
    obj.off(null, null, obj);
    obj.trigger('x y');
    expect(callCount).toBe(4);
  });

  it('remove all events for a specific callback', () => {
    var obj = _.extend({}, Ostov.Events);
    var callCount = 0;
    var success = function() { callCount++; };
    var fail = function() { throw new Error('should not be called'); };
    obj.on('x y all', success);
    obj.on('x y all', fail);
    obj.off(null, fail);
    obj.trigger('x y');
    expect(callCount).toBe(4);
  });

  it('#1310 - off does not skip consecutive events', () => {
    var obj = _.extend({}, Ostov.Events);
    obj.on('event', function() { throw new Error('should not be called'); }, obj);
    obj.on('event', function() { throw new Error('should not be called'); }, obj);
    obj.off(null, null, obj);
    obj.trigger('event');
  });

  it('once', () => {
    // Same as the previous test, but we use once rather than having to explicitly unbind
    var obj = {counterA: 0, counterB: 0};
    _.extend(obj, Ostov.Events);
    var incrA = function(){ obj.counterA += 1; obj.trigger('event'); };
    var incrB = function(){ obj.counterB += 1; };
    obj.once('event', incrA);
    obj.once('event', incrB);
    obj.trigger('event');
    expect(obj.counterA).toBe(1);
    expect(obj.counterB).toBe(1);
  });

  it('once variant one', () => {
    var callCount = 0;
    var f = function(){ callCount++; };

    var a = _.extend({}, Ostov.Events).once('event', f);
    var b = _.extend({}, Ostov.Events).on('event', f);

    a.trigger('event');

    b.trigger('event');
    b.trigger('event');
    expect(callCount).toBe(3);
  });

  it('once variant two', () => {
    var callCount = 0;
    var f = function(){ callCount++; };
    var obj = _.extend({}, Ostov.Events);

    obj
    .once('event', f)
    .on('event', f)
    .trigger('event')
    .trigger('event');
    expect(callCount).toBe(3);
  });

  it('once with off', () => {
    var f = function(){ throw new Error('should not be called'); };
    var obj = _.extend({}, Ostov.Events);

    obj.once('event', f);
    obj.off('event', f);
    obj.trigger('event');
  });

  it('once with event maps', () => {
    var obj = {counter: 0};
    _.extend(obj, Ostov.Events);

    var increment = function() {
      this.counter += 1;
    };

    obj.once({
      a: increment,
      b: increment,
      c: increment
    }, obj);

    obj.trigger('a');
    expect(obj.counter).toBe(1);

    obj.trigger('a b');
    expect(obj.counter).toBe(2);

    obj.trigger('c');
    expect(obj.counter).toBe(3);

    obj.trigger('a b c');
    expect(obj.counter).toBe(3);
  });

  it('bind a callback with a supplied context using once with object notation', () => {
    var obj = {counter: 0};
    var context = {};
    _.extend(obj, Ostov.Events);

    obj.once({
      a: function() {
        expect(this).toBe(context);
      }
    }, context).trigger('a');
  });

  it('once with off only by context', () => {
    var context = {};
    var obj = _.extend({}, Ostov.Events);
    obj.once('event', function(){ throw new Error('should not be called'); }, context);
    obj.off(null, null, context);
    obj.trigger('event');
  });

  it('Ostov object inherits Events', () => {
    expect(Ostov.on === Ostov.Events.on).toBeTruthy();
  });

  it('once with asynchronous events', async () => {
    var called = false;
    var func = _.debounce(function() { called = true; }, 50);
    var obj = _.extend({}, Ostov.Events).once('async', func);

    obj.trigger('async');
    obj.trigger('async');

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(called).toBeTruthy();
  });

  it('once with multiple events.', () => {
    var callCount = 0;
    var obj = _.extend({}, Ostov.Events);
    obj.once('x y', function() { callCount++; });
    obj.trigger('x y');
    expect(callCount).toBe(2);
  });

  it('Off during iteration with once.', () => {
    var obj = _.extend({}, Ostov.Events);
    var f = function(){ this.off('event', f); };
    obj.on('event', f);
    obj.once('event', function(){});
    var callCount = 0;
    obj.on('event', function(){ callCount++; });

    obj.trigger('event');
    obj.trigger('event');
    expect(callCount).toBe(2);
  });

  it('`once` on `all` should work as expected', () => {
    var called = false;
    Ostov.once('all', function() {
      called = true;
      Ostov.trigger('all');
    });
    Ostov.trigger('all');
    expect(called).toBeTruthy();
  });

  it('once without a callback is a noop', () => {
    _.extend({}, Ostov.Events).once('event').trigger('event');
  });

  it('listenToOnce without a callback is a noop', () => {
    var obj = _.extend({}, Ostov.Events);
    obj.listenToOnce(obj, 'event').trigger('event');
  });

  it('event functions are chainable', () => {
    var obj = _.extend({}, Ostov.Events);
    var obj2 = _.extend({}, Ostov.Events);
    var fn = function() {};
    expect(obj).toBe(obj.trigger('noeventssetyet'));
    expect(obj).toBe(obj.off('noeventssetyet'));
    expect(obj).toBe(obj.stopListening('noeventssetyet'));
    expect(obj).toBe(obj.on('a', fn));
    expect(obj).toBe(obj.once('c', fn));
    expect(obj).toBe(obj.trigger('a'));
    expect(obj).toBe(obj.listenTo(obj2, 'a', fn));
    expect(obj).toBe(obj.listenToOnce(obj2, 'b', fn));
    expect(obj).toBe(obj.off('a c'));
    expect(obj).toBe(obj.stopListening(obj2, 'a'));
    expect(obj).toBe(obj.stopListening());
  });

  it('#3448 - listenToOnce with space-separated events', () => {
    var one = _.extend({}, Ostov.Events);
    var two = _.extend({}, Ostov.Events);
    var count = 1;
    one.listenToOnce(two, 'x y', function(n) { expect(n === count++).toBeTruthy(); });
    two.trigger('x', 1);
    two.trigger('x', 1);
    two.trigger('y', 2);
    two.trigger('y', 2);
  });

  it('#3611 - listenTo is compatible with non-Ostov event libraries', () => {
    var obj = _.extend({}, Ostov.Events);
    var other = {
      events: {},
      on: function(name, callback) {
        this.events[name] = callback;
      },
      trigger: function(name) {
        this.events[name]();
      }
    };

    var called = false;
    obj.listenTo(other, 'test', function() { called = true; });
    other.trigger('test');
    expect(called).toBeTruthy();
  });

  it('#3611 - stopListening is compatible with non-Ostov event libraries', () => {
    var obj = _.extend({}, Ostov.Events);
    var other = {
      events: {},
      on: function(name, callback) {
        this.events[name] = callback;
      },
      off: function() {
        this.events = {};
      },
      trigger: function(name) {
        var fn = this.events[name];
        if (fn) fn();
      }
    };

    obj.listenTo(other, 'test', function() { throw new Error('should not be called'); });
    obj.stopListening(other);
    other.trigger('test');
    expect(_.size(obj._listeningTo)).toBe(0);
  });

});
