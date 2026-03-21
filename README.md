<img src="docs/images/ostov-icon.svg" alt="Ostov.js" width="80" />

# Ostov.js

A modern reimagining of [Backbone.js](https://backbonejs.org/) — same proven MVC patterns, no jQuery, no Underscore, ships as a native ES module.

- Zero hard dependencies (includes a minimal built-in utility layer)
- Native ES module — works in browsers and any bundler (Vite, Rollup, webpack 5+)
- Full TypeScript types included
- Familiar Backbone API — drop-in for most use cases

## Docs
[Ostovjs.org](https://ostovjs.org/)

## Install

```bash
npm install ostovjs
```

Or grab the file directly:

- [ostov.js](https://raw.githubusercontent.com/DmitryOlkhovoi/Ostov/master/dist/ostov.js) — development build
- [ostov.min.js](https://raw.githubusercontent.com/DmitryOlkhovoi/Ostov/master/dist/ostov.min.js) — production build

## Usage

### npm / bundler

```js
import { Model, Collection, View, Router, Events } from 'ostovjs';
```

Or import the full namespace:

```js
import Ostov from 'ostovjs';
```

### Browser — ES module

```html
<script type="module">
  import { Model, Collection } from './ostov.js';
</script>
```

### Browser — classic script tag

```html
<script src="ostov.js"></script>
<!-- Ostov is now available as a global variable -->
```

## ✨ Why Ostov?

Backbone had a great core idea:
- explicit state (models)
- event-driven updates
- separation of concerns

Ostov keeps that — but removes legacy baggage:
- ❌ no jQuery
- ❌ no Underscore
- ✅ ES modules
- ✅ ES classes
- ✅ TypeScript generics

---

## 🚀 TypeScript + Classes

### Model

```ts
import { Model } from 'ostovjs';

interface TodoAttrs {
  title: string;
  completed: boolean;
}

export class Todo extends Model<TodoAttrs> {
  defaults() {
    return {
      title: '',
      completed: false,
    };
  }

  toggle() {
    this.set('completed', !this.get('completed'));
  }
}
```

---

### Collection

```ts
import { Collection } from 'ostovjs';
import { Todo } from './Todo';

export class TodoList extends Collection<Todo> {
  model = Todo;

  completed() {
    return this.where({ completed: true });
  }
}
```

---

### View (class-based)

```ts
import { View } from 'ostovjs';
import { Todo } from './Todo';

export class TodoView extends View<Todo> {
  events() {
    return {
      'click [data-action="toggle"]': 'onToggle',
    };
  }

  initialize() {
    this.listenTo(this.model, 'change', this.render);
  }

  render() {
    this.el.innerHTML = `
      <button data-action="toggle">Toggle</button>
      <span>${this.model.get('title')}</span>
    `;
    return this;
  }

  onToggle() {
    this.model.toggle();
  }
}
```

---

## 🧩 Using Handlebars (templating)

Ostov does not force a templating system — you can plug in anything.

Example with Handlebars:

```ts
import Handlebars from 'handlebars';
import { View } from 'ostovjs';

const template = Handlebars.compile(`
  <div>
    <h3>{{title}}</h3>
    <button data-action="toggle">
      {{#if completed}}Undo{{else}}Complete{{/if}}
    </button>
  </div>
`);

export class TodoView extends View {
  initialize() {
    this.listenTo(this.model, 'change', this.render);
  }

  render() {
    this.el.innerHTML = template(this.model.toJSON());
    return this;
  }
}
```

👉 You can use any templating engine:
- Handlebars
- Mustache
- JSX (custom)
- plain strings

---

## 🔁 Backbone-style `.extend(...)`

Ostov still supports classic Backbone patterns:

```ts
import { Model, View } from 'ostovjs';

const Todo = Model.extend({
  defaults: {
    title: '',
    completed: false,
  },

  toggle() {
    this.set('completed', !this.get('completed'));
  },
});

const TodoView = View.extend({
  events: {
    'click button': 'toggle',
  },

  initialize() {
    this.listenTo(this.model, 'change', this.render);
  },

  render() {
    this.el.innerHTML = this.model.get('title');
    return this;
  },

  toggle() {
    this.model.toggle();
  },
});
```

👉 This is useful if:
- you're migrating from Backbone
- you prefer prototype-style inheritance

---

## 🆚 Modern vs Legacy usage

| Style | Use |
|------|-----|
| Classes + TS | ✅ recommended |
| `.extend(...)` | ✅ supported |
| Templates | any (no lock-in) |

---

## 🧠 Core Idea

Ostov gives you primitives:

- Model
- Collection
- View
- Router
- Events

No magic. Just structure.

---

## 🎯 When to use

- small / medium apps
- dashboards
- internal tools
- apps where React feels like overkill

---

## 🚫 When not to use

- heavy ecosystem requirements
- large teams needing strict conventions

---

## ⭐ Support

If you like Backbone-style architecture with modern TypeScript —  
drop a star ⭐

---

## 🧨 Philosophy

> Less framework. More control.

## Built with Ostov

[TLDR extension for google chrome](https://github.com/DmitryOlkhovoi/tlrd-extension) — Get a TLDR summary of any page using OpenAI. Ask follow-up questions in a dedicated tab.
