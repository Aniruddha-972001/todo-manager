export interface User {
  id: string;
  username: string;
  password: string;
}

export type TodoPriority = "low" | "medium" | "high";

export interface List {
  id: string;
  name: string;
  creatorId: string;
}

export interface Todo {
  id: string;
  task: string;
  completed: boolean;
  archived: boolean;
  priority: TodoPriority;
  dueDate: string | null;
  position: number;
  listId: string;
}

export interface ListWithTodos extends List {
  todos: Todo[];
}
