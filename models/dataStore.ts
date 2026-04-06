export interface User {
  id: string;
  username: string;
  password: string;
}

export interface List {
  id: string;
  name: string;
  creatorId: string;
}

export interface Todo {
  id: string;
  task: string;
  completed: boolean;
  listId: string;
}

export interface ListWithTodos extends List {
  todos: Todo[];
}
