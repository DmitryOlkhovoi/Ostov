// Counter with declarative bindings — no templating engine, no full re-render.
// Unlike simple01 (Handlebars + re-render on every change), here the `bindings`
// hash keeps individual DOM nodes in sync with the model automatically.
//
// Expected host page markup:
//
//   <div id="app">
//     <span id="counter"></span>
//     <span id="status"></span>
//     <button id="increment">+1</button>
//     <button id="reset">Reset</button>
//   </div>

import { Model, View } from "ostovjs";

interface CounterAttrs {
  count: number;
}

class CounterModel extends Model<CounterAttrs> {
  defaults = { count: 0 };
}

class CounterView extends View<CounterModel> {
  el = '#app';
  model = new CounterModel();

  bindings = {
    '#counter:textContent': 'count',                                  // attribute → DOM property
    ':data-count': 'count',                                           // empty selector → root el attribute
    '#reset:disabled': (m: CounterModel) => m.get('count') === 0,     // computed binding
    '#status:textContent': (m: CounterModel) =>
      m.get('count') > 10 ? 'that is a lot of clicks' : '',
  };

  events = {
    'click #increment': 'increment',
    'click #reset': 'reset',
  };

  increment() {
    this.model.set('count', this.model.get('count') + 1); // DOM updates itself
  }

  reset() {
    this.model.set('count', 0);
  }
}

new CounterView();
