import { getDb } from "../config/database.js";
import type { Todo } from "./dataStore.js";

interface TodoRow {
  id: string;
  task: string;
  completed: number;
  listId: string;
}

function mapTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    task: row.task,
    completed: Boolean(row.completed),
    listId: row.listId,
  };
}

export async function createTodo(todo: Todo): Promise<Todo> {
  const db = await getDb();
  await db.run(
    "INSERT INTO todos (id, task, completed, list_id) VALUES (?, ?, ?, ?)",
    todo.id,
    todo.task,
    todo.completed ? 1 : 0,
    todo.listId
  );
  return todo;
}

export async function getTodosByListId(listId: string): Promise<Todo[]> {
  const db = await getDb();
  const rows = await db.all<TodoRow[]>(
    "SELECT id, task, completed, list_id as listId FROM todos WHERE list_id = ? ORDER BY created_at DESC",
    listId
  );

  return rows.map(mapTodo);
}

export async function findTodoById(id: string): Promise<Todo | undefined> {
  const db = await getDb();
  const row = await db.get<TodoRow>(
    "SELECT id, task, completed, list_id as listId FROM todos WHERE id = ?",
    id
  );

  return row ? mapTodo(row) : undefined;
}

export async function updateTodo(
  id: string,
  updates: { task?: string; completed?: boolean }
): Promise<Todo | undefined> {
  const db = await getDb();
  const currentTodo = await findTodoById(id);

  if (!currentTodo) {
    return undefined;
  }

  const nextTodo: Todo = {
    ...currentTodo,
    ...updates,
  };

  await db.run(
    "UPDATE todos SET task = ?, completed = ? WHERE id = ?",
    nextTodo.task,
    nextTodo.completed ? 1 : 0,
    id
  );

  return nextTodo;
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDb();
  await db.run("DELETE FROM todos WHERE id = ?", id);
}
