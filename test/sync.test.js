import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Ostov.sync', () => {

  class Library extends Ostov.Collection {
    url() { return '/library'; }
  }
  var library;

  var attrs = {
    title: 'The Tempest',
    author: 'Bill Shakespeare',
    length: 123
  };

  beforeEach(() => {
    library = new Library;
    library.create(attrs, {wait: false});
  });

  afterEach(() => {
    Ostov.emulateHTTP = false;
  });

  it('read', () => {
    var env = globalThis.env;
    library.fetch();
    expect(env.ajaxSettings.url).toBe('/library');
    expect(env.ajaxSettings.type).toBe('GET');
    expect(env.ajaxSettings.dataType).toBe('json');
    expect(_.isEmpty(env.ajaxSettings.data)).toBeTruthy();
  });

  it('passing data', () => {
    var env = globalThis.env;
    library.fetch({data: {a: 'a', one: 1}});
    expect(env.ajaxSettings.url).toBe('/library');
    expect(env.ajaxSettings.data.a).toBe('a');
    expect(env.ajaxSettings.data.one).toBe(1);
  });

  it('create', () => {
    var env = globalThis.env;
    expect(env.ajaxSettings.url).toBe('/library');
    expect(env.ajaxSettings.type).toBe('POST');
    expect(env.ajaxSettings.dataType).toBe('json');
    var data = JSON.parse(env.ajaxSettings.data);
    expect(data.title).toBe('The Tempest');
    expect(data.author).toBe('Bill Shakespeare');
    expect(data.length).toBe(123);
  });

  it('update', () => {
    var env = globalThis.env;
    library.first().save({id: '1-the-tempest', author: 'William Shakespeare'});
    expect(env.ajaxSettings.url).toBe('/library/1-the-tempest');
    expect(env.ajaxSettings.type).toBe('PUT');
    expect(env.ajaxSettings.dataType).toBe('json');
    var data = JSON.parse(env.ajaxSettings.data);
    expect(data.id).toBe('1-the-tempest');
    expect(data.title).toBe('The Tempest');
    expect(data.author).toBe('William Shakespeare');
    expect(data.length).toBe(123);
  });

  it('update with emulateHTTP and emulateJSON', () => {
    var env = globalThis.env;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'}, {
      emulateHTTP: true,
      emulateJSON: true
    });
    expect(env.ajaxSettings.url).toBe('/library/2-the-tempest');
    expect(env.ajaxSettings.type).toBe('POST');
    expect(env.ajaxSettings.dataType).toBe('json');
    expect(env.ajaxSettings.data._method).toBe('PUT');
    var data = JSON.parse(env.ajaxSettings.data.model);
    expect(data.id).toBe('2-the-tempest');
    expect(data.author).toBe('Tim Shakespeare');
    expect(data.length).toBe(123);
  });

  it('update with just emulateHTTP', () => {
    var env = globalThis.env;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'}, {
      emulateHTTP: true
    });
    expect(env.ajaxSettings.url).toBe('/library/2-the-tempest');
    expect(env.ajaxSettings.type).toBe('POST');
    expect(env.ajaxSettings.contentType).toBe('application/json');
    var data = JSON.parse(env.ajaxSettings.data);
    expect(data.id).toBe('2-the-tempest');
    expect(data.author).toBe('Tim Shakespeare');
    expect(data.length).toBe(123);
  });

  it('update with just emulateJSON', () => {
    var env = globalThis.env;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'}, {
      emulateJSON: true
    });
    expect(env.ajaxSettings.url).toBe('/library/2-the-tempest');
    expect(env.ajaxSettings.type).toBe('PUT');
    expect(env.ajaxSettings.contentType).toBe('application/x-www-form-urlencoded');
    var data = JSON.parse(env.ajaxSettings.data.model);
    expect(data.id).toBe('2-the-tempest');
    expect(data.author).toBe('Tim Shakespeare');
    expect(data.length).toBe(123);
  });

  it('read model', () => {
    var env = globalThis.env;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
    library.first().fetch();
    expect(env.ajaxSettings.url).toBe('/library/2-the-tempest');
    expect(env.ajaxSettings.type).toBe('GET');
    expect(_.isEmpty(env.ajaxSettings.data)).toBeTruthy();
  });

  it('destroy', () => {
    var env = globalThis.env;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
    library.first().destroy({wait: true});
    expect(env.ajaxSettings.url).toBe('/library/2-the-tempest');
    expect(env.ajaxSettings.type).toBe('DELETE');
    expect(env.ajaxSettings.data).toBeUndefined();
  });

  it('destroy with emulateHTTP', () => {
    var env = globalThis.env;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
    library.first().destroy({
      emulateHTTP: true,
      emulateJSON: true
    });
    expect(env.ajaxSettings.url).toBe('/library/2-the-tempest');
    expect(env.ajaxSettings.type).toBe('POST');
    expect(JSON.stringify(env.ajaxSettings.data)).toBe('{"_method":"DELETE"}');
  });

  it('urlError', () => {
    var env = globalThis.env;
    var model = new Ostov.Model();
    expect(function() {
      model.fetch();
    }).toThrow();
    model.fetch({url: '/one/two'});
    expect(env.ajaxSettings.url).toBe('/one/two');
  });

  it('#1052 - `options` is optional.', () => {
    var model = new Ostov.Model();
    model.url = '/test';
    Ostov.sync('create', model);
  });

  it('Ostov.ajax', () => {
    var capturedUrl;
    Ostov.ajax = function(settings) {
      capturedUrl = settings.url;
    };
    var model = new Ostov.Model();
    model.url = '/test';
    Ostov.sync('create', model);
    expect(capturedUrl).toBe('/test');
  });

  it('Call provided error callback on error.', () => {
    var env = globalThis.env;
    var errorCalled = false;
    var model = new Ostov.Model;
    model.url = '/test';
    Ostov.sync('read', model, {
      error: function() { errorCalled = true; }
    });
    env.ajaxSettings.error();
    expect(errorCalled).toBeTruthy();
  });

  it('Use Ostov.emulateHTTP as default.', () => {
    var env = globalThis.env;
    var model = new Ostov.Model;
    model.url = '/test';

    Ostov.emulateHTTP = true;
    model.sync('create', model);
    expect(env.ajaxSettings.emulateHTTP).toBe(true);

    Ostov.emulateHTTP = false;
    model.sync('create', model);
    expect(env.ajaxSettings.emulateHTTP).toBe(false);
  });

  it('Use Ostov.emulateJSON as default.', () => {
    var env = globalThis.env;
    var model = new Ostov.Model;
    model.url = '/test';

    Ostov.emulateJSON = true;
    model.sync('create', model);
    expect(env.ajaxSettings.emulateJSON).toBe(true);

    Ostov.emulateJSON = false;
    model.sync('create', model);
    expect(env.ajaxSettings.emulateJSON).toBe(false);
  });

  it('#1756 - Call user provided beforeSend function.', () => {
    var env = globalThis.env;
    Ostov.emulateHTTP = true;
    var model = new Ostov.Model;
    model.url = '/test';
    var headerSet = null;
    var valueSet = null;
    var xhr = {
      setRequestHeader: function(header, value) {
        headerSet = header;
        valueSet = value;
      }
    };
    var beforeSendXhr = null;
    model.sync('delete', model, {
      beforeSend: function(_xhr) {
        beforeSendXhr = _xhr;
        return false;
      }
    });
    expect(env.ajaxSettings.beforeSend(xhr)).toBe(false);
    expect(headerSet).toBe('X-HTTP-Method-Override');
    expect(valueSet).toBe('DELETE');
    expect(beforeSendXhr === xhr).toBeTruthy();
  });

  it('#2928 - Pass along `textStatus` and `errorThrown`.', () => {
    var env = globalThis.env;
    var capturedTextStatus, capturedErrorThrown;
    var model = new Ostov.Model;
    model.url = '/test';
    model.on('error', function(m, xhr, options) {
      capturedTextStatus = options.textStatus;
      capturedErrorThrown = options.errorThrown;
    });
    model.fetch();
    env.ajaxSettings.error({}, 'textStatus', 'errorThrown');
    expect(capturedTextStatus).toBe('textStatus');
    expect(capturedErrorThrown).toBe('errorThrown');
  });

});
