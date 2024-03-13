const Todo = require("./todo");

class TodoService {
  constructor({ todoRepository }) {
    this.todoRepository = todoRepository;
  }

  /**@param {Todo} todoItem */
  create(todoItem) {
    if (!todoItem.isValid()) {
      return {
        error: {
          message: "invalid data",
          data: todoItem,
        },
      };
    }

    const { when } = todoItem;
    const today = new Date();
    const todo = {
      ...todoItem,
      status: when > today ? "pending" : "late",
    };

    return this.todoRepository.create(todo);
  }

  list() {
    return this.todoRepository.list().map(({ meta, $loki, ...rest }) => rest);
  }
}

module.exports = TodoService;
