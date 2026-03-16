import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Backbone.View', () => {

  var view;

  beforeEach(() => {
    $('#qunit-fixture').append(
      '<div id="testElement"><h1>Test</h1></div>'
    );

    view = new Backbone.View({
      id: 'test-view',
      className: 'test-view',
      other: 'non-special-option'
    });
  });

  afterEach(() => {
    $('#testElement').remove();
    $('#test-view').remove();
  });

  it('constructor', () => {
    expect(view.el.id).toBe('test-view');
    expect(view.el.className).toBe('test-view');
    expect(view.el.other).toBe(void 0);
  });

  it('$', () => {
    var myView = new Backbone.View;
    myView.setElement('<p><a><b>test</b></a></p>');
    var result = myView.$('a b');

    expect(result[0].innerHTML).toBe('test');
    expect(result.length === +result.length).toBeTruthy();
  });

  it('$el', () => {
    var myView = new Backbone.View;
    myView.setElement('<p><a><b>test</b></a></p>');
    expect(myView.el.nodeType).toBe(1);

    // $el is a Backbone.$-wrapped element when Backbone.$ is set.
    expect(myView.$el instanceof Backbone.$).toBeTruthy();
    expect(myView.$el.get(0)).toBe(myView.el);
  });

  it('initialize', () => {
    class View extends Backbone.View {
      initialize() {
        this.one = 1;
      }
    }

    expect(new View().one).toBe(1);
  });

  it('preinitialize', () => {
    class View extends Backbone.View {
      preinitialize() {
        this.one = 1;
      }
    }

    expect(new View().one).toBe(1);
  });

  it('preinitialize occurs before the view is set up', () => {
    var elValue;
    class View extends Backbone.View {
      preinitialize() {
        elValue = this.el;
      }
    }
    var _view = new View({});
    expect(elValue).toBe(undefined);
    expect(_view.el).not.toBe(undefined);
  });

  it('render', () => {
    var myView = new Backbone.View;
    expect(myView.render()).toBe(myView);
  });

  it('delegateEvents', () => {
    var counter1 = 0, counter2 = 0;

    var myView = new Backbone.View({el: '#testElement'});
    myView.increment = function() { counter1++; };
    myView.$el.on('click', function() { counter2++; });

    var events = {'click h1': 'increment'};

    myView.delegateEvents(events);
    myView.$('h1').trigger('click');
    expect(counter1).toBe(1);
    expect(counter2).toBe(1);

    myView.$('h1').trigger('click');
    expect(counter1).toBe(2);
    expect(counter2).toBe(2);

    myView.delegateEvents(events);
    myView.$('h1').trigger('click');
    expect(counter1).toBe(3);
    expect(counter2).toBe(3);
  });

  it('delegate', () => {
    var clickCount = 0;
    var h1ClickCount = 0;
    var myView = new Backbone.View({el: '#testElement'});
    myView.delegate('click', 'h1', function() {
      h1ClickCount++;
    });
    myView.delegate('click', function() {
      clickCount++;
    });
    myView.$('h1').trigger('click');

    expect(h1ClickCount).toBe(1);
    expect(clickCount).toBe(1);
    expect(myView.delegate()).toBe(myView);
  });

  it('delegateEvents allows functions for callbacks', () => {
    var myView = new Backbone.View({el: '<p></p>'});
    myView.counter = 0;

    var events = {
      click: function() {
        this.counter++;
      }
    };

    myView.delegateEvents(events);
    myView.$el.trigger('click');
    expect(myView.counter).toBe(1);

    myView.$el.trigger('click');
    expect(myView.counter).toBe(2);

    myView.delegateEvents(events);
    myView.$el.trigger('click');
    expect(myView.counter).toBe(3);
  });

  it('delegateEvents ignore undefined methods', () => {
    var myView = new Backbone.View({el: '<p></p>'});
    myView.delegateEvents({click: 'undefinedMethod'});
    myView.$el.trigger('click');
  });

  it('undelegateEvents', () => {
    var counter1 = 0, counter2 = 0;

    var myView = new Backbone.View({el: '#testElement'});
    myView.increment = function() { counter1++; };
    myView.$el.on('click', function() { counter2++; });

    var events = {'click h1': 'increment'};

    myView.delegateEvents(events);
    myView.$('h1').trigger('click');
    expect(counter1).toBe(1);
    expect(counter2).toBe(1);

    myView.undelegateEvents();
    myView.$('h1').trigger('click');
    expect(counter1).toBe(1);
    expect(counter2).toBe(2);

    myView.delegateEvents(events);
    myView.$('h1').trigger('click');
    expect(counter1).toBe(2);
    expect(counter2).toBe(3);

    expect(myView.undelegateEvents()).toBe(myView);
  });

  it('undelegate', () => {
    var myView = new Backbone.View({el: '#testElement'});
    myView.delegate('click', function() { throw new Error('should not fire'); });
    myView.delegate('click', 'h1', function() { throw new Error('should not fire'); });

    myView.undelegate('click');

    myView.$('h1').trigger('click');
    myView.$el.trigger('click');

    expect(myView.undelegate()).toBe(myView);
  });

  it('undelegate with passed handler', () => {
    var fired = false;
    var myView = new Backbone.View({el: '#testElement'});
    var listener = function() { throw new Error('should not fire'); };
    myView.delegate('click', listener);
    myView.delegate('click', function() { fired = true; });
    myView.undelegate('click', listener);
    myView.$el.trigger('click');
    expect(fired).toBeTruthy();
  });

  it('undelegate with selector', () => {
    var elClicked = false;
    var myView = new Backbone.View({el: '#testElement'});
    myView.delegate('click', function() { elClicked = true; });
    myView.delegate('click', 'h1', function() { throw new Error('should not fire'); });
    myView.undelegate('click', 'h1');
    myView.$('h1').trigger('click');
    myView.$el.trigger('click');
    expect(elClicked).toBeTruthy();
  });

  it('undelegate with handler and selector', () => {
    var elClicked = false;
    var myView = new Backbone.View({el: '#testElement'});
    myView.delegate('click', function() { elClicked = true; });
    var handler = function() { throw new Error('should not fire'); };
    myView.delegate('click', 'h1', handler);
    myView.undelegate('click', 'h1', handler);
    myView.$('h1').trigger('click');
    myView.$el.trigger('click');
    expect(elClicked).toBeTruthy();
  });

  it('tagName can be provided as a string', () => {
    class View extends Backbone.View {
    }
    View.prototype.tagName = 'span';

    expect(new View().el.tagName).toBe('SPAN');
  });

  it('tagName can be provided as a function', () => {
    class View extends Backbone.View {
      tagName() {
        return 'p';
      }
    }

    expect(new View().$el.is('p')).toBeTruthy();
  });

  it('_ensureElement with DOM node el', () => {
    class View extends Backbone.View {
    }
    View.prototype.el = document.body;

    expect(new View().el).toBe(document.body);
  });

  it('_ensureElement with string el', () => {
    class View extends Backbone.View {
    }
    View.prototype.el = 'body';
    expect(new View().el).toBe(document.body);

    class View2 extends Backbone.View {
    }
    View2.prototype.el = '#testElement > h1';
    expect(new View2().el).toBe($('#testElement > h1').get(0));

    class View3 extends Backbone.View {
    }
    View3.prototype.el = '#nonexistent';
    expect(!new View3().el).toBeTruthy();
  });

  it('with className and id functions', () => {
    class View extends Backbone.View {
      className() {
        return 'className';
      }
      id() {
        return 'id';
      }
    }

    expect(new View().el.className).toBe('className');
    expect(new View().el.id).toBe('id');
  });

  it('with attributes', () => {
    class View extends Backbone.View {
    }
    View.prototype.attributes = {
      'id': 'id',
      'class': 'class'
    };

    expect(new View().el.className).toBe('class');
    expect(new View().el.id).toBe('id');
  });

  it('with attributes as a function', () => {
    class View extends Backbone.View {
      attributes() {
        return {'class': 'dynamic'};
      }
    }

    expect(new View().el.className).toBe('dynamic');
  });

  it('should default to className/id properties', () => {
    class View extends Backbone.View {
    }
    View.prototype.className = 'backboneClass';
    View.prototype.id = 'backboneId';
    View.prototype.attributes = {
      'class': 'attributeClass',
      'id': 'attributeId'
    };

    var myView = new View;
    expect(myView.el.className).toBe('backboneClass');
    expect(myView.el.id).toBe('backboneId');
    expect(myView.$el.attr('class')).toBe('backboneClass');
    expect(myView.$el.attr('id')).toBe('backboneId');
  });

  it('multiple views per element', () => {
    var count = 0;
    var $el = $('<p></p>');

    class View extends Backbone.View {
    }
    View.prototype.el = $el;
    View.prototype.events = {
      click: function() {
        count++;
      }
    };

    var view1 = new View;
    $el.trigger('click');
    expect(1).toBe(count);

    var view2 = new View;
    $el.trigger('click');
    expect(3).toBe(count);

    view1.delegateEvents();
    $el.trigger('click');
    expect(5).toBe(count);
  });

  it('custom events', () => {
    var firedCount = 0;
    class View extends Backbone.View {
    }
    View.prototype.el = $('body');
    View.prototype.events = {
      fake$event: function() { firedCount++; }
    };

    var myView = new View;
    $('body').trigger('fake$event').trigger('fake$event');

    expect(firedCount).toBe(2);

    myView.undelegateEvents();
    $('body').trigger('fake$event');

    expect(firedCount).toBe(2);
  });

  it('#1048 - setElement resolves provided element.', () => {
    var $el = $('body');

    var myView = new Backbone.View({el: $el});
    expect(myView.el === document.body).toBeTruthy();

    myView.setElement(document.body);
    expect(myView.el === document.body).toBeTruthy();
  });

  it('#986 - Undelegate before changing element.', () => {
    var button1 = $('<button></button>');
    var button2 = $('<button></button>');

    var clickedTarget = null;
    class View extends Backbone.View {
    }
    View.prototype.events = {
      click: function(e) {
        clickedTarget = e.target;
      }
    };

    var myView = new View({el: button1});
    myView.setElement(button2);

    button1.trigger('click');
    button2.trigger('click');
    expect(myView.el === clickedTarget).toBeTruthy();
  });

  it('#1172 - Clone attributes object', () => {
    class View extends Backbone.View {
    }
    View.prototype.attributes = {foo: 'bar'};

    var view1 = new View({id: 'foo'});
    expect(view1.el.id).toBe('foo');

    var view2 = new View();
    expect(!view2.el.id).toBeTruthy();
  });

  it('views stopListening', () => {
    var heard = false;
    class View extends Backbone.View {
      initialize() {
        this.listenTo(this.model, 'all x', function() { heard = true; });
        this.listenTo(this.collection, 'all x', function() { heard = true; });
      }
    }

    var myView = new View({
      model: new Backbone.Model,
      collection: new Backbone.Collection
    });

    myView.stopListening();
    myView.model.trigger('x');
    myView.collection.trigger('x');
    expect(heard).toBe(false);
  });

  it('Provide function for el.', () => {
    class View extends Backbone.View {
      el() {
        return '<p><a></a></p>';
      }
    }

    var myView = new View;
    expect(myView.$el.is('p')).toBeTruthy();
    expect(myView.$el.has('a')).toBeTruthy();
  });

  it('events passed in options', () => {
    var counter = 0;

    class View extends Backbone.View {
      increment() {
        counter++;
      }
    }
    View.prototype.el = '#testElement';

    var myView = new View({
      events: {
        'click h1': 'increment'
      }
    });

    myView.$('h1').trigger('click').trigger('click');
    expect(counter).toBe(2);
  });

  it('remove', () => {
    var myView = new Backbone.View;
    document.body.appendChild(view.el);

    myView.delegate('click', function() { throw new Error('should not fire'); });
    myView.listenTo(myView, 'all x', function() { throw new Error('should not fire'); });

    expect(myView.remove()).toBe(myView);
    myView.$el.trigger('click');
    myView.trigger('x');

    // In IE8 and below, parentNode still exists but is not document.body.
    expect(myView.el.parentNode).not.toBe(document.body);
  });

  it('setElement', () => {
    var oldClicked = false;
    var newClicked = false;
    var myView = new Backbone.View({
      events: {
        click: function() { oldClicked = true; }
      }
    });
    myView.events = {
      click: function() { newClicked = true; }
    };
    var oldEl = myView.el;
    var $oldEl = myView.$el;

    myView.setElement(document.createElement('div'));

    $oldEl.click();
    myView.$el.click();

    expect(oldClicked).toBe(false);
    expect(newClicked).toBe(true);
    expect(oldEl).not.toBe(myView.el);
    expect($oldEl).not.toBe(myView.$el);
  });

});
