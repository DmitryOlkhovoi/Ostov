import { describe, it, expect, beforeEach } from 'vitest';

class ProxyModel extends Ostov.Model {}
class Klass extends Ostov.Collection {
  url() { return '/collection'; }
}
var doc, collection;

describe('Ostov.Model', () => {

  beforeEach(() => {
    doc = new ProxyModel({
      id: '1-the-tempest',
      title: 'The Tempest',
      author: 'Bill Shakespeare',
      length: 123
    });
    collection = new Klass();
    collection.add(doc);
  });

  it('initialize', () => {
    class Model extends Ostov.Model {
      initialize() {
        this.one = 1;
        expect(this.collection).toBe(collection);
      }
    }
    var model = new Model({}, {collection: collection});
    expect(model.one).toBe(1);
    expect(model.collection).toBe(collection);
  });

  it('Object.prototype properties are overridden by attributes', () => {
    var model = new Ostov.Model({hasOwnProperty: true});
    expect(model.get('hasOwnProperty')).toBe(true);
  });

  it('initialize with attributes and options', () => {
    class Model extends Ostov.Model {
      initialize(attributes, options) {
        this.one = options.one;
      }
    }
    var model = new Model({}, {one: 1});
    expect(model.one).toBe(1);
  });

  it('initialize with parsed attributes', () => {
    class Model extends Ostov.Model {
      parse(attrs) {
        attrs.value += 1;
        return attrs;
      }
    }
    var model = new Model({value: 1}, {parse: true});
    expect(model.get('value')).toBe(2);
  });


  it('preinitialize', () => {
    class Model extends Ostov.Model {
      preinitialize() {
        this.one = 1;
      }
    }
    var model = new Model({}, {collection: collection});
    expect(model.one).toBe(1);
    expect(model.collection).toBe(collection);
  });

  it('preinitialize occurs before the model is set up', () => {
    class Model extends Ostov.Model {
      preinitialize() {
        expect(this.collection).toBe(undefined);
        expect(this.cid).toBe(undefined);
        expect(this.id).toBe(undefined);
      }
    }
    var model = new Model({id: 'foo'}, {collection: collection});
    expect(model.collection).toBe(collection);
    expect(model.id).toBe('foo');
    expect(model.cid).not.toBe(undefined);
  });

  it('parse can return null', () => {
    class Model extends Ostov.Model {
      parse(attrs) {
        attrs.value += 1;
        return null;
      }
    }
    var model = new Model({value: 1}, {parse: true});
    expect(JSON.stringify(model.toJSON())).toBe('{}');
  });

  it('url', () => {
    doc.urlRoot = null;
    expect(doc.url()).toBe('/collection/1-the-tempest');
    doc.collection.url = '/collection/';
    expect(doc.url()).toBe('/collection/1-the-tempest');
    doc.collection = null;
    expect(function() { doc.url(); }).toThrow();
    doc.collection = collection;
  });

  it('url when using urlRoot, and uri encoding', () => {
    class Model extends Ostov.Model {}
    Model.prototype.urlRoot = '/collection';
    var model = new Model();
    expect(model.url()).toBe('/collection');
    model.set({id: '+1+'});
    expect(model.url()).toBe('/collection/%2B1%2B');
  });

  it('url when using urlRoot as a function to determine urlRoot at runtime', () => {
    class Model extends Ostov.Model {
      urlRoot() {
        return '/nested/' + this.get('parentId') + '/collection';
      }
    }

    var model = new Model({parentId: 1});
    expect(model.url()).toBe('/nested/1/collection');
    model.set({id: 2});
    expect(model.url()).toBe('/nested/1/collection/2');
  });

  it('underscore methods', () => {
    var model = new Ostov.Model({foo: 'a', bar: 'b', baz: 'c'});
    var model2 = model.clone();
    expect(model.keys()).toEqual(['foo', 'bar', 'baz']);
    expect(model.values()).toEqual(['a', 'b', 'c']);
    expect(model.invert()).toEqual({a: 'foo', b: 'bar', c: 'baz'});
    expect(model.pick('foo', 'baz')).toEqual({foo: 'a', baz: 'c'});
    expect(model.omit('foo', 'bar')).toEqual({baz: 'c'});
  });

  it('chain', () => {
    var model = new Ostov.Model({a: 0, b: 1, c: 2});
    expect(model.chain().pick('a', 'b', 'c').values().compact().value()).toEqual([1, 2]);
  });

  it('clone', () => {
    var a = new Ostov.Model({foo: 1, bar: 2, baz: 3});
    var b = a.clone();
    expect(a.get('foo')).toBe(1);
    expect(a.get('bar')).toBe(2);
    expect(a.get('baz')).toBe(3);
    expect(b.get('foo')).toBe(a.get('foo'));
    expect(b.get('bar')).toBe(a.get('bar'));
    expect(b.get('baz')).toBe(a.get('baz'));
    a.set({foo: 100});
    expect(a.get('foo')).toBe(100);
    expect(b.get('foo')).toBe(1);

    var foo = new Ostov.Model({p: 1});
    var bar = new Ostov.Model({p: 2});
    bar.set(foo.clone().attributes, {unset: true});
    expect(foo.get('p')).toBe(1);
    expect(bar.get('p')).toBe(undefined);
  });

  it('isNew', () => {
    var a = new Ostov.Model({foo: 1, bar: 2, baz: 3});
    expect(a.isNew()).toBeTruthy();
    a = new Ostov.Model({foo: 1, bar: 2, baz: 3, id: -5});
    expect(!a.isNew()).toBeTruthy();
    a = new Ostov.Model({foo: 1, bar: 2, baz: 3, id: 0});
    expect(!a.isNew()).toBeTruthy();
    expect(new Ostov.Model().isNew()).toBeTruthy();
    expect(!new Ostov.Model({id: 2}).isNew()).toBeTruthy();
    expect(!new Ostov.Model({id: -5}).isNew()).toBeTruthy();
  });

  it('get', () => {
    expect(doc.get('title')).toBe('The Tempest');
    expect(doc.get('author')).toBe('Bill Shakespeare');
  });

  it('escape', () => {
    expect(doc.escape('title')).toBe('The Tempest');
    doc.set({audience: 'Bill & Bob'});
    expect(doc.escape('audience')).toBe('Bill &amp; Bob');
    doc.set({audience: 'Tim > Joan'});
    expect(doc.escape('audience')).toBe('Tim &gt; Joan');
    doc.set({audience: 10101});
    expect(doc.escape('audience')).toBe('10101');
    doc.unset('audience');
    expect(doc.escape('audience')).toBe('');
  });

  it('has', () => {
    var model = new Ostov.Model();

    expect(model.has('name')).toBe(false);

    model.set({
      '0': 0,
      '1': 1,
      'true': true,
      'false': false,
      'empty': '',
      'name': 'name',
      'null': null,
      'undefined': undefined
    });

    expect(model.has('0')).toBe(true);
    expect(model.has('1')).toBe(true);
    expect(model.has('true')).toBe(true);
    expect(model.has('false')).toBe(true);
    expect(model.has('empty')).toBe(true);
    expect(model.has('name')).toBe(true);

    model.unset('name');

    expect(model.has('name')).toBe(false);
    expect(model.has('null')).toBe(false);
    expect(model.has('undefined')).toBe(false);
  });

  it('matches', () => {
    var model = new Ostov.Model();

    expect(model.matches({name: 'Jonas', cool: true})).toBe(false);

    model.set({name: 'Jonas', cool: true});

    expect(model.matches({name: 'Jonas'})).toBe(true);
    expect(model.matches({name: 'Jonas', cool: true})).toBe(true);
    expect(model.matches({name: 'Jonas', cool: false})).toBe(false);
  });

  it('matches with predicate', () => {
    var model = new Ostov.Model({a: 0});

    expect(model.matches(function(attr) {
      return attr.a > 1 && attr.b != null;
    })).toBe(false);

    model.set({a: 3, b: true});

    expect(model.matches(function(attr) {
      return attr.a > 1 && attr.b != null;
    })).toBe(true);
  });

  it('set and unset', () => {
    var a = new Ostov.Model({id: 'id', foo: 1, bar: 2, baz: 3});
    var changeCount = 0;
    a.on('change:foo', function() { changeCount += 1; });
    a.set({foo: 2});
    expect(a.get('foo')).toBe(2);
    expect(changeCount).toBe(1);
    // set with value that is not new shouldn't fire change event
    a.set({foo: 2});
    expect(a.get('foo')).toBe(2);
    expect(changeCount).toBe(1);

    a.validate = function(attrs) {
      expect(attrs.foo).toBe(void 0);
    };
    a.unset('foo', {validate: true});
    expect(a.get('foo')).toBe(void 0);
    delete a.validate;
    expect(changeCount).toBe(2);

    a.unset('id');
    expect(a.id).toBe(undefined);
  });

  it('#2030 - set with failed validate, followed by another set triggers change', () => {
    var attr = 0, main = 0, error = 0;
    class Model extends Ostov.Model {
      validate(attrs) {
        if (attrs.x > 1) {
          error++;
          return 'this is an error';
        }
      }
    }
    var model = new Model({x: 0});
    model.on('change:x', function() { attr++; });
    model.on('change', function() { main++; });
    model.set({x: 2}, {validate: true});
    model.set({x: 1}, {validate: true});
    expect([attr, main, error]).toEqual([1, 1, 1]);
  });

  it('set triggers changes in the correct order', () => {
    var value = null;
    var model = new Ostov.Model;
    model.on('last', function(){ value = 'last'; });
    model.on('first', function(){ value = 'first'; });
    model.trigger('first');
    model.trigger('last');
    expect(value).toBe('last');
  });

  it('set falsy values in the correct order', () => {
    var model = new Ostov.Model({result: 'result'});
    model.on('change', function() {
      expect(model.changed.result).toBe(void 0);
      expect(model.previous('result')).toBe(false);
    });
    model.set({result: void 0}, {silent: true});
    model.set({result: null}, {silent: true});
    model.set({result: false}, {silent: true});
    model.set({result: void 0});
  });

  it('nested set triggers with the correct options', () => {
    var model = new Ostov.Model();
    var o1 = {};
    var o2 = {};
    var o3 = {};
    model.on('change', function(__, options) {
      switch (model.get('a')) {
        case 1:
          expect(options).toBe(o1);
          return model.set('a', 2, o2);
        case 2:
          expect(options).toBe(o2);
          return model.set('a', 3, o3);
        case 3:
          expect(options).toBe(o3);
      }
    });
    model.set('a', 1, o1);
  });

  it('multiple unsets', () => {
    var i = 0;
    var counter = function(){ i++; };
    var model = new Ostov.Model({a: 1});
    model.on('change:a', counter);
    model.set({a: 2});
    model.unset('a');
    model.unset('a');
    expect(i).toBe(2);
  });

  it('unset and changedAttributes', () => {
    var model = new Ostov.Model({a: 1});
    model.on('change', function() {
      expect('a' in model.changedAttributes()).toBeTruthy();
    });
    model.unset('a');
  });

  it('using a non-default id attribute.', () => {
    class MongoModel extends Ostov.Model {}
    MongoModel.prototype.idAttribute = '_id';
    var model = new MongoModel({id: 'eye-dee', _id: 25, title: 'Model'});
    expect(model.get('id')).toBe('eye-dee');
    expect(model.id).toBe(25);
    expect(model.isNew()).toBe(false);
    model.unset('_id');
    expect(model.id).toBe(undefined);
    expect(model.isNew()).toBe(true);
  });

  it('setting an alternative cid prefix', () => {
    class Model extends Ostov.Model {}
    Model.prototype.cidPrefix = 'm';
    var model = new Model();

    expect(model.cid.charAt(0)).toBe('m');

    model = new Ostov.Model();
    expect(model.cid.charAt(0)).toBe('c');

    class Collection extends Ostov.Collection {}
    Collection.prototype.model = Model;
    var col = new Collection([{id: 'c5'}, {id: 'c6'}, {id: 'c7'}]);

    expect(col.get('c6').cid.charAt(0)).toBe('m');
    col.set([{id: 'c6', value: 'test'}], {
      merge: true,
      add: true,
      remove: false
    });
    expect(col.get('c6').has('value')).toBeTruthy();
  });

  it('set an empty string', () => {
    var model = new Ostov.Model({name: 'Model'});
    model.set({name: ''});
    expect(model.get('name')).toBe('');
  });

  it('setting an object', () => {
    var model = new Ostov.Model({
      custom: {foo: 1}
    });
    model.on('change', function() {
      expect(true).toBeTruthy();
    });
    model.set({
      custom: {foo: 1} // no change should be fired
    });
    model.set({
      custom: {foo: 2} // change event should be fired
    });
  });

  it('clear', () => {
    var changed;
    var model = new Ostov.Model({id: 1, name: 'Model'});
    model.on('change:name', function(){ changed = true; });
    model.on('change', function() {
      var changedAttrs = model.changedAttributes();
      expect('name' in changedAttrs).toBeTruthy();
    });
    model.clear();
    expect(changed).toBe(true);
    expect(model.get('name')).toBe(undefined);
  });

  it('defaults', () => {
    class Defaulted extends Ostov.Model {}
    Defaulted.prototype.defaults = {
      one: 1,
      two: 2
    };
    var model = new Defaulted({two: undefined});
    expect(model.get('one')).toBe(1);
    expect(model.get('two')).toBe(2);
    model = new Defaulted({two: 3});
    expect(model.get('one')).toBe(1);
    expect(model.get('two')).toBe(3);
    class Defaulted2 extends Ostov.Model {
      defaults() {
        return {
          one: 3,
          two: 4
        };
      }
    }
    model = new Defaulted2({two: undefined});
    expect(model.get('one')).toBe(3);
    expect(model.get('two')).toBe(4);
    class Defaulted3 extends Ostov.Model {}
    Defaulted3.prototype.defaults = {hasOwnProperty: true};
    model = new Defaulted3();
    expect(model.get('hasOwnProperty')).toBe(true);
    model = new Defaulted3({hasOwnProperty: undefined});
    expect(model.get('hasOwnProperty')).toBe(true);
    model = new Defaulted3({hasOwnProperty: false});
    expect(model.get('hasOwnProperty')).toBe(false);
  });

  it('change, hasChanged, changedAttributes, previous, previousAttributes', () => {
    var model = new Ostov.Model({name: 'Tim', age: 10});
    expect(model.changedAttributes()).toEqual(false);
    model.on('change', function() {
      expect(model.hasChanged('name')).toBeTruthy();
      expect(!model.hasChanged('age')).toBeTruthy();
      expect(_.isEqual(model.changedAttributes(), {name: 'Rob'})).toBeTruthy();
      expect(model.previous('name')).toBe('Tim');
      expect(_.isEqual(model.previousAttributes(), {name: 'Tim', age: 10})).toBeTruthy();
    });
    expect(model.hasChanged()).toBe(false);
    expect(model.hasChanged(undefined)).toBe(false);
    model.set({name: 'Rob'});
    expect(model.get('name')).toBe('Rob');
  });

  it('changedAttributes', () => {
    var model = new Ostov.Model({a: 'a', b: 'b'});
    expect(model.changedAttributes()).toEqual(false);
    expect(model.changedAttributes({a: 'a'})).toBe(false);
    expect(model.changedAttributes({a: 'b'}).a).toBe('b');
  });

  it('change with options', () => {
    var value;
    var model = new Ostov.Model({name: 'Rob'});
    model.on('change', function(m, options) {
      value = options.prefix + m.get('name');
    });
    model.set({name: 'Bob'}, {prefix: 'Mr. '});
    expect(value).toBe('Mr. Bob');
    model.set({name: 'Sue'}, {prefix: 'Ms. '});
    expect(value).toBe('Ms. Sue');
  });

  it('change after initialize', () => {
    var changed = 0;
    var attrs = {id: 1, label: 'c'};
    var obj = new Ostov.Model(attrs);
    obj.on('change', function() { changed += 1; });
    obj.set(attrs);
    expect(changed).toBe(0);
  });

  it('save within change event', () => {
    var env = globalThis.env;
    var model = new Ostov.Model({firstName: 'Taylor', lastName: 'Swift'});
    model.url = '/test';
    model.on('change', function() {
      model.save();
      expect(_.isEqual(globalThis.env.syncArgs.model, model)).toBeTruthy();
    });
    model.set({lastName: 'Hicks'});
  });

  it('validate after save', () => {
    var lastError, model = new Ostov.Model();
    model.validate = function(attrs) {
      if (attrs.admin) return "Can't change admin status.";
    };
    model.sync = function(method, m, options) {
      options.success.call(this, {admin: true});
    };
    model.on('invalid', function(m, error) {
      lastError = error;
    });
    model.save(null);

    expect(lastError).toBe("Can't change admin status.");
    expect(model.validationError).toBe("Can't change admin status.");
  });

  it('save', () => {
    doc.save({title: 'Henry V'});
    expect(globalThis.env.syncArgs.method).toBe('update');
    expect(_.isEqual(globalThis.env.syncArgs.model, doc)).toBeTruthy();
  });

  it('save, fetch, destroy triggers error event when an error occurs', () => {
    var model = new Ostov.Model();
    model.on('error', function() {
      expect(true).toBeTruthy();
    });
    model.sync = function(method, m, options) {
      options.error();
    };
    model.save({data: 2, id: 1});
    model.fetch();
    model.destroy();
  });

  it('#3283 - save, fetch, destroy calls success with context', () => {
    var model = new Ostov.Model();
    var obj = {};
    var options = {
      context: obj,
      success: function() {
        expect(this).toBe(obj);
      }
    };
    model.sync = function(method, m, opts) {
      opts.success.call(opts.context);
    };
    model.save({data: 2, id: 1}, options);
    model.fetch(options);
    model.destroy(options);
  });

  it('#3283 - save, fetch, destroy calls error with context', () => {
    var model = new Ostov.Model();
    var obj = {};
    var options = {
      context: obj,
      error: function() {
        expect(this).toBe(obj);
      }
    };
    model.sync = function(method, m, opts) {
      opts.error.call(opts.context);
    };
    model.save({data: 2, id: 1}, options);
    model.fetch(options);
    model.destroy(options);
  });

  it('#3470 - save and fetch with parse false', () => {
    var i = 0;
    var model = new Ostov.Model();
    model.parse = function() {
      expect(false).toBeTruthy();
    };
    model.sync = function(method, m, options) {
      options.success({i: ++i});
    };
    model.fetch({parse: false});
    expect(model.get('i')).toBe(i);
    model.save(null, {parse: false});
    expect(model.get('i')).toBe(i);
  });

  it('save with PATCH', () => {
    doc.clear().set({id: 1, a: 1, b: 2, c: 3, d: 4});
    doc.save();
    expect(globalThis.env.syncArgs.method).toBe('update');
    expect(globalThis.env.syncArgs.options.attrs).toBe(undefined);

    doc.save({b: 2, d: 4}, {patch: true});
    expect(globalThis.env.syncArgs.method).toBe('patch');
    expect(_.size(globalThis.env.syncArgs.options.attrs)).toBe(2);
    expect(globalThis.env.syncArgs.options.attrs.d).toBe(4);
    expect(globalThis.env.syncArgs.options.attrs.a).toBe(undefined);
    expect(globalThis.env.ajaxSettings.data).toBe('{"b":2,"d":4}');
  });

  it('save with PATCH and different attrs', () => {
    doc.clear().save({b: 2, d: 4}, {patch: true, attrs: {B: 1, D: 3}});
    expect(globalThis.env.syncArgs.options.attrs.D).toBe(3);
    expect(globalThis.env.syncArgs.options.attrs.d).toBe(undefined);
    expect(globalThis.env.ajaxSettings.data).toBe('{"B":1,"D":3}');
    expect(doc.attributes).toEqual({b: 2, d: 4});
  });

  it('save in positional style', () => {
    var model = new Ostov.Model();
    model.sync = function(method, m, options) {
      options.success();
    };
    model.save('title', 'Twelfth Night');
    expect(model.get('title')).toBe('Twelfth Night');
  });

  it('save with non-object success response', () => {
    var model = new Ostov.Model();
    model.sync = function(method, m, options) {
      options.success('', options);
      options.success(null, options);
    };
    model.save({testing: 'empty'}, {
      success: function(m) {
        expect(m.attributes).toEqual({testing: 'empty'});
      }
    });
  });

  it('save with wait and supplied id', () => {
    class Model extends Ostov.Model {}
    Model.prototype.urlRoot = '/collection';
    var model = new Model();
    model.save({id: 42}, {wait: true});
    expect(globalThis.env.ajaxSettings.url).toBe('/collection/42');
  });

  it('save will pass extra options to success callback', () => {
    class SpecialSyncModel extends Ostov.Model {
      sync(method, m, options) {
        _.extend(options, {specialSync: true});
        return Ostov.Model.prototype.sync.call(this, method, m, options);
      }
    }
    SpecialSyncModel.prototype.urlRoot = '/test';

    var model = new SpecialSyncModel();

    var onSuccess = function(m, response, options) {
      expect(options.specialSync).toBeTruthy();
    };

    model.save(null, {success: onSuccess});
    globalThis.env.ajaxSettings.success();
  });

  it('failing save with wait:true triggers error event (#4262)', () => {
    var model = new Ostov.Model;
    model.urlRoot = '/test';
    model.on('error', function() { expect(true).toBeTruthy(); });
    model.save({id: '1'}, {wait: true});
    globalThis.env.ajaxSettings.error();
  });

  it('fetch', () => {
    doc.fetch();
    expect(globalThis.env.syncArgs.method).toBe('read');
    expect(_.isEqual(globalThis.env.syncArgs.model, doc)).toBeTruthy();
  });

  it('fetch will pass extra options to success callback', () => {
    class SpecialSyncModel extends Ostov.Model {
      sync(method, m, options) {
        _.extend(options, {specialSync: true});
        return Ostov.Model.prototype.sync.call(this, method, m, options);
      }
    }
    SpecialSyncModel.prototype.urlRoot = '/test';

    var model = new SpecialSyncModel();

    var onSuccess = function(m, response, options) {
      expect(options.specialSync).toBeTruthy();
    };

    model.fetch({success: onSuccess});
    globalThis.env.ajaxSettings.success();
  });

  it('destroy', () => {
    doc.destroy();
    expect(globalThis.env.syncArgs.method).toBe('delete');
    expect(_.isEqual(globalThis.env.syncArgs.model, doc)).toBeTruthy();

    var newModel = new Ostov.Model;
    expect(newModel.destroy()).toBe(false);
  });

  it('destroy will pass extra options to success callback', () => {
    class SpecialSyncModel extends Ostov.Model {
      sync(method, m, options) {
        _.extend(options, {specialSync: true});
        return Ostov.Model.prototype.sync.call(this, method, m, options);
      }
    }
    SpecialSyncModel.prototype.urlRoot = '/test';

    var model = new SpecialSyncModel({id: 'id'});

    var onSuccess = function(m, response, options) {
      expect(options.specialSync).toBeTruthy();
    };

    model.destroy({success: onSuccess});
    globalThis.env.ajaxSettings.success();
  });

  it('non-persisted destroy', () => {
    var a = new Ostov.Model({foo: 1, bar: 2, baz: 3});
    a.sync = function() { throw 'should not be called'; };
    a.destroy();
    expect(true).toBeTruthy();
  });

  it('validate', () => {
    var lastError;
    var model = new Ostov.Model();
    model.validate = function(attrs) {
      if (attrs.admin !== this.get('admin')) return "Can't change admin status.";
    };
    model.on('invalid', function(m, error) {
      lastError = error;
    });
    var result = model.set({a: 100});
    expect(result).toBe(model);
    expect(model.get('a')).toBe(100);
    expect(lastError).toBe(undefined);
    result = model.set({admin: true});
    expect(model.get('admin')).toBe(true);
    result = model.set({a: 200, admin: false}, {validate: true});
    expect(lastError).toBe("Can't change admin status.");
    expect(result).toBe(false);
    expect(model.get('a')).toBe(100);
  });

  it('validate on unset and clear', () => {
    var error;
    var model = new Ostov.Model({name: 'One'});
    model.validate = function(attrs) {
      if (!attrs.name) {
        error = true;
        return 'No thanks.';
      }
    };
    model.set({name: 'Two'});
    expect(model.get('name')).toBe('Two');
    expect(error).toBe(undefined);
    model.unset('name', {validate: true});
    expect(error).toBe(true);
    expect(model.get('name')).toBe('Two');
    model.clear({validate: true});
    expect(model.get('name')).toBe('Two');
    delete model.validate;
    model.clear();
    expect(model.get('name')).toBe(undefined);
  });

  it('validate with error callback', () => {
    var lastError, boundError;
    var model = new Ostov.Model();
    model.validate = function(attrs) {
      if (attrs.admin) return "Can't change admin status.";
    };
    model.on('invalid', function(m, error) {
      boundError = true;
    });
    var result = model.set({a: 100}, {validate: true});
    expect(result).toBe(model);
    expect(model.get('a')).toBe(100);
    expect(model.validationError).toBe(null);
    expect(boundError).toBe(undefined);
    result = model.set({a: 200, admin: true}, {validate: true});
    expect(result).toBe(false);
    expect(model.get('a')).toBe(100);
    expect(model.validationError).toBe("Can't change admin status.");
    expect(boundError).toBe(true);
  });

  it('defaults always extend attrs (#459)', () => {
    class Defaulted extends Ostov.Model {
      initialize(attrs, opts) {
        expect(this.attributes.one).toBe(1);
      }
    }
    Defaulted.prototype.defaults = {one: 1};
    var providedattrs = new Defaulted({});
    var emptyattrs = new Defaulted();
  });

  it('Inherit class properties', () => {
    class Parent extends Ostov.Model {
      instancePropSame() {}
      instancePropDiff() {}
    }
    Parent.classProp = function() {};
    class Child extends Parent {
      instancePropDiff() {}
    }
    Child.classProp = Parent.classProp;

    var adult = new Parent;
    var kid   = new Child;

    expect(Child.classProp).toBe(Parent.classProp);
    expect(Child.classProp).not.toBe(undefined);

    expect(kid.instancePropSame).toBe(adult.instancePropSame);
    expect(kid.instancePropSame).not.toBe(undefined);

    expect(Child.prototype.instancePropDiff).not.toBe(Parent.prototype.instancePropDiff);
    expect(Child.prototype.instancePropDiff).not.toBe(undefined);
  });

  it("Nested change events don't clobber previous attributes", () => {
    new Ostov.Model()
    .on('change:state', function(m, newState) {
      expect(m.previous('state')).toBe(undefined);
      expect(newState).toBe('hello');
      // Fire a nested change event.
      m.set({other: 'whatever'});
    })
    .on('change:state', function(m, newState) {
      expect(m.previous('state')).toBe(undefined);
      expect(newState).toBe('hello');
    })
    .set({state: 'hello'});
  });

  it('hasChanged/set should use same comparison', () => {
    var changed = 0, model = new Ostov.Model({a: null});
    model.on('change', function() {
      expect(this.hasChanged('a')).toBeTruthy();
    })
    .on('change:a', function() {
      changed++;
    })
    .set({a: undefined});
    expect(changed).toBe(1);
  });

  it('#582, #425, change:attribute callbacks should fire after all changes have occurred', () => {
    var model = new Ostov.Model;

    var assertion = function() {
      expect(model.get('a')).toBe('a');
      expect(model.get('b')).toBe('b');
      expect(model.get('c')).toBe('c');
    };

    model.on('change:a', assertion);
    model.on('change:b', assertion);
    model.on('change:c', assertion);

    model.set({a: 'a', b: 'b', c: 'c'});
  });

  it('#871, set with attributes property', () => {
    var model = new Ostov.Model();
    model.set({attributes: true});
    expect(model.has('attributes')).toBeTruthy();
  });

  it('set value regardless of equality/change', () => {
    var model = new Ostov.Model({x: []});
    var a = [];
    model.set({x: a});
    expect(model.get('x') === a).toBeTruthy();
  });

  it('set same value does not trigger change', () => {
    var model = new Ostov.Model({x: 1});
    model.on('change change:x', function() { expect(false).toBeTruthy(); });
    model.set({x: 1});
    model.set({x: 1});
  });

  it('unset does not fire a change for undefined attributes', () => {
    var model = new Ostov.Model({x: undefined});
    model.on('change:x', function(){ expect(false).toBeTruthy(); });
    model.unset('x');
  });

  it('set: undefined values', () => {
    var model = new Ostov.Model({x: undefined});
    expect('x' in model.attributes).toBeTruthy();
  });

  it('hasChanged works outside of change events, and true within', () => {
    var model = new Ostov.Model({x: 1});
    model.on('change:x', function() {
      expect(model.hasChanged('x')).toBeTruthy();
      expect(model.get('x')).toBe(1);
    });
    model.set({x: 2}, {silent: true});
    expect(model.hasChanged()).toBeTruthy();
    expect(model.hasChanged('x')).toBe(true);
    model.set({x: 1});
    expect(model.hasChanged()).toBeTruthy();
    expect(model.hasChanged('x')).toBe(true);
  });

  it('hasChanged gets cleared on the following set', () => {
    var model = new Ostov.Model;
    model.set({x: 1});
    expect(model.hasChanged()).toBeTruthy();
    model.set({x: 1});
    expect(!model.hasChanged()).toBeTruthy();
    model.set({x: 2});
    expect(model.hasChanged()).toBeTruthy();
    model.set({});
    expect(!model.hasChanged()).toBeTruthy();
  });

  it('save with `wait` succeeds without `validate`', () => {
    var model = new Ostov.Model();
    model.url = '/test';
    model.save({x: 1}, {wait: true});
    expect(globalThis.env.syncArgs.model === model).toBeTruthy();
  });

  it("save without `wait` doesn't set invalid attributes", () => {
    var model = new Ostov.Model();
    model.validate = function() { return 1; };
    model.save({a: 1});
    expect(model.get('a')).toBe(void 0);
  });

  it("save doesn't validate twice", () => {
    var model = new Ostov.Model();
    var times = 0;
    model.sync = function() {};
    model.validate = function() { ++times; };
    model.save({});
    expect(times).toBe(1);
  });

  it('`hasChanged` for falsey keys', () => {
    var model = new Ostov.Model();
    model.set({x: true}, {silent: true});
    expect(!model.hasChanged(0)).toBeTruthy();
    expect(!model.hasChanged('')).toBeTruthy();
  });

  it('`previous` for falsey keys', () => {
    var model = new Ostov.Model({'0': true, '': true});
    model.set({'0': false, '': false}, {silent: true});
    expect(model.previous(0)).toBe(true);
    expect(model.previous('')).toBe(true);
  });

  it('`save` with `wait` sends correct attributes', () => {
    var changed = 0;
    var model = new Ostov.Model({x: 1, y: 2});
    model.url = '/test';
    model.on('change:x', function() { changed++; });
    model.save({x: 3}, {wait: true});
    expect(JSON.parse(globalThis.env.ajaxSettings.data)).toEqual({x: 3, y: 2});
    expect(model.get('x')).toBe(1);
    expect(changed).toBe(0);
    globalThis.env.syncArgs.options.success({});
    expect(model.get('x')).toBe(3);
    expect(changed).toBe(1);
  });

  it("a failed `save` with `wait` doesn't leave attributes behind", () => {
    var model = new Ostov.Model;
    model.url = '/test';
    model.save({x: 1}, {wait: true});
    expect(model.get('x')).toBe(void 0);
  });

  it('#1030 - `save` with `wait` results in correct attributes if success is called during sync', () => {
    var model = new Ostov.Model({x: 1, y: 2});
    model.sync = function(method, m, options) {
      options.success();
    };
    model.on('change:x', function() { expect(true).toBeTruthy(); });
    model.save({x: 3}, {wait: true});
    expect(model.get('x')).toBe(3);
  });

  it('save with wait validates attributes', () => {
    var model = new Ostov.Model();
    model.url = '/test';
    model.validate = function() { expect(true).toBeTruthy(); };
    model.save({x: 1}, {wait: true});
  });

  it('save turns on parse flag', () => {
    class Model extends Ostov.Model {
      sync(method, m, options) { expect(options.parse).toBeTruthy(); }
    }
    new Model().save();
  });

  it("nested `set` during `'change:attr'`", () => {
    var events = [];
    var model = new Ostov.Model();
    model.on('all', function(event) { events.push(event); });
    model.on('change', function() {
      model.set({z: true}, {silent: true});
    });
    model.on('change:x', function() {
      model.set({y: true});
    });
    model.set({x: true});
    expect(events).toEqual(['change:y', 'change:x', 'change']);
    events = [];
    model.set({z: true});
    expect(events).toEqual([]);
  });

  it('nested `change` only fires once', () => {
    var model = new Ostov.Model();
    model.on('change', function() {
      expect(true).toBeTruthy();
      model.set({x: true});
    });
    model.set({x: true});
  });

  it("nested `set` during `'change'`", () => {
    var count = 0;
    var model = new Ostov.Model();
    model.on('change', function() {
      switch (count++) {
        case 0:
          expect(this.changedAttributes()).toEqual({x: true});
          expect(model.previous('x')).toBe(undefined);
          model.set({y: true});
          break;
        case 1:
          expect(this.changedAttributes()).toEqual({x: true, y: true});
          expect(model.previous('x')).toBe(undefined);
          model.set({z: true});
          break;
        case 2:
          expect(this.changedAttributes()).toEqual({x: true, y: true, z: true});
          expect(model.previous('y')).toBe(undefined);
          break;
        default:
          expect(false).toBeTruthy();
      }
    });
    model.set({x: true});
  });

  it('nested `change` with silent', () => {
    var count = 0;
    var model = new Ostov.Model();
    model.on('change:y', function() { expect(false).toBeTruthy(); });
    model.on('change', function() {
      switch (count++) {
        case 0:
          expect(this.changedAttributes()).toEqual({x: true});
          model.set({y: true}, {silent: true});
          model.set({z: true});
          break;
        case 1:
          expect(this.changedAttributes()).toEqual({x: true, y: true, z: true});
          break;
        case 2:
          expect(this.changedAttributes()).toEqual({z: false});
          break;
        default:
          expect(false).toBeTruthy();
      }
    });
    model.set({x: true});
    model.set({z: false});
  });

  it('nested `change:attr` with silent', () => {
    var model = new Ostov.Model();
    model.on('change:y', function(){ expect(false).toBeTruthy(); });
    model.on('change', function() {
      model.set({y: true}, {silent: true});
      model.set({z: true});
    });
    model.set({x: true});
  });

  it('multiple nested changes with silent', () => {
    var model = new Ostov.Model();
    model.on('change:x', function() {
      model.set({y: 1}, {silent: true});
      model.set({y: 2});
    });
    model.on('change:y', function(m, val) {
      expect(val).toBe(2);
    });
    model.set({x: true});
  });

  it('multiple nested changes with silent', () => {
    var changes = [];
    var model = new Ostov.Model();
    model.on('change:b', function(m, val) { changes.push(val); });
    model.on('change', function() {
      model.set({b: 1});
    });
    model.set({b: 0});
    expect(changes).toEqual([0, 1]);
  });

  it('basic silent change semantics', () => {
    var model = new Ostov.Model;
    model.set({x: 1});
    model.on('change', function(){ expect(true).toBeTruthy(); });
    model.set({x: 2}, {silent: true});
    model.set({x: 1});
  });

  it('nested set multiple times', () => {
    var model = new Ostov.Model();
    model.on('change:b', function() {
      expect(true).toBeTruthy();
    });
    model.on('change:a', function() {
      model.set({b: true});
      model.set({b: true});
    });
    model.set({a: true});
  });

  it('#1122 - clear does not alter options.', () => {
    var model = new Ostov.Model();
    var options = {};
    model.clear(options);
    expect(!options.unset).toBeTruthy();
  });

  it('#1122 - unset does not alter options.', () => {
    var model = new Ostov.Model();
    var options = {};
    model.unset('x', options);
    expect(!options.unset).toBeTruthy();
  });

  it('#1355 - `options` is passed to success callbacks', () => {
    var model = new Ostov.Model();
    var opts = {
      success: function( m, resp, options ) {
        expect(options).toBeTruthy();
      }
    };
    model.sync = function(method, m, options) {
      options.success();
    };
    model.save({id: 1}, opts);
    model.fetch(opts);
    model.destroy(opts);
  });

  it("#1412 - Trigger 'sync' event.", () => {
    var model = new Ostov.Model({id: 1});
    model.sync = function(method, m, options) { options.success(); };
    model.on('sync', function(){ expect(true).toBeTruthy(); });
    model.fetch();
    model.save();
    model.destroy();
  });

  it('#1365 - Destroy: New models execute success callback.', () => {
    return new Promise((done) => {
      new Ostov.Model()
      .on('sync', function() { expect(false).toBeTruthy(); })
      .on('destroy', function(){ expect(true).toBeTruthy(); })
      .destroy({success: function(){
        expect(true).toBeTruthy();
        done();
      }});
    });
  });

  it('#1433 - Save: An invalid model cannot be persisted.', () => {
    var model = new Ostov.Model;
    model.validate = function(){ return 'invalid'; };
    model.sync = function(){ expect(false).toBeTruthy(); };
    expect(model.save()).toBe(false);
  });

  it("#1377 - Save without attrs triggers 'error'.", () => {
    class Model extends Ostov.Model {
      sync(method, m, options){ options.success(); }
      validate(){ return 'invalid'; }
    }
    Model.prototype.url = '/test/';
    var model = new Model({id: 1});
    model.on('invalid', function(){ expect(true).toBeTruthy(); });
    model.save();
  });

  it('#1545 - `undefined` can be passed to a model constructor without coersion', () => {
    class Model extends Ostov.Model {
      initialize(attrs, opts) {
        expect(attrs).toBe(undefined);
      }
    }
    Model.prototype.defaults = {one: 1};
    var emptyattrs = new Model();
    var undefinedattrs = new Model(undefined);
  });

  it('#1478 - Model `save` does not trigger change on unchanged attributes', () => {
    return new Promise((done) => {
      class Model extends Ostov.Model {
        sync(method, m, options) {
          setTimeout(function(){
            options.success();
            done();
          }, 0);
        }
      }
      new Model({x: true})
      .on('change:x', function(){ expect(false).toBeTruthy(); })
      .save(null, {wait: true});
    });
  });

  it('#1664 - Changing from one value, silently to another, back to original triggers a change.', () => {
    var model = new Ostov.Model({x: 1});
    model.on('change:x', function() { expect(true).toBeTruthy(); });
    model.set({x: 2}, {silent: true});
    model.set({x: 3}, {silent: true});
    model.set({x: 1});
  });

  it('#1664 - multiple silent changes nested inside a change event', () => {
    var changes = [];
    var model = new Ostov.Model();
    model.on('change', function() {
      model.set({a: 'c'}, {silent: true});
      model.set({b: 2}, {silent: true});
      model.unset('c', {silent: true});
    });
    model.on('change:a change:b change:c', function(m, val) { changes.push(val); });
    model.set({a: 'a', b: 1, c: 'item'});
    expect(changes).toEqual(['a', 1, 'item']);
    expect(model.attributes).toEqual({a: 'c', b: 2});
  });

  it('#1791 - `attributes` is available for `parse`', () => {
    class Model extends Ostov.Model {
      parse() { this.has('a'); } // shouldn't throw an error
    }
    var model = new Model(null, {parse: true});
  });

  it('silent changes in last `change` event back to original triggers change', () => {
    var changes = [];
    var model = new Ostov.Model();
    model.on('change:a change:b change:c', function(m, val) { changes.push(val); });
    model.on('change', function() {
      model.set({a: 'c'}, {silent: true});
    });
    model.set({a: 'a'});
    expect(changes).toEqual(['a']);
    model.set({a: 'a'});
    expect(changes).toEqual(['a', 'a']);
  });

  it('#1943 change calculations should use _.isEqual', () => {
    var model = new Ostov.Model({a: {key: 'value'}});
    model.set('a', {key: 'value'}, {silent: true});
    expect(model.changedAttributes()).toBe(false);
  });

  it('#1964 - final `change` event is always fired, regardless of interim changes', () => {
    var model = new Ostov.Model();
    model.on('change:property', function() {
      model.set('property', 'bar');
    });
    model.on('change', function() {
      expect(true).toBeTruthy();
    });
    model.set('property', 'foo');
  });

  it('isValid', () => {
    var model = new Ostov.Model({valid: true});
    model.validate = function(attrs) {
      if (!attrs.valid) return 'invalid';
    };
    expect(model.isValid()).toBe(true);
    expect(model.set({valid: false}, {validate: true})).toBe(false);
    expect(model.isValid()).toBe(true);
    model.set({valid: false});
    expect(model.isValid()).toBe(false);
    expect(!model.set('valid', false, {validate: true})).toBeTruthy();
  });

  it('mixin', () => {
    Ostov.Model.mixin({
      isEqual: function(model1, model2) {
        return _.isEqual(model1, model2.attributes);
      }
    });

    var model1 = new Ostov.Model({
      a: {b: 2}, c: 3
    });
    var model2 = new Ostov.Model({
      a: {b: 2}, c: 3
    });
    var model3 = new Ostov.Model({
      a: {b: 4}, c: 3
    });

    expect(model1.isEqual(model2)).toBe(true);
    expect(model1.isEqual(model3)).toBe(false);
  });


  it('#1179 - isValid returns true in the absence of validate.', () => {
    var model = new Ostov.Model();
    model.validate = null;
    expect(model.isValid()).toBeTruthy();
  });

  it('#1961 - Creating a model with {validate:true} will call validate and use the error callback', () => {
    class Model extends Ostov.Model {
      validate(attrs) {
        if (attrs.id === 1) return "This shouldn't happen";
      }
    }
    var model = new Model({id: 1}, {validate: true});
    expect(model.validationError).toBe("This shouldn't happen");
  });

  it('toJSON receives attrs during save(..., {wait: true})', () => {
    class Model extends Ostov.Model {
      toJSON() {
        expect(this.attributes.x).toBe(1);
        return _.clone(this.attributes);
      }
    }
    Model.prototype.url = '/test';
    var model = new Model;
    model.save({x: 1}, {wait: true});
  });

  it('#2034 - nested set with silent only triggers one change', () => {
    var model = new Ostov.Model();
    model.on('change', function() {
      model.set({b: true}, {silent: true});
      expect(true).toBeTruthy();
    });
    model.set({a: true});
  });

  it('#3778 - id will only be updated if it is set', () => {
    var model = new Ostov.Model({id: 1});
    model.id = 2;
    model.set({foo: 'bar'});
    expect(model.id).toBe(2);
    model.set({id: 3});
    expect(model.id).toBe(3);
  });

  it('#4289 - Trigger "changeId" need to be generate only if the content id change', () => {
    var model = new Ostov.Model({id: 1});
    model.idAttribute = 'id';
    model.on('changeId', function(m) {
      expect(m.get('id')).toBe(2);
    });
    model.set({id: 1});
    model.set({id: 2});
  });

});
