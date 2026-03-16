<img src="docs/images/ostov-icon.svg" alt="Ostov.js" width="80" />

# Ostov.js

A modern reimagining of [Backbone.js](https://backbonejs.org/) — same proven MVC patterns, no jQuery, no Underscore, ships as a native ES module.

- Zero hard dependencies (includes a minimal built-in utility layer)
- Native ES module — works in browsers and any bundler (Vite, Rollup, webpack 5+)
- Full TypeScript types included
- Familiar Backbone API — drop-in for most use cases

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

## Core concepts

### Model

Manages data and business logic. Triggers `"change"` events when attributes are modified.

```js
import { Model } from 'ostovjs';

const Book = Model.extend({
  defaults: {
    title: '',
    author: '',
    read: false
  }
});

const book = new Book({ title: 'Dune', author: 'Herbert' });

book.on('change:title', (model, value) => {
  console.log('Title changed to:', value);
});

book.set('title', 'Dune Messiah'); // → "Title changed to: Dune Messiah"
book.get('author');                // → "Herbert"
```

### Collection

A group of models with helpers for sorting, filtering, and syncing with the server.

```js
import { Model, Collection } from 'ostovjs';

const Task = Model.extend({
  defaults: { title: '', done: false }
});

const TaskList = Collection.extend({
  model: Task,
  url: '/api/tasks',

  pending() {
    return this.filter(t => !t.get('done'));
  }
});

const tasks = new TaskList([
  { title: 'Write docs' },
  { title: 'Ship it', done: true }
]);

console.log(tasks.length);           // 2
console.log(tasks.pending().length); // 1
```

### REST API integration

Point a Collection (or Model) at a URL and Ostov handles the REST mapping automatically:

```js
import { Collection } from 'ostovjs';

class Books extends Collection {
  url = '/api/books';
}

const books = new Books();
books.fetch(); // GET /api/books

// If the API wraps data in metadata, use parse():
class Books extends Collection {
  url = '/api/books';
  parse(data) {
    return data.books; // unwrap { page, total, books: [...] }
  }
}
```

HTTP methods map to model/collection methods:

```
GET  /books/   → collection.fetch()
POST /books/   → collection.create()
GET  /books/1  → model.fetch()
PUT  /books/1  → model.save()
DEL  /books/1  → model.destroy()
```

### View

Manages rendering and user interaction within a DOM element. Each View owns its own `el` and listens to model events to re-render itself.

```js
import { Model, View } from 'ostovjs';

const Book = Model.extend({
  defaults: { title: '', author: '' }
});

const BookView = View.extend({
  tagName: 'article',

  initialize() {
    this.listenTo(this.model, 'change', this.render);
  },

  render() {
    this.el.innerHTML = `
      <h2>${this.model.get('title')}</h2>
      <p>${this.model.get('author')}</p>
    `;
    return this;
  }
});

const book = new Book({ title: 'Dune', author: 'Herbert' });
const view = new BookView({ model: book });

document.body.appendChild(view.render().el);

book.set('title', 'Dune Messiah'); // view re-renders automatically
```

DOM events are declared in an `events` hash:

```js
const BookView = View.extend({
  events: {
    'click .btn-read':   'markRead',
    'dblclick h2':       'editTitle'
  },

  markRead() {
    this.model.set('read', true);
  }
});
```

### Events

Mix event handling into any object:

```js
import { Events } from 'ostovjs';

const bus = Object.assign({}, Events);

bus.on('user:login', user => {
  console.log('Welcome,', user.name);
});

bus.trigger('user:login', { name: 'Alice' });
```

Listen to multiple events at once:

```js
book.on('change:title change:author', () => console.log('metadata changed'));

// Or with an event map:
book.on({
  'change:title':  titleView.render,
  'change:author': authorView.render,
  'destroy':       bookView.remove
});
```

### Router

Keeps your app in sync with the browser URL:

```js
import { Router } from 'ostovjs';

const AppRouter = Router.extend({
  routes: {
    '':             'home',
    'books':        'bookList',
    'books/:id':    'bookDetail'
  },

  home()           { console.log('home'); },
  bookList()       { console.log('all books'); },
  bookDetail(id)   { console.log('book', id); }
});

const router = new AppRouter();
Ostov.history.start();
```

## License

MIT
