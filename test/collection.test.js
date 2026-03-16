import { describe, it, expect, beforeEach } from 'vitest';

var a, b, c, d, e, col, otherCol;

describe('Backbone.Collection', () => {

  beforeEach(() => {
    a         = new Backbone.Model({id: 3, label: 'a'});
    b         = new Backbone.Model({id: 2, label: 'b'});
    c         = new Backbone.Model({id: 1, label: 'c'});
    d         = new Backbone.Model({id: 0, label: 'd'});
    e         = null;
    col       = new Backbone.Collection([a, b, c, d]);
    otherCol  = new Backbone.Collection();
  });

  it('new and sort', () => {
    var counter = 0;
    col.on('sort', function(){ counter++; });
    expect(col.pluck('label')).toEqual(['a', 'b', 'c', 'd']);
    col.comparator = function(m1, m2) {
      return m1.id > m2.id ? -1 : 1;
    };
    col.sort();
    expect(counter).toBe(1);
    expect(col.pluck('label')).toEqual(['a', 'b', 'c', 'd']);
    col.comparator = function(model) { return model.id; };
    col.sort();
    expect(counter).toBe(2);
    expect(col.pluck('label')).toEqual(['d', 'c', 'b', 'a']);
    expect(col.length).toBe(4);
  });

  it('String comparator.', () => {
    var collection = new Backbone.Collection([
      {id: 3},
      {id: 1},
      {id: 2}
    ], {comparator: 'id'});
    expect(collection.pluck('id')).toEqual([1, 2, 3]);
  });

  it('new and parse', () => {
    class Collection extends Backbone.Collection {
      parse(data) {
        return _.filter(data, function(datum) {
          return datum.a % 2 === 0;
        });
      }
    }
    var models = [{a: 1}, {a: 2}, {a: 3}, {a: 4}];
    var collection = new Collection(models, {parse: true});
    expect(collection.length).toBe(2);
    expect(collection.first().get('a')).toBe(2);
    expect(collection.last().get('a')).toBe(4);
  });

  it('clone preserves model and comparator', () => {
    class Model extends Backbone.Model {}
    var comparator = function(model){ return model.id; };

    var collection = new Backbone.Collection([{id: 1}], {
      model: Model,
      comparator: comparator
    }).clone();
    collection.add({id: 2});
    expect(collection.at(0) instanceof Model).toBeTruthy();
    expect(collection.at(1) instanceof Model).toBeTruthy();
    expect(collection.comparator).toBe(comparator);
  });

  it('get', () => {
    expect(col.get(0)).toBe(d);
    expect(col.get(d.clone())).toBe(d);
    expect(col.get(2)).toBe(b);
    expect(col.get({id: 1})).toBe(c);
    expect(col.get(c.clone())).toBe(c);
    expect(col.get(col.first().cid)).toBe(col.first());
  });

  it('get with non-default ids', () => {
    class MongoModel extends Backbone.Model {}
    MongoModel.prototype.idAttribute = '_id';
    var model = new MongoModel({_id: 100});
    var collection = new Backbone.Collection([model], {model: MongoModel});
    expect(collection.get(100)).toBe(model);
    expect(collection.get(model.cid)).toBe(model);
    expect(collection.get(model)).toBe(model);
    expect(collection.get(101)).toBe(void 0);

    var collection2 = new Backbone.Collection();
    collection2.model = MongoModel;
    collection2.add(model.attributes);
    expect(collection2.get(model.clone())).toBe(collection2.first());
  });

  it('has', () => {
    expect(col.has(a)).toBeTruthy();
    expect(col.has(b)).toBeTruthy();
    expect(col.has(c)).toBeTruthy();
    expect(col.has(d)).toBeTruthy();
    expect(col.has(a.id)).toBeTruthy();
    expect(col.has(b.id)).toBeTruthy();
    expect(col.has(c.id)).toBeTruthy();
    expect(col.has(d.id)).toBeTruthy();
    expect(col.has(a.cid)).toBeTruthy();
    expect(col.has(b.cid)).toBeTruthy();
    expect(col.has(c.cid)).toBeTruthy();
    expect(col.has(d.cid)).toBeTruthy();
    var outsider = new Backbone.Model({id: 4});
    expect(col.has(outsider)).toBeFalsy();
    expect(col.has(outsider.id)).toBeFalsy();
    expect(col.has(outsider.cid)).toBeFalsy();
  });

  it('update index when id changes', () => {
    var collection = new Backbone.Collection();
    collection.add([
      {id: 0, name: 'one'},
      {id: 1, name: 'two'}
    ]);
    var one = collection.get(0);
    expect(one.get('name')).toBe('one');
    collection.on('change:name', function(model) {
      expect(this.get(model)).toBeTruthy();
      expect(model).toBe(this.get(101));
      expect(this.get(0)).toBeUndefined();
    });
    one.set({name: 'dalmatians', id: 101});
    expect(collection.get(0)).toBeUndefined();
    expect(collection.get(101).get('name')).toBe('dalmatians');
  });

  it('at', () => {
    expect(col.at(2)).toBe(c);
    expect(col.at(-2)).toBe(c);
  });

  it('pluck', () => {
    expect(col.pluck('label').join(' ')).toBe('a b c d');
  });

  it('add', () => {
    var added, opts, secondAdded;
    added = opts = secondAdded = null;
    e = new Backbone.Model({id: 10, label: 'e'});
    otherCol.add(e);
    otherCol.on('add', function() {
      secondAdded = true;
    });
    col.on('add', function(model, collection, options){
      added = model.get('label');
      opts = options;
    });
    col.add(e, {amazing: true});
    expect(added).toBe('e');
    expect(col.length).toBe(5);
    expect(col.last()).toBe(e);
    expect(otherCol.length).toBe(1);
    expect(secondAdded).toBeNull();
    expect(opts.amazing).toBeTruthy();

    var f = new Backbone.Model({id: 20, label: 'f'});
    var g = new Backbone.Model({id: 21, label: 'g'});
    var h = new Backbone.Model({id: 22, label: 'h'});
    var atCol = new Backbone.Collection([f, g, h]);
    expect(atCol.length).toBe(3);
    atCol.add(e, {at: 1});
    expect(atCol.length).toBe(4);
    expect(atCol.at(1)).toBe(e);
    expect(atCol.last()).toBe(h);

    var coll = new Backbone.Collection(new Array(2));
    var addCount = 0;
    coll.on('add', function(){
      addCount += 1;
    });
    coll.add([undefined, f, g]);
    expect(coll.length).toBe(5);
    expect(addCount).toBe(3);
    coll.add(new Array(4));
    expect(coll.length).toBe(9);
    expect(addCount).toBe(7);
  });

  it('add multiple models', () => {
    var collection = new Backbone.Collection([{at: 0}, {at: 1}, {at: 9}]);
    collection.add([{at: 2}, {at: 3}, {at: 4}, {at: 5}, {at: 6}, {at: 7}, {at: 8}], {at: 2});
    for (var i = 0; i <= 5; i++) {
      expect(collection.at(i).get('at')).toBe(i);
    }
  });

  it('add; at should have preference over comparator', () => {
    class Col extends Backbone.Collection {
      comparator(m1, m2) {
        return m1.id > m2.id ? -1 : 1;
      }
    }

    var collection = new Col([{id: 2}, {id: 3}]);
    collection.add(new Backbone.Model({id: 1}), {at: 1});

    expect(collection.pluck('id').join(' ')).toBe('3 1 2');
  });

  it('add; at should add to the end if the index is out of bounds', () => {
    var collection = new Backbone.Collection([{id: 2}, {id: 3}]);
    collection.add(new Backbone.Model({id: 1}), {at: 5});

    expect(collection.pluck('id').join(' ')).toBe('2 3 1');
  });

  it("can't add model to collection twice", () => {
    var collection = new Backbone.Collection([{id: 1}, {id: 2}, {id: 1}, {id: 2}, {id: 3}]);
    expect(collection.pluck('id').join(' ')).toBe('1 2 3');
  });

  it("can't add different model with same id to collection twice", () => {
    var collection = new Backbone.Collection;
    collection.unshift({id: 101});
    collection.add({id: 101});
    expect(collection.length).toBe(1);
  });

  it('merge in duplicate models with {merge: true}', () => {
    var collection = new Backbone.Collection;
    collection.add([{id: 1, name: 'Moe'}, {id: 2, name: 'Curly'}, {id: 3, name: 'Larry'}]);
    collection.add({id: 1, name: 'Moses'});
    expect(collection.first().get('name')).toBe('Moe');
    collection.add({id: 1, name: 'Moses'}, {merge: true});
    expect(collection.first().get('name')).toBe('Moses');
    collection.add({id: 1, name: 'Tim'}, {merge: true, silent: true});
    expect(collection.first().get('name')).toBe('Tim');
  });

  it('add model to multiple collections', () => {
    var counter = 0;
    var m = new Backbone.Model({id: 10, label: 'm'});
    m.on('add', function(model, collection) {
      counter++;
      expect(m).toBe(model);
      if (counter > 1) {
        expect(collection).toBe(col2);
      } else {
        expect(collection).toBe(col1);
      }
    });
    var col1 = new Backbone.Collection([]);
    col1.on('add', function(model, collection) {
      expect(m).toBe(model);
      expect(col1).toBe(collection);
    });
    var col2 = new Backbone.Collection([]);
    col2.on('add', function(model, collection) {
      expect(m).toBe(model);
      expect(col2).toBe(collection);
    });
    col1.add(m);
    expect(m.collection).toBe(col1);
    col2.add(m);
    expect(m.collection).toBe(col1);
  });

  it('add model with parse', () => {
    class Model extends Backbone.Model {
      parse(obj) {
        obj.value += 1;
        return obj;
      }
    }

    class Col extends Backbone.Collection {}
    Col.prototype.model = Model;
    var collection = new Col;
    collection.add({value: 1}, {parse: true});
    expect(collection.at(0).get('value')).toBe(2);
  });

  it('add with parse and merge', () => {
    var collection = new Backbone.Collection();
    collection.parse = function(attrs) {
      return _.map(attrs, function(model) {
        if (model.model) return model.model;
        return model;
      });
    };
    collection.add({id: 1});
    collection.add({model: {id: 1, name: 'Alf'}}, {parse: true, merge: true});
    expect(collection.first().get('name')).toBe('Alf');
  });

  it('add model to collection with sort()-style comparator', () => {
    var collection = new Backbone.Collection;
    collection.comparator = function(m1, m2) {
      return m1.get('name') < m2.get('name') ? -1 : 1;
    };
    var tom = new Backbone.Model({name: 'Tom'});
    var rob = new Backbone.Model({name: 'Rob'});
    var tim = new Backbone.Model({name: 'Tim'});
    collection.add(tom);
    collection.add(rob);
    collection.add(tim);
    expect(collection.indexOf(rob)).toBe(0);
    expect(collection.indexOf(tim)).toBe(1);
    expect(collection.indexOf(tom)).toBe(2);
  });

  it('comparator that depends on `this`', () => {
    var collection = new Backbone.Collection;
    collection.negative = function(num) {
      return -num;
    };
    collection.comparator = function(model) {
      return this.negative(model.id);
    };
    collection.add([{id: 1}, {id: 2}, {id: 3}]);
    expect(collection.pluck('id')).toEqual([3, 2, 1]);
    collection.comparator = function(m1, m2) {
      return this.negative(m2.id) - this.negative(m1.id);
    };
    collection.sort();
    expect(collection.pluck('id')).toEqual([1, 2, 3]);
  });

  it('remove', () => {
    var removed = null;
    var result = null;
    col.on('remove', function(model, collection, options) {
      removed = model.get('label');
      expect(options.index).toBe(3);
      expect(collection.get(model)).toBe(undefined);
    });
    result = col.remove(d);
    expect(removed).toBe('d');
    expect(result).toBe(d);
    //if we try to remove d again, it's not going to actually get removed
    result = col.remove(d);
    expect(result).toBe(undefined);
    expect(col.length).toBe(3);
    expect(col.first()).toBe(a);
    col.off();
    result = col.remove([c, d]);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(c);
    result = col.remove([c, b]);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(b);
    result = col.remove([]);
    expect(result).toEqual([]);
  });

  it('add and remove return values', () => {
    class Even extends Backbone.Model {
      validate(attrs) {
        if (attrs.id % 2 !== 0) return 'odd';
      }
    }
    var collection = new Backbone.Collection;
    collection.model = Even;

    var list = collection.add([{id: 2}, {id: 4}], {validate: true});
    expect(list.length).toBe(2);
    expect(list[0] instanceof Backbone.Model).toBeTruthy();
    expect(list[1]).toBe(collection.last());
    expect(list[1].get('id')).toBe(4);

    list = collection.add([{id: 3}, {id: 6}], {validate: true});
    expect(collection.length).toBe(3);
    expect(list[0]).toBe(false);
    expect(list[1].get('id')).toBe(6);

    var result = collection.add({id: 6});
    expect(result.cid).toBe(list[1].cid);

    result = collection.remove({id: 6});
    expect(collection.length).toBe(2);
    expect(result.id).toBe(6);

    list = collection.remove([{id: 2}, {id: 8}]);
    expect(collection.length).toBe(1);
    expect(list[0].get('id')).toBe(2);
    expect(list[1]).toBeUndefined();
  });

  it('shift and pop', () => {
    var collection = new Backbone.Collection([{a: 'a'}, {b: 'b'}, {c: 'c'}]);
    expect(collection.shift().get('a')).toBe('a');
    expect(collection.pop().get('c')).toBe('c');
  });

  it('slice', () => {
    var collection = new Backbone.Collection([{a: 'a'}, {b: 'b'}, {c: 'c'}]);
    var array = collection.slice(1, 3);
    expect(array.length).toBe(2);
    expect(array[0].get('b')).toBe('b');
  });

  it('events are unbound on remove', () => {
    var counter = 0;
    var dj = new Backbone.Model();
    var emcees = new Backbone.Collection([dj]);
    emcees.on('change', function(){ counter++; });
    dj.set({name: 'Kool'});
    expect(counter).toBe(1);
    emcees.reset([]);
    expect(dj.collection).toBe(undefined);
    dj.set({name: 'Shadow'});
    expect(counter).toBe(1);
  });

  it('remove in multiple collections', () => {
    var modelData = {
      id: 5,
      title: 'Othello'
    };
    var passed = false;
    var m1 = new Backbone.Model(modelData);
    var m2 = new Backbone.Model(modelData);
    m2.on('remove', function() {
      passed = true;
    });
    var col1 = new Backbone.Collection([m1]);
    var col2 = new Backbone.Collection([m2]);
    expect(m1).not.toBe(m2);
    expect(col1.length === 1).toBeTruthy();
    expect(col2.length === 1).toBeTruthy();
    col1.remove(m1);
    expect(passed).toBe(false);
    expect(col1.length === 0).toBeTruthy();
    col2.remove(m1);
    expect(col2.length === 0).toBeTruthy();
    expect(passed).toBe(true);
  });

  it('remove same model in multiple collection', () => {
    var counter = 0;
    var m = new Backbone.Model({id: 5, title: 'Othello'});
    m.on('remove', function(model, collection) {
      counter++;
      expect(m).toBe(model);
      if (counter > 1) {
        expect(collection).toBe(col1);
      } else {
        expect(collection).toBe(col2);
      }
    });
    var col1 = new Backbone.Collection([m]);
    col1.on('remove', function(model, collection) {
      expect(m).toBe(model);
      expect(col1).toBe(collection);
    });
    var col2 = new Backbone.Collection([m]);
    col2.on('remove', function(model, collection) {
      expect(m).toBe(model);
      expect(col2).toBe(collection);
    });
    expect(col1).toBe(m.collection);
    col2.remove(m);
    expect(col2.length === 0).toBeTruthy();
    expect(col1.length === 1).toBeTruthy();
    expect(counter).toBe(1);
    expect(col1).toBe(m.collection);
    col1.remove(m);
    expect(m.collection).toBeUndefined();
    expect(col1.length === 0).toBeTruthy();
    expect(counter).toBe(2);
  });

  it('model destroy removes from all collections', () => {
    var m = new Backbone.Model({id: 5, title: 'Othello'});
    m.sync = function(method, model, options) { options.success(); };
    var col1 = new Backbone.Collection([m]);
    var col2 = new Backbone.Collection([m]);
    m.destroy();
    expect(col1.length === 0).toBeTruthy();
    expect(col2.length === 0).toBeTruthy();
    expect(undefined).toBe(m.collection);
  });

  it('Collection: non-persisted model destroy removes from all collections', () => {
    var m = new Backbone.Model({title: 'Othello'});
    m.sync = function(method, model, options) { throw 'should not be called'; };
    var col1 = new Backbone.Collection([m]);
    var col2 = new Backbone.Collection([m]);
    m.destroy();
    expect(col1.length === 0).toBeTruthy();
    expect(col2.length === 0).toBeTruthy();
    expect(undefined).toBe(m.collection);
  });

  it('fetch', () => {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    collection.fetch();
    expect(globalThis.env.syncArgs.method).toBe('read');
    expect(globalThis.env.syncArgs.model).toBe(collection);
    expect(globalThis.env.syncArgs.options.parse).toBe(true);

    collection.fetch({parse: false});
    expect(globalThis.env.syncArgs.options.parse).toBe(false);
  });

  it('fetch with an error response triggers an error event', () => {
    var collection = new Backbone.Collection();
    collection.on('error', function() {
      expect(true).toBeTruthy();
    });
    collection.sync = function(method, model, options) { options.error(); };
    collection.fetch();
  });

  it('#3283 - fetch with an error response calls error with context', () => {
    var collection = new Backbone.Collection();
    var obj = {};
    var options = {
      context: obj,
      error: function() {
        expect(this).toBe(obj);
      }
    };
    collection.sync = function(method, model, opts) {
      opts.error.call(opts.context);
    };
    collection.fetch(options);
  });

  it('ensure fetch only parses once', () => {
    var collection = new Backbone.Collection;
    var counter = 0;
    collection.parse = function(models) {
      counter++;
      return models;
    };
    collection.url = '/test';
    collection.fetch();
    globalThis.env.syncArgs.options.success([]);
    expect(counter).toBe(1);
  });

  it('create', () => {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    var model = collection.create({label: 'f'}, {wait: true});
    expect(globalThis.env.syncArgs.method).toBe('create');
    expect(globalThis.env.syncArgs.model).toBe(model);
    expect(model.get('label')).toBe('f');
    expect(model.collection).toBe(collection);
  });

  it('create with validate:true enforces validation', () => {
    class ValidatingModel extends Backbone.Model {
      validate(attrs) {
        return 'fail';
      }
    }
    class ValidatingCollection extends Backbone.Collection {}
    ValidatingCollection.prototype.model = ValidatingModel;
    var collection = new ValidatingCollection();
    collection.on('invalid', function(coll, error, options) {
      expect(error).toBe('fail');
      expect(options.validationError).toBe('fail');
    });
    expect(collection.create({foo: 'bar'}, {validate: true})).toBe(false);
  });

  it('create will pass extra options to success callback', () => {
    class Model extends Backbone.Model {
      sync(method, model, options) {
        _.extend(options, {specialSync: true});
        return Backbone.Model.prototype.sync.call(this, method, model, options);
      }
    }

    class Collection extends Backbone.Collection {}
    Collection.prototype.model = Model;
    Collection.prototype.url = '/test';

    var collection = new Collection;

    var success = function(model, response, options) {
      expect(options.specialSync).toBeTruthy();
    };

    collection.create({}, {success: success});
    globalThis.env.ajaxSettings.success();
  });

  it('create with wait:true should not call collection.parse', () => {
    class Collection extends Backbone.Collection {
      parse() {
        expect(false).toBeTruthy();
      }
    }
    Collection.prototype.url = '/test';

    var collection = new Collection;

    collection.create({}, {wait: true});
    globalThis.env.ajaxSettings.success();
  });

  it('a failing create returns model with errors', () => {
    class ValidatingModel extends Backbone.Model {
      validate(attrs) {
        return 'fail';
      }
    }
    class ValidatingCollection extends Backbone.Collection {}
    ValidatingCollection.prototype.model = ValidatingModel;
    var collection = new ValidatingCollection();
    var m = collection.create({foo: 'bar'});
    expect(m.validationError).toBe('fail');
    expect(collection.length).toBe(1);
  });

  it('failing create with wait:true triggers error event (#4262)', () => {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    collection.on('error', function() { expect(true).toBeTruthy(); });
    var model = collection.create({id: '1'}, {wait: true});
    model.on('error', function() { expect(true).toBeTruthy(); });
    globalThis.env.ajaxSettings.error();
  });

  it('successful create with wait:true triggers success event (#4262)', () => {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    collection.on('sync', function() { expect(true).toBeTruthy(); });
    var model = collection.create({id: '1'}, {wait: true});
    model.on('sync', function() { expect(true).toBeTruthy(); });
    globalThis.env.ajaxSettings.success();
  });

  it('successful create with wait:true drops special error listener (#4284)', () => {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    collection.on('error', function() { expect(true).toBeTruthy(); });
    var model = collection.create({id: '1'}, {wait: true});
    globalThis.env.ajaxSettings.success();
    model.trigger('error');
  });

  it('failing create pre-existing with wait:true triggers once (#4262)', () => {
    var model = new Backbone.Model;
    var collection = new Backbone.Collection([model]);
    collection.url = '/test';
    collection.on('error', function() { expect(true).toBeTruthy(); });
    collection.create(model, {wait: true});
    globalThis.env.ajaxSettings.error();
  });

  it('successful create pre-existing with wait:true preserves other error bindings (#4262)', () => {
    var model = new Backbone.Model;
    var collection = new Backbone.Collection([model]);
    collection.url = '/test';
    model.on('error', function() { expect(true).toBeTruthy(); });
    collection.create(model, {wait: true});
    globalThis.env.ajaxSettings.success();
    model.trigger('error');
  });

  it('initialize', () => {
    class Collection extends Backbone.Collection {
      initialize() {
        this.one = 1;
      }
    }
    var coll = new Collection;
    expect(coll.one).toBe(1);
  });

  it('preinitialize', () => {
    class Collection extends Backbone.Collection {
      preinitialize() {
        this.one = 1;
      }
    }
    var coll = new Collection;
    expect(coll.one).toBe(1);
  });

  it('preinitialize occurs before the collection is set up', () => {
    class Collection extends Backbone.Collection {
      preinitialize() {
        expect(this.model).not.toBe(FooModel);
      }
    }
    class FooModel extends Backbone.Model {}
    FooModel.prototype.id = 'foo';
    var coll = new Collection({}, {
      model: FooModel
    });
    expect(coll.model).toBe(FooModel);
  });

  it('toJSON', () => {
    expect(JSON.stringify(col)).toBe('[{"id":3,"label":"a"},{"id":2,"label":"b"},{"id":1,"label":"c"},{"id":0,"label":"d"}]');
  });

  it('where and findWhere', () => {
    var model = new Backbone.Model({a: 1});
    var coll = new Backbone.Collection([
      model,
      {a: 1},
      {a: 1, b: 2},
      {a: 2, b: 2},
      {a: 3}
    ]);
    expect(coll.where({a: 1}).length).toBe(3);
    expect(coll.where({a: 2}).length).toBe(1);
    expect(coll.where({a: 3}).length).toBe(1);
    expect(coll.where({b: 1}).length).toBe(0);
    expect(coll.where({b: 2}).length).toBe(2);
    expect(coll.where({a: 1, b: 2}).length).toBe(1);
    expect(coll.findWhere({a: 1})).toBe(model);
    expect(coll.findWhere({a: 4})).toBe(void 0);
  });

  it('mixin', () => {
    Backbone.Collection.mixin({
      sum: function(models, iteratee) {
        return _.reduce(models, function(s, m) {
          return s + iteratee(m);
        }, 0);
      }
    });

    var coll = new Backbone.Collection([
      {a: 1},
      {a: 1, b: 2},
      {a: 2, b: 2},
      {a: 3}
    ]);

    expect(coll.sum(function(m) {
      return m.get('a');
    })).toBe(7);
  });

  it('Underscore methods', () => {
    expect(col.map(function(model){ return model.get('label'); }).join(' ')).toBe('a b c d');
    expect(col.some(function(model){ return model.id === 100; })).toBe(false);
    expect(col.some(function(model){ return model.id === 0; })).toBe(true);
    expect(col.reduce(function(m1, m2) {return m1.id > m2.id ? m1 : m2;}).id).toBe(3);
    expect(col.reduceRight(function(m1, m2) {return m1.id > m2.id ? m1 : m2;}).id).toBe(3);
    expect(col.indexOf(b)).toBe(1);
    expect(col.size()).toBe(4);
    expect(col.rest().length).toBe(3);
    expect(!_.includes(col.rest(), a)).toBeTruthy();
    expect(_.includes(col.rest(), d)).toBeTruthy();
    expect(!col.isEmpty()).toBeTruthy();
    expect(!_.includes(col.without(d), d)).toBeTruthy();

    var wrapped = col.chain();
    expect(wrapped.map('id').max().value()).toBe(3);
    expect(wrapped.map('id').min().value()).toBe(0);
    expect(
      wrapped
      .filter(function(o){ return o.id % 2 === 0; })
      .map(function(o){ return o.id * 2; })
      .value()
    ).toEqual([4, 0]);
    expect(col.difference([c, d])).toEqual([a, b]);
    expect(col.includes(col.sample())).toBeTruthy();

    var first = col.first();
    expect(col.groupBy(function(model){ return model.id; })[first.id]).toEqual([first]);
    expect(col.countBy(function(model){ return model.id; })).toEqual({0: 1, 1: 1, 2: 1, 3: 1});
    expect(col.sortBy(function(model){ return model.id; })[0]).toEqual(col.at(3));
    expect(col.indexBy('id')[first.id] === first).toBeTruthy();
  });

  it('Underscore methods with object-style and property-style iteratee', () => {
    var model = new Backbone.Model({a: 4, b: 1, e: 3});
    var coll = new Backbone.Collection([
      {a: 1, b: 1},
      {a: 2, b: 1, c: 1},
      {a: 3, b: 1},
      model
    ]);
    expect(coll.find({a: 0})).toBe(undefined);
    expect(coll.find({a: 4})).toEqual(model);
    expect(coll.find('d')).toBe(undefined);
    expect(coll.find('e')).toEqual(model);
    expect(coll.filter({a: 0})).toEqual([]);
    expect(coll.filter({a: 4})).toEqual([model]);
    expect(coll.some({a: 0})).toBe(false);
    expect(coll.some({a: 1})).toBe(true);
    expect(coll.reject({a: 0}).length).toBe(4);
    expect(coll.reject({a: 4})).toEqual(_.without(coll.models, model));
    expect(coll.every({a: 0})).toBe(false);
    expect(coll.every({b: 1})).toBe(true);
    expect(coll.partition({a: 0})[0]).toEqual([]);
    expect(coll.partition({a: 0})[1]).toEqual(coll.models);
    expect(coll.partition({a: 4})[0]).toEqual([model]);
    expect(coll.partition({a: 4})[1]).toEqual(_.without(coll.models, model));
    expect(coll.map({a: 2})).toEqual([false, true, false, false]);
    expect(coll.map('a')).toEqual([1, 2, 3, 4]);
    expect(coll.sortBy('a')[3]).toEqual(model);
    expect(coll.sortBy('e')[0]).toEqual(model);
    expect(coll.countBy({a: 4})).toEqual({'false': 3, 'true': 1});
    expect(coll.countBy('d')).toEqual({undefined: 4});
    expect(coll.findIndex({b: 1})).toBe(0);
    expect(coll.findIndex({b: 9})).toBe(-1);
    expect(coll.findLastIndex({b: 1})).toBe(3);
    expect(coll.findLastIndex({b: 9})).toBe(-1);
  });

  it('reset', () => {
    var resetCount = 0;
    var models = col.models;
    col.on('reset', function() { resetCount += 1; });
    col.reset([]);
    expect(resetCount).toBe(1);
    expect(col.length).toBe(0);
    expect(col.last()).toBeUndefined();
    col.reset(models);
    expect(resetCount).toBe(2);
    expect(col.length).toBe(4);
    expect(col.last()).toBe(d);
    col.reset(_.map(models, function(m){ return m.attributes; }));
    expect(resetCount).toBe(3);
    expect(col.length).toBe(4);
    expect(col.last() !== d).toBeTruthy();
    expect(_.isEqual(col.last().attributes, d.attributes)).toBeTruthy();
    col.reset();
    expect(col.length).toBe(0);
    expect(resetCount).toBe(4);

    var f = new Backbone.Model({id: 20, label: 'f'});
    col.reset([undefined, f]);
    expect(col.length).toBe(2);
    expect(resetCount).toBe(5);

    col.reset(new Array(4));
    expect(col.length).toBe(4);
    expect(resetCount).toBe(6);
  });

  it('reset with different values', () => {
    var collection = new Backbone.Collection({id: 1});
    collection.reset({id: 1, a: 1});
    expect(collection.get(1).get('a')).toBe(1);
  });

  it('same references in reset', () => {
    var model = new Backbone.Model({id: 1});
    var collection = new Backbone.Collection({id: 1});
    collection.reset(model);
    expect(collection.get(1)).toBe(model);
  });

  it('reset passes caller options', () => {
    class Model extends Backbone.Model {
      initialize(attrs, options) {
        this.modelParameter = options.modelParameter;
      }
    }
    class _ResetCollection extends Backbone.Collection {}
    _ResetCollection.prototype.model = Model;
    var collection = new _ResetCollection();
    collection.reset([{astring: 'green', anumber: 1}, {astring: 'blue', anumber: 2}], {modelParameter: 'model parameter'});
    expect(collection.length).toBe(2);
    collection.each(function(model) {
      expect(model.modelParameter).toBe('model parameter');
    });
  });

  it('reset does not alter options by reference', () => {
    var collection = new Backbone.Collection([{id: 1}]);
    var origOpts = {};
    collection.on('reset', function(coll, opts){
      expect(origOpts.previousModels).toBe(undefined);
      expect(opts.previousModels[0].id).toBe(1);
    });
    collection.reset([], origOpts);
  });

  it('trigger custom events on models', () => {
    var fired = null;
    a.on('custom', function() { fired = true; });
    a.trigger('custom');
    expect(fired).toBe(true);
  });

  it('add does not alter arguments', () => {
    var attrs = {};
    var models = [attrs];
    new Backbone.Collection().add(models);
    expect(models.length).toBe(1);
    expect(attrs === models[0]).toBeTruthy();
  });

  it('#714: access `model.collection` in a brand new model.', () => {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    class Model extends Backbone.Model {
      set(attrs) {
        expect(attrs.prop).toBe('value');
        expect(this.collection).toBe(collection);
        return this;
      }
    }
    collection.model = Model;
    collection.create({prop: 'value'});
  });

  it('#574, remove its own reference to the .models array.', () => {
    var collection = new Backbone.Collection([
      {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}
    ]);
    expect(collection.length).toBe(6);
    collection.remove(collection.models);
    expect(collection.length).toBe(0);
  });

  it('#861, adding models to a collection which do not pass validation, with validate:true', () => {
    class Model extends Backbone.Model {
      validate(attrs) {
        if (attrs.id === 3) return "id can't be 3";
      }
    }

    class Collection extends Backbone.Collection {}
    Collection.prototype.model = Model;

    var collection = new Collection;
    collection.on('invalid', function() { expect(true).toBeTruthy(); });

    collection.add([{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}], {validate: true});
    expect(collection.pluck('id')).toEqual([1, 2, 4, 5, 6]);
  });

  it('Invalid models are discarded with validate:true.', () => {
    var collection = new Backbone.Collection;
    collection.on('test', function() { expect(true).toBeTruthy(); });
    class _InvalidModel extends Backbone.Model {
      validate(attrs){ if (!attrs.valid) return 'invalid'; }
    }
    collection.model = _InvalidModel;
    var model = new collection.model({id: 1, valid: true});
    collection.add([model, {id: 2}], {validate: true});
    model.trigger('test');
    expect(collection.get(model.cid)).toBeTruthy();
    expect(collection.get(1)).toBeTruthy();
    expect(!collection.get(2)).toBeTruthy();
    expect(collection.length).toBe(1);
  });

  it('multiple copies of the same model', () => {
    var collection = new Backbone.Collection();
    var model = new Backbone.Model();
    collection.add([model, model]);
    expect(collection.length).toBe(1);
    collection.add([{id: 1}, {id: 1}]);
    expect(collection.length).toBe(2);
    expect(collection.last().id).toBe(1);
  });

  it('#964 - collection.get return inconsistent', () => {
    var collection = new Backbone.Collection();
    expect(collection.get(null) === undefined).toBeTruthy();
    expect(collection.get() === undefined).toBeTruthy();
  });

  it('#1112 - passing options.model sets collection.model', () => {
    class Model extends Backbone.Model {}
    var collection = new Backbone.Collection([{id: 1}], {model: Model});
    expect(collection.model === Model).toBeTruthy();
    expect(collection.at(0) instanceof Model).toBeTruthy();
  });

  it('null and undefined are invalid ids.', () => {
    var model = new Backbone.Model({id: 1});
    var collection = new Backbone.Collection([model]);
    model.set({id: null});
    expect(!collection.get('null')).toBeTruthy();
    model.set({id: 1});
    model.set({id: undefined});
    expect(!collection.get('undefined')).toBeTruthy();
  });

  it('falsy comparator', () => {
    class Col extends Backbone.Collection {
      comparator(model){ return model.id; }
    }
    var collection = new Col();
    var colFalse = new Col(null, {comparator: false});
    var colNull = new Col(null, {comparator: null});
    var colUndefined = new Col(null, {comparator: undefined});
    expect(collection.comparator).toBeTruthy();
    expect(!colFalse.comparator).toBeTruthy();
    expect(!colNull.comparator).toBeTruthy();
    expect(colUndefined.comparator).toBeTruthy();
  });

  it('#1355 - `options` is passed to success callbacks', () => {
    var m = new Backbone.Model({x: 1});
    var collection = new Backbone.Collection();
    var opts = {
      opts: true,
      success: function(coll, resp, options) {
        expect(options.opts).toBeTruthy();
      }
    };
    collection.sync = m.sync = function( method, coll, options ){
      options.success({});
    };
    collection.fetch(opts);
    collection.create(m, opts);
  });

  it("#1412 - Trigger 'request' and 'sync' events.", () => {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    Backbone.ajax = function(settings){ settings.success(); };

    collection.on('request', function(obj, xhr, options) {
      expect(obj === collection).toBeTruthy();
    });
    collection.on('sync', function(obj, response, options) {
      expect(obj === collection).toBeTruthy();
    });
    collection.fetch();
    collection.off();

    collection.on('request', function(obj, xhr, options) {
      expect(obj === collection.get(1)).toBeTruthy();
    });
    collection.on('sync', function(obj, response, options) {
      expect(obj === collection.get(1)).toBeTruthy();
    });
    collection.create({id: 1});
    collection.off();
  });

  it('#3283 - fetch, create calls success with context', () => {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    Backbone.ajax = function(settings) {
      settings.success.call(settings.context);
    };
    var obj = {};
    var options = {
      context: obj,
      success: function() {
        expect(this).toBe(obj);
      }
    };

    collection.fetch(options);
    collection.create({id: 1}, options);
  });

  it('#1447 - create with wait adds model.', () => {
    var collection = new Backbone.Collection;
    var model = new Backbone.Model;
    model.sync = function(method, m, options){ options.success(); };
    collection.on('add', function(){ expect(true).toBeTruthy(); });
    collection.create(model, {wait: true});
  });

  it('#1448 - add sorts collection after merge.', () => {
    var collection = new Backbone.Collection([
      {id: 1, x: 1},
      {id: 2, x: 2}
    ]);
    collection.comparator = function(model){ return model.get('x'); };
    collection.add({id: 1, x: 3}, {merge: true});
    expect(collection.pluck('id')).toEqual([2, 1]);
  });

  it('#1655 - groupBy can be used with a string argument.', () => {
    var collection = new Backbone.Collection([{x: 1}, {x: 2}]);
    var grouped = collection.groupBy('x');
    expect(_.keys(grouped).length).toBe(2);
    expect(grouped[1][0].get('x')).toBe(1);
    expect(grouped[2][0].get('x')).toBe(2);
  });

  it('#1655 - sortBy can be used with a string argument.', () => {
    var collection = new Backbone.Collection([{x: 3}, {x: 1}, {x: 2}]);
    var values = _.map(collection.sortBy('x'), function(model) {
      return model.get('x');
    });
    expect(values).toEqual([1, 2, 3]);
  });

  it('#1604 - Removal during iteration.', () => {
    var collection = new Backbone.Collection([{}, {}]);
    collection.on('add', function() {
      collection.at(0).destroy();
    });
    collection.add({}, {at: 0});
  });

  it('#1638 - `sort` during `add` triggers correctly.', () => {
    var collection = new Backbone.Collection;
    collection.comparator = function(model) { return model.get('x'); };
    var added = [];
    collection.on('add', function(model) {
      model.set({x: 3});
      collection.sort();
      added.push(model.id);
    });
    collection.add([{id: 1, x: 1}, {id: 2, x: 2}]);
    expect(added).toEqual([1, 2]);
  });

  it('fetch parses models by default', () => {
    var model = {};
    class _FetchParsesModel extends Backbone.Model {
      parse(resp) {
        expect(resp).toBe(model);
      }
    }
    class Collection extends Backbone.Collection {}
    Collection.prototype.url = 'test';
    Collection.prototype.model = _FetchParsesModel;
    new Collection().fetch();
    globalThis.env.ajaxSettings.success([model]);
  });

  it("`sort` shouldn't always fire on `add`", () => {
    var collection = new Backbone.Collection([{id: 1}, {id: 2}, {id: 3}], {
      comparator: 'id'
    });
    collection.sort = function(){ expect(true).toBeTruthy(); };
    collection.add([]);
    collection.add({id: 1});
    collection.add([{id: 2}, {id: 3}]);
    collection.add({id: 4});
  });

  it('#1407 parse option on constructor parses collection and models', () => {
    var model = {
      namespace: [{id: 1}, {id: 2}]
    };
    class _ParseModel1 extends Backbone.Model {
      parse(m) {
        m.name = 'test';
        return m;
      }
    }
    class Collection extends Backbone.Collection {
      parse(m) {
        return m.namespace;
      }
    }
    Collection.prototype.model = _ParseModel1;
    var collection = new Collection(model, {parse: true});

    expect(collection.length).toBe(2);
    expect(collection.at(0).get('name')).toBe('test');
  });

  it('#1407 parse option on reset parses collection and models', () => {
    var model = {
      namespace: [{id: 1}, {id: 2}]
    };
    class _ParseModel2 extends Backbone.Model {
      parse(m) {
        m.name = 'test';
        return m;
      }
    }
    class Collection extends Backbone.Collection {
      parse(m) {
        return m.namespace;
      }
    }
    Collection.prototype.model = _ParseModel2;
    var collection = new Collection();
    collection.reset(model, {parse: true});

    expect(collection.length).toBe(2);
    expect(collection.at(0).get('name')).toBe('test');
  });


  it('Reset includes previous models in triggered event.', () => {
    var model = new Backbone.Model();
    var collection = new Backbone.Collection([model]);
    collection.on('reset', function(coll, options) {
      expect(options.previousModels).toEqual([model]);
    });
    collection.reset([]);
  });

  it('set', () => {
    var m1 = new Backbone.Model();
    var m2 = new Backbone.Model({id: 2});
    var m3 = new Backbone.Model();
    var collection = new Backbone.Collection([m1, m2]);

    // Test add/change/remove events
    collection.on('add', function(model) {
      expect(model).toBe(m3);
    });
    collection.on('change', function(model) {
      expect(model).toBe(m2);
    });
    collection.on('remove', function(model) {
      expect(model).toBe(m1);
    });

    // remove: false doesn't remove any models
    collection.set([], {remove: false});
    expect(collection.length).toBe(2);

    // add: false doesn't add any models
    collection.set([m1, m2, m3], {add: false});
    expect(collection.length).toBe(2);

    // merge: false doesn't change any models
    collection.set([m1, {id: 2, a: 1}], {merge: false});
    expect(m2.get('a')).toBe(void 0);

    // add: false, remove: false only merges existing models
    collection.set([m1, {id: 2, a: 0}, m3, {id: 4}], {add: false, remove: false});
    expect(collection.length).toBe(2);
    expect(m2.get('a')).toBe(0);

    // default options add/remove/merge as appropriate
    collection.set([{id: 2, a: 1}, m3]);
    expect(collection.length).toBe(2);
    expect(m2.get('a')).toBe(1);

    // Test removing models not passing an argument
    collection.off('remove').on('remove', function(model) {
      expect(model === m2 || model === m3).toBeTruthy();
    });
    collection.set([]);
    expect(collection.length).toBe(0);

    // Test null models on set doesn't clear collection
    collection.off();
    collection.set([{id: 1}]);
    collection.set();
    expect(collection.length).toBe(1);
  });

  it('set with only cids', () => {
    var m1 = new Backbone.Model;
    var m2 = new Backbone.Model;
    var collection = new Backbone.Collection;
    collection.set([m1, m2]);
    expect(collection.length).toBe(2);
    collection.set([m1]);
    expect(collection.length).toBe(1);
    collection.set([m1, m1, m1, m2, m2], {remove: false});
    expect(collection.length).toBe(2);
  });

  it('set with only idAttribute', () => {
    var m1 = {_id: 1};
    var m2 = {_id: 2};
    class _IdAttrModel extends Backbone.Model {}
    _IdAttrModel.prototype.idAttribute = '_id';
    class Col extends Backbone.Collection {}
    Col.prototype.model = _IdAttrModel;
    var collection = new Col;
    collection.set([m1, m2]);
    expect(collection.length).toBe(2);
    collection.set([m1]);
    expect(collection.length).toBe(1);
    collection.set([m1, m1, m1, m2, m2], {remove: false});
    expect(collection.length).toBe(2);
  });

  it('set + merge with default values defined', () => {
    class Model extends Backbone.Model {}
    Model.prototype.defaults = {key: 'value'};
    var m = new Model({id: 1});
    var collection = new Backbone.Collection([m], {model: Model});
    expect(collection.first().get('key')).toBe('value');

    collection.set({id: 1, key: 'other'});
    expect(collection.first().get('key')).toBe('other');

    collection.set({id: 1, other: 'value'});
    expect(collection.first().get('key')).toBe('other');
    expect(collection.length).toBe(1);
  });

  it('merge without mutation', () => {
    class Model extends Backbone.Model {
      initialize(attrs, options) {
        if (attrs.child) {
          this.set('child', new Model(attrs.child, options), options);
        }
      }
    }
    class Collection extends Backbone.Collection {}
    Collection.prototype.model = Model;
    var data = [{id: 1, child: {id: 2}}];
    var collection = new Collection(data);
    expect(collection.first().id).toBe(1);
    collection.set(data);
    expect(collection.first().id).toBe(1);
    collection.set([{id: 2, child: {id: 2}}].concat(data));
    expect(collection.pluck('id')).toEqual([2, 1]);
  });

  it('`set` and model level `parse`', () => {
    class Model extends Backbone.Model {}
    class Collection extends Backbone.Collection {
      parse(res) { return _.map(res.models, 'model'); }
    }
    Collection.prototype.model = Model;
    var model = new Model({id: 1});
    var collection = new Collection(model);
    collection.set({models: [
      {model: {id: 1}},
      {model: {id: 2}}
    ]}, {parse: true});
    expect(collection.first()).toBe(model);
  });

  it('`set` data is only parsed once', () => {
    var collection = new Backbone.Collection();
    class _ParseOnceModel extends Backbone.Model {
      parse(data) {
        expect(data.parsed).toBe(void 0);
        data.parsed = true;
        return data;
      }
    }
    collection.model = _ParseOnceModel;
    collection.set({}, {parse: true});
  });

  it('`set` matches input order in the absence of a comparator', () => {
    var one = new Backbone.Model({id: 1});
    var two = new Backbone.Model({id: 2});
    var three = new Backbone.Model({id: 3});
    var collection = new Backbone.Collection([one, two, three]);
    collection.set([{id: 3}, {id: 2}, {id: 1}]);
    expect(collection.models).toEqual([three, two, one]);
    collection.set([{id: 1}, {id: 2}]);
    expect(collection.models).toEqual([one, two]);
    collection.set([two, three, one]);
    expect(collection.models).toEqual([two, three, one]);
    collection.set([{id: 1}, {id: 2}], {remove: false});
    expect(collection.models).toEqual([two, three, one]);
    collection.set([{id: 1}, {id: 2}, {id: 3}], {merge: false});
    expect(collection.models).toEqual([one, two, three]);
    collection.set([three, two, one, {id: 4}], {add: false});
    expect(collection.models).toEqual([one, two, three]);
  });

  it('#1894 - Push should not trigger a sort', () => {
    class Collection extends Backbone.Collection {
      sort() { expect(false).toBeTruthy(); }
    }
    Collection.prototype.comparator = 'id';
    new Collection().push({id: 1});
  });

  it('#2428 - push duplicate models, return the correct one', () => {
    var collection = new Backbone.Collection;
    var model1 = collection.push({id: 101});
    var model2 = collection.push({id: 101});
    expect(model2.cid === model1.cid).toBeTruthy();
  });

  it('`set` with non-normal id', () => {
    class _NonNormalIdModel extends Backbone.Model {}
    _NonNormalIdModel.prototype.idAttribute = '_id';
    class Collection extends Backbone.Collection {}
    Collection.prototype.model = _NonNormalIdModel;
    var collection = new Collection({_id: 1});
    collection.set([{_id: 1, a: 1}], {add: false});
    expect(collection.first().get('a')).toBe(1);
  });

  it('#1894 - `sort` can optionally be turned off', () => {
    class Collection extends Backbone.Collection {
      sort() { expect(false).toBeTruthy(); }
    }
    Collection.prototype.comparator = 'id';
    new Collection().add({id: 1}, {sort: false});
  });

  it('#1915 - `parse` data in the right order in `set`', () => {
    class _ParseOrderCollection extends Backbone.Collection {
      parse(data) {
        expect(data.status).toBe('ok');
        return data.data;
      }
    }
    var collection = new _ParseOrderCollection();
    var res = {status: 'ok', data: [{id: 1}]};
    collection.set(res, {parse: true});
  });

  it('#1939 - `parse` is passed `options`', () => {
    return new Promise((done) => {
      class _ParseOptionsCollection extends Backbone.Collection {
        parse(data, options) {
          expect(options.xhr.someHeader).toBe('headerValue');
          return data;
        }
      }
      _ParseOptionsCollection.prototype.url = '/';
      var collection = new _ParseOptionsCollection();
      var ajax = Backbone.ajax;
      Backbone.ajax = function(params) {
        _.defer(params.success, []);
        return {someHeader: 'headerValue'};
      };
      collection.fetch({
        success: function() { done(); }
      });
      Backbone.ajax = ajax;
    });
  });

  it('fetch will pass extra options to success callback', () => {
    class SpecialSyncCollection extends Backbone.Collection {
      sync(method, collection, options) {
        _.extend(options, {specialSync: true});
        return Backbone.Collection.prototype.sync.call(this, method, collection, options);
      }
    }
    SpecialSyncCollection.prototype.url = '/test';

    var collection = new SpecialSyncCollection();

    var onSuccess = function(coll, resp, options) {
      expect(options.specialSync).toBeTruthy();
    };

    collection.fetch({success: onSuccess});
    globalThis.env.ajaxSettings.success();
  });

  it('`add` only `sort`s when necessary', () => {
    class _SortNecessaryCollection extends Backbone.Collection {}
    _SortNecessaryCollection.prototype.comparator = 'a';
    var collection = new _SortNecessaryCollection([{id: 1}, {id: 2}, {id: 3}]);
    collection.on('sort', function() { expect(true).toBeTruthy(); });
    collection.add({id: 4}); // do sort, new model
    collection.add({id: 1, a: 1}, {merge: true}); // do sort, comparator change
    collection.add({id: 1, b: 1}, {merge: true}); // don't sort, no comparator change
    collection.add({id: 1, a: 1}, {merge: true}); // don't sort, no comparator change
    collection.add(collection.models); // don't sort, nothing new
    collection.add(collection.models, {merge: true}); // don't sort
  });

  it('`add` only `sort`s when necessary with comparator function', () => {
    class _SortNecessaryFnCollection extends Backbone.Collection {
      comparator(m1, m2) {
        return m1.get('a') > m2.get('a') ? 1 : m1.get('a') < m2.get('a') ? -1 : 0;
      }
    }
    var collection = new _SortNecessaryFnCollection([{id: 1}, {id: 2}, {id: 3}]);
    collection.on('sort', function() { expect(true).toBeTruthy(); });
    collection.add({id: 4}); // do sort, new model
    collection.add({id: 1, a: 1}, {merge: true}); // do sort, model change
    collection.add({id: 1, b: 1}, {merge: true}); // do sort, model change
    collection.add({id: 1, a: 1}, {merge: true}); // don't sort, no model change
    collection.add(collection.models); // don't sort, nothing new
    collection.add(collection.models, {merge: true}); // don't sort
  });

  it('Attach options to collection.', () => {
    var Model = Backbone.Model;
    var comparator = function(){};

    var collection = new Backbone.Collection([], {
      model: Model,
      comparator: comparator
    });

    expect(collection.model === Model).toBeTruthy();
    expect(collection.comparator === comparator).toBeTruthy();
  });

  it('Pass falsey for `models` for empty Col with `options`', () => {
    var opts = {a: 1, b: 2};
    _.forEach([undefined, null, false], function(falsey) {
      class Collection extends Backbone.Collection {
        initialize(models, options) {
          expect(models).toBe(falsey);
          expect(options).toBe(opts);
        }
      }

      var collection = new Collection(falsey, opts);
      expect(collection.length).toBe(0);
    });
  });

  it('`add` overrides `set` flags', () => {
    var collection = new Backbone.Collection();
    collection.once('add', function(model, coll, options) {
      coll.add({id: 2}, options);
    });
    collection.set({id: 1});
    expect(collection.length).toBe(2);
  });

  it('#2606 - Collection#create, success arguments', () => {
    var collection = new Backbone.Collection;
    collection.url = 'test';
    collection.create({}, {
      success: function(model, resp, options) {
        expect(resp).toBe('response');
      }
    });
    globalThis.env.ajaxSettings.success('response');
  });

  it('#2612 - nested `parse` works with `Collection#set`', () => {

    class Item extends Backbone.Model {
      preinitialize() {
        this.subItems = new Backbone.Collection();
      }
      parse(attrs) {
        this.subItems.set(attrs.subItems, {parse: true});
        return _.omit(attrs, 'subItems');
      }
    }

    class Items extends Backbone.Collection {}
    Items.prototype.model = Item;

    class Job extends Backbone.Model {
      preinitialize() {
        this.items = new Items();
      }
      parse(attrs) {
        this.items.set(attrs.items, {parse: true});
        return _.omit(attrs, 'items');
      }
    }

    var data = {
      name: 'JobName',
      id: 1,
      items: [{
        id: 1,
        name: 'Sub1',
        subItems: [
          {id: 1, subName: 'One'},
          {id: 2, subName: 'Two'}
        ]
      }, {
        id: 2,
        name: 'Sub2',
        subItems: [
          {id: 3, subName: 'Three'},
          {id: 4, subName: 'Four'}
        ]
      }]
    };

    var newData = {
      name: 'NewJobName',
      id: 1,
      items: [{
        id: 1,
        name: 'NewSub1',
        subItems: [
          {id: 1, subName: 'NewOne'},
          {id: 2, subName: 'NewTwo'}
        ]
      }, {
        id: 2,
        name: 'NewSub2',
        subItems: [
          {id: 3, subName: 'NewThree'},
          {id: 4, subName: 'NewFour'}
        ]
      }]
    };

    var job = new Job(data, {parse: true});
    expect(job.get('name')).toBe('JobName');
    expect(job.items.at(0).get('name')).toBe('Sub1');
    expect(job.items.length).toBe(2);
    expect(job.items.get(1).subItems.get(1).get('subName')).toBe('One');
    expect(job.items.get(2).subItems.get(3).get('subName')).toBe('Three');
    job.set(job.parse(newData, {parse: true}));
    expect(job.get('name')).toBe('NewJobName');
    expect(job.items.at(0).get('name')).toBe('NewSub1');
    expect(job.items.length).toBe(2);
    expect(job.items.get(1).subItems.get(1).get('subName')).toBe('NewOne');
    expect(job.items.get(2).subItems.get(3).get('subName')).toBe('NewThree');
  });

  it('_addReference binds all collection events & adds to the lookup hashes', () => {
    var calls = {add: 0, remove: 0};

    class Collection extends Backbone.Collection {

      _addReference(model) {
        Backbone.Collection.prototype._addReference.apply(this, arguments);
        calls.add++;
        expect(model).toBe(this._byId[model.id]);
        expect(model).toBe(this._byId[model.cid]);
        expect(model._events.all.length).toBe(1);
      }

      _removeReference(model) {
        Backbone.Collection.prototype._removeReference.apply(this, arguments);
        calls.remove++;
        expect(this._byId[model.id]).toBe(void 0);
        expect(this._byId[model.cid]).toBe(void 0);
        expect(model.collection).toBe(void 0);
      }

    }

    var collection = new Collection();
    var model = collection.add({id: 1});
    collection.remove(model);

    expect(calls.add).toBe(1);
    expect(calls.remove).toBe(1);
  });

  it('Do not allow duplicate models to be `add`ed or `set`', () => {
    var collection = new Backbone.Collection();

    collection.add([{id: 1}, {id: 1}]);
    expect(collection.length).toBe(1);
    expect(collection.models.length).toBe(1);

    collection.set([{id: 1}, {id: 1}]);
    expect(collection.length).toBe(1);
    expect(collection.models.length).toBe(1);
  });

  it('#3020: #set with {add: false} should not throw.', () => {
    var collection = new Backbone.Collection;
    collection.set([{id: 1}], {add: false});
    expect(collection.length).toBe(0);
    expect(collection.models.length).toBe(0);
  });

  it('create with wait, model instance, #3028', () => {
    var collection = new Backbone.Collection();
    var model = new Backbone.Model({id: 1});
    model.sync = function(){
      expect(this.collection).toBe(collection);
    };
    collection.create(model, {wait: true});
  });

  it('modelId', () => {
    class Stooge extends Backbone.Model {}
    class StoogeCollection extends Backbone.Collection {}

    // Default to using `id` if `model::idAttribute` and `Collection::model::idAttribute` not present.
    expect(StoogeCollection.prototype.modelId({id: 1})).toBe(1);

    // Default to using `model::idAttribute` if present.
    Stooge.prototype.idAttribute = '_id';
    var model = new Stooge({_id: 1});
    expect(StoogeCollection.prototype.modelId(model.attributes, model.idAttribute)).toBe(1);

    // Default to using `Collection::model::idAttribute` if model::idAttribute not present.
    StoogeCollection.prototype.model = Stooge;
    expect(StoogeCollection.prototype.modelId({_id: 1})).toBe(1);

  });

  it('Polymorphic models work with "simple" constructors', () => {
    class A extends Backbone.Model {}
    class B extends Backbone.Model {}
    class C extends Backbone.Collection {}
    C.prototype.model = function(attrs) {
      return attrs.type === 'a' ? new A(attrs) : new B(attrs);
    };
    var collection = new C([{id: 1, type: 'a'}, {id: 2, type: 'b'}]);
    expect(collection.length).toBe(2);
    expect(collection.at(0) instanceof A).toBeTruthy();
    expect(collection.at(0).id).toBe(1);
    expect(collection.at(1) instanceof B).toBeTruthy();
    expect(collection.at(1).id).toBe(2);
  });

  it('Polymorphic models work with "advanced" constructors', () => {
    class A extends Backbone.Model {}
    A.prototype.idAttribute = '_id';
    class B extends Backbone.Model {}
    B.prototype.idAttribute = '_id';
    class _AdvancedPolyModel extends Backbone.Model {
      constructor(attrs) {
        return attrs.type === 'a' ? new A(attrs) : new B(attrs);
      }
    }
    _AdvancedPolyModel.prototype.idAttribute = '_id';
    class C extends Backbone.Collection {}
    C.prototype.model = _AdvancedPolyModel;
    var collection = new C([{_id: 1, type: 'a'}, {_id: 2, type: 'b'}]);
    expect(collection.length).toBe(2);
    expect(collection.at(0) instanceof A).toBeTruthy();
    expect(collection.at(0)).toBe(collection.get(1));
    expect(collection.at(1) instanceof B).toBeTruthy();
    expect(collection.at(1)).toBe(collection.get(2));

    class C2 extends Backbone.Collection {
      modelId(attrs) {
        return attrs.type + '-' + attrs.id;
      }
    }
    C2.prototype.model = function(attrs) {
      return attrs.type === 'a' ? new A(attrs) : new B(attrs);
    };
    C = C2;
    collection = new C([{id: 1, type: 'a'}, {id: 1, type: 'b'}]);
    expect(collection.length).toBe(2);
    expect(collection.at(0) instanceof A).toBeTruthy();
    expect(collection.at(0)).toBe(collection.get('a-1'));
    expect(collection.at(1) instanceof B).toBeTruthy();
    expect(collection.at(1)).toBe(collection.get('b-1'));
  });

  it('Collection with polymorphic models receives id from modelId using model instance idAttribute', () => {
    // When the polymorphic models use 'id' for the idAttribute, all is fine.
    class C1 extends Backbone.Collection {}
    C1.prototype.model = function(attrs) {
      return new Backbone.Model(attrs);
    };
    var c1 = new C1({id: 1});
    expect(c1.get(1).id).toBe(1);
    expect(c1.modelId({id: 1})).toBe(1);

    // If the polymorphic models define their own idAttribute,
    // the modelId method will use the model's idAttribute property before the
    // collection's model constructor's.
    class M extends Backbone.Model {}
    M.prototype.idAttribute = '_id';
    class C2 extends Backbone.Collection {}
    C2.prototype.model = function(attrs) {
      return new M(attrs);
    };
    var c2 = new C2({_id: 1});
    expect(c2.get(1)).toBe(c2.at(0));
    expect(c2.modelId(c2.at(0).attributes, c2.at(0).idAttribute)).toBe(1);
    var m = new M({_id: 2});
    c2.add(m);
    expect(c2.get(2)).toBe(m);
    expect(c2.modelId(m.attributes, m.idAttribute)).toBe(2);
  });

  it('Collection implements Iterable, values is default iterator function', () => {
    /* global Symbol */
    var $$iterator = typeof Symbol === 'function' && Symbol.iterator;
    // This test only applies to environments which define Symbol.iterator.
    if (!$$iterator) {
      return;
    }
    var collection = new Backbone.Collection([]);
    expect(collection[$$iterator]).toBe(collection.values);
    var iterator = collection[$$iterator]();
    expect(iterator.next()).toEqual({value: void 0, done: true});
  });

  it('Collection.values iterates models in sorted order', () => {
    var one = new Backbone.Model({id: 1});
    var two = new Backbone.Model({id: 2});
    var three = new Backbone.Model({id: 3});
    var collection = new Backbone.Collection([one, two, three]);
    var iterator = collection.values();
    expect(iterator.next().value).toBe(one);
    expect(iterator.next().value).toBe(two);
    expect(iterator.next().value).toBe(three);
    expect(iterator.next().value).toBe(void 0);
  });

  it('Collection.keys iterates ids in sorted order', () => {
    var one = new Backbone.Model({id: 1});
    var two = new Backbone.Model({id: 2});
    var three = new Backbone.Model({id: 3});
    var collection = new Backbone.Collection([one, two, three]);
    var iterator = collection.keys();
    expect(iterator.next().value).toBe(1);
    expect(iterator.next().value).toBe(2);
    expect(iterator.next().value).toBe(3);
    expect(iterator.next().value).toBe(void 0);
  });

  it('Collection.entries iterates ids and models in sorted order', () => {
    var one = new Backbone.Model({id: 1});
    var two = new Backbone.Model({id: 2});
    var three = new Backbone.Model({id: 3});
    var collection = new Backbone.Collection([one, two, three]);
    var iterator = collection.entries();
    expect(iterator.next().value).toEqual([1, one]);
    expect(iterator.next().value).toEqual([2, two]);
    expect(iterator.next().value).toEqual([3, three]);
    expect(iterator.next().value).toBe(void 0);
  });

  it('#3039 #3951: adding at index fires with correct at', () => {
    var collection = new Backbone.Collection([{val: 0}, {val: 4}]);
    collection.on('add', function(model, coll, options) {
      expect(model.get('val')).toBe(options.index);
    });
    collection.add([{val: 1}, {val: 2}, {val: 3}], {at: 1});
    collection.add({val: 5}, {at: 10});
  });

  it('#3039: index is not sent when at is not specified', () => {
    var collection = new Backbone.Collection([{at: 0}]);
    collection.on('add', function(model, coll, options) {
      expect(undefined).toBe(options.index);
    });
    collection.add([{at: 1}, {at: 2}]);
  });

  it('#3199 - Order changing should trigger a sort', () => {
    var one = new Backbone.Model({id: 1});
    var two = new Backbone.Model({id: 2});
    var three = new Backbone.Model({id: 3});
    var collection = new Backbone.Collection([one, two, three]);
    collection.on('sort', function() {
      expect(true).toBeTruthy();
    });
    collection.set([{id: 3}, {id: 2}, {id: 1}]);
  });

  it('#3199 - Adding a model should trigger a sort', () => {
    var one = new Backbone.Model({id: 1});
    var two = new Backbone.Model({id: 2});
    var three = new Backbone.Model({id: 3});
    var collection = new Backbone.Collection([one, two, three]);
    collection.on('sort', function() {
      expect(true).toBeTruthy();
    });
    collection.set([{id: 1}, {id: 2}, {id: 3}, {id: 0}]);
  });

  it('#3199 - Order not changing should not trigger a sort', () => {
    var one = new Backbone.Model({id: 1});
    var two = new Backbone.Model({id: 2});
    var three = new Backbone.Model({id: 3});
    var collection = new Backbone.Collection([one, two, three]);
    collection.on('sort', function() {
      expect(false).toBeTruthy();
    });
    collection.set([{id: 1}, {id: 2}, {id: 3}]);
  });

  it('add supports negative indexes', () => {
    var collection = new Backbone.Collection([{id: 1}]);
    collection.add([{id: 2}, {id: 3}], {at: -1});
    collection.add([{id: 2.5}], {at: -2});
    collection.add([{id: 0.5}], {at: -6});
    expect(collection.pluck('id').join(',')).toBe('0.5,1,2,2.5,3');
  });

  it('#set accepts options.at as a string', () => {
    var collection = new Backbone.Collection([{id: 1}, {id: 2}]);
    collection.add([{id: 3}], {at: '1'});
    expect(collection.pluck('id')).toEqual([1, 3, 2]);
  });

  it('adding multiple models triggers `update` event once', () => {
    var collection = new Backbone.Collection;
    collection.on('update', function() { expect(true).toBeTruthy(); });
    collection.add([{id: 1}, {id: 2}, {id: 3}]);
  });

  it('removing models triggers `update` event once', () => {
    var collection = new Backbone.Collection([{id: 1}, {id: 2}, {id: 3}]);
    collection.on('update', function() { expect(true).toBeTruthy(); });
    collection.remove([{id: 1}, {id: 2}]);
  });

  it('remove does not trigger `update` when nothing removed', () => {
    var collection = new Backbone.Collection([{id: 1}, {id: 2}]);
    collection.on('update', function() { expect(false).toBeTruthy(); });
    collection.remove([{id: 3}]);
  });

  it('set triggers `set` event once', () => {
    var collection = new Backbone.Collection([{id: 1}, {id: 2}]);
    collection.on('update', function() { expect(true).toBeTruthy(); });
    collection.set([{id: 1}, {id: 3}]);
  });

  it('set does not trigger `update` event when nothing added nor removed', () => {
    var collection = new Backbone.Collection([{id: 1}, {id: 2}]);
    collection.on('update', function(coll, options) {
      expect(options.changes.added.length).toBe(0);
      expect(options.changes.removed.length).toBe(0);
      expect(options.changes.merged.length).toBe(2);
    });
    collection.set([{id: 1}, {id: 2}]);
  });

  it('#3610 - invoke collects arguments', () => {
    class Model extends Backbone.Model {
      method(x, y, z) {
        expect(x).toBe(1);
        expect(y).toBe(2);
        expect(z).toBe(3);
      }
    }
    class Collection extends Backbone.Collection {}
    Collection.prototype.model = Model;
    var collection = new Collection([{id: 1}]);
    collection.invoke('method', 1, 2, 3);
  });

  it('#3662 - triggering change without model will not error', () => {
    var collection = new Backbone.Collection([{id: 1}]);
    var model = collection.first();
    collection.on('change', function(m) {
      expect(m).toBe(undefined);
    });
    model.trigger('change');
  });

  it('#3871 - falsy parse result creates empty collection', () => {
    class _FalsyParseCollection extends Backbone.Collection {
      parse(data, options) {}
    }
    var collection = new _FalsyParseCollection();
    collection.set('', {parse: true});
    expect(collection.length).toBe(0);
  });

  it("#3711 - remove's `update` event returns one removed model", () => {
    var model = new Backbone.Model({id: 1, title: 'First Post'});
    var collection = new Backbone.Collection([model]);
    collection.on('update', function(context, options) {
      var changed = options.changes;
      expect(changed.added).toEqual([]);
      expect(changed.merged).toEqual([]);
      expect(changed.removed[0]).toBe(model);
    });
    collection.remove(model);
  });

  it("#3711 - remove's `update` event returns multiple removed models", () => {
    var model = new Backbone.Model({id: 1, title: 'First Post'});
    var model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    var collection = new Backbone.Collection([model, model2]);
    collection.on('update', function(context, options) {
      var changed = options.changes;
      expect(changed.added).toEqual([]);
      expect(changed.merged).toEqual([]);
      expect(changed.removed.length === 2).toBeTruthy();

      expect(_.indexOf(changed.removed, model) > -1 && _.indexOf(changed.removed, model2) > -1).toBeTruthy();
    });
    collection.remove([model, model2]);
  });

  it("#3711 - set's `update` event returns one added model", () => {
    var model = new Backbone.Model({id: 1, title: 'First Post'});
    var collection = new Backbone.Collection();
    collection.on('update', function(context, options) {
      var addedModels = options.changes.added;
      expect(addedModels.length === 1).toBeTruthy();
      expect(addedModels[0]).toBe(model);
    });
    collection.set(model);
  });

  it("#3711 - set's `update` event returns multiple added models", () => {
    var model = new Backbone.Model({id: 1, title: 'First Post'});
    var model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    var collection = new Backbone.Collection();
    collection.on('update', function(context, options) {
      var addedModels = options.changes.added;
      expect(addedModels.length === 2).toBeTruthy();
      expect(addedModels[0]).toBe(model);
      expect(addedModels[1]).toBe(model2);
    });
    collection.set([model, model2]);
  });

  it("#3711 - set's `update` event returns one removed model", () => {
    var model = new Backbone.Model({id: 1, title: 'First Post'});
    var model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    var model3 = new Backbone.Model({id: 3, title: 'My Last Post'});
    var collection = new Backbone.Collection([model]);
    collection.on('update', function(context, options) {
      var changed = options.changes;
      expect(changed.added.length).toBe(2);
      expect(changed.merged.length).toBe(0);
      expect(changed.removed.length === 1).toBeTruthy();
      expect(changed.removed[0]).toBe(model);
    });
    collection.set([model2, model3]);
  });

  it("#3711 - set's `update` event returns multiple removed models", () => {
    var model = new Backbone.Model({id: 1, title: 'First Post'});
    var model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    var model3 = new Backbone.Model({id: 3, title: 'My Last Post'});
    var collection = new Backbone.Collection([model, model2]);
    collection.on('update', function(context, options) {
      var removedModels = options.changes.removed;
      expect(removedModels.length === 2).toBeTruthy();
      expect(removedModels[0]).toBe(model);
      expect(removedModels[1]).toBe(model2);
    });
    collection.set([model3]);
  });

  it("#3711 - set's `update` event returns one merged model", () => {
    var model = new Backbone.Model({id: 1, title: 'First Post'});
    var model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    var model2Update = new Backbone.Model({id: 2, title: 'Second Post V2'});
    var collection = new Backbone.Collection([model, model2]);
    collection.on('update', function(context, options) {
      var mergedModels = options.changes.merged;
      expect(mergedModels.length === 1).toBeTruthy();
      expect(mergedModels[0].get('title')).toBe(model2Update.get('title'));
    });
    collection.set([model2Update]);
  });

  it("#3711 - set's `update` event returns multiple merged models", () => {
    var model = new Backbone.Model({id: 1, title: 'First Post'});
    var modelUpdate = new Backbone.Model({id: 1, title: 'First Post V2'});
    var model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    var model2Update = new Backbone.Model({id: 2, title: 'Second Post V2'});
    var collection = new Backbone.Collection([model, model2]);
    collection.on('update', function(context, options) {
      var mergedModels = options.changes.merged;
      expect(mergedModels.length === 2).toBeTruthy();
      expect(mergedModels[0].get('title')).toBe(model2Update.get('title'));
      expect(mergedModels[1].get('title')).toBe(modelUpdate.get('title'));
    });
    collection.set([model2Update, modelUpdate]);
  });

  it("#3711 - set's `update` event should not be triggered adding a model which already exists exactly alike", () => {
    var fired = false;
    var model = new Backbone.Model({id: 1, title: 'First Post'});
    var collection = new Backbone.Collection([model]);
    collection.on('update', function(context, options) {
      fired = true;
    });
    collection.set([model]);
    expect(fired).toBe(false);
  });

  it('get models with `attributes` key', () => {
    var model = {id: 1, attributes: {}};
    var collection = new Backbone.Collection([model]);
    expect(collection.get(model)).toBeTruthy();
  });

  it('#3961 - add events sends options.index that correspond to wrong index', () => {
    var numModels = 4;
    var models = _.each(['a', 'b', 'c', 'd'], function(val) {
      return new Backbone.Model({id: val});
    });
    var collection = new Backbone.Collection(models);
    models.shift(); // remove first element;
    models.push(new Backbone.Model({id: 'e'}));
    collection.on('add', function(model, coll, options){
      expect(options.index).toBe(undefined);
    });
    collection.set(models);
  });

  it('#4233 - can instantiate new model in ES class Collection', () => {
    var model = function(attrs, options) {
      return new Backbone.Model(attrs, options);
    };

    class MyCollection extends Backbone.Collection {
      modelId(attr) {
        return attr.x;
      }
    }
    MyCollection.prototype.model = model;

    var instance = new MyCollection([{x: 1}]);
    expect(instance).toBeTruthy();
  });

});
