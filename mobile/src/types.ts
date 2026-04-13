export interface AuthUser {
  userId: string;
  role?: string;
}

export type TodoPriority = "low" | "medium" | "high";
export type TodoView = "all" | "open" | "completed" | "archived";

export interface TodoItem {
  id: string;
  task: string;
  completed: boolean;
  archived: boolean;
  priority: TodoPriority;
  dueDate: string | null;
  position: number;
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
