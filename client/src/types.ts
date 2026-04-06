export interface AuthUser {
  userId: string;
  role?: string;
}

export interface TodoItem {
  id: string;
  task: string;
  completed: boolean;
  listId: string;
}

export interface TodoList {
  id: string;
  name: string;
  creatorId: string;
}

export interface TodoListWithTodos extends TodoList {
  todos: TodoItem[];
}
