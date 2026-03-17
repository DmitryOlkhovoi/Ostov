import { Collection, Model, View } from "ostovjs";
import Handlebars from "handlebars";
import todoTemplate from "./todo.hbs?raw";

const template = Handlebars.compile(todoTemplate);

interface Todo {
  completed: boolean;
}

class TodoModel extends Model<Todo> {
  isDone() {
    return this.get('completed');
  }
}

class TodosCollection extends Collection<TodoModel> {
  model = TodoModel;
  url = 'https://jsonplaceholder.typicode.com/todos';
}

class AppView extends View {
  el = '#app';
  todos: TodosCollection = new TodosCollection();

  initialize() {
    this.todos.fetch();

    this.listenTo(this.todos, 'update', this.render);
  }

  render() {
    this.$el.innerHTML = template({ todos: this.todos.toJSON() });
    return this;
  }
}

new AppView();
