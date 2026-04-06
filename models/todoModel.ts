import { getDb } from "../config/database.js";
import type { Todo, TodoPriority } from "./dataStore.js";

interface TodoRow {
  id: string;
  task: string;
  completed: number;
  archived: number;
  priority: TodoPriority;
  dueDate: string | null;
  position: number;
  listId: string;
}

function mapTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    task: row.task,
    completed: Boolean(row.completed),
    archived: Boolean(row.archived),
    priority: row.priority,
    dueDate: row.dueDate,
    position: row.position,
    listId: row.listId,
  };
}

export async function createTodo(todo: Todo): Promise<Todo> {
  const db = await getDb();
  await db.run(
    "INSERT INTO todos (id, task, completed, archived, priority, due_date, position, list_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    todo.id,
    todo.task,
    todo.completed ? 1 : 0,
    todo.archived ? 1 : 0,
    todo.priority,
    todo.dueDate,
    todo.position,
    todo.listId
  );
  return todo;
}

export async function getTodosByListId(listId: string): Promise<Todo[]> {
  const db = await getDb();
  const rows = await db.all<TodoRow[]>(
    `SELECT id, task, completed, archived, priority, due_date as dueDate, position, list_id as listId
     FROM todos
     WHERE list_id = ?
     ORDER BY position ASC, created_at DESC, id ASC`,
    listId
  );

  return rows.map(mapTodo);
}

export async function findTodoById(id: string): Promise<Todo | undefined> {
  const db = await getDb();
  const row = await db.get<TodoRow>(
    `SELECT id, task, completed, archived, priority, due_date as dueDate, position, list_id as listId
     FROM todos
     WHERE id = ?`,
    id
  );

  return row ? mapTodo(row) : undefined;
}

export async function updateTodo(
  id: string,
  updates: {
    task?: string;
    completed?: boolean;
    archived?: boolean;
    priority?: TodoPriority;
    dueDate?: string | null;
    position?: number;
  }
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
    "UPDATE todos SET task = ?, completed = ?, archived = ?, priority = ?, due_date = ?, position = ? WHERE id = ?",
    nextTodo.task,
    nextTodo.completed ? 1 : 0,
    nextTodo.archived ? 1 : 0,
    nextTodo.priority,
    nextTodo.dueDate,
    nextTodo.position,
    id
  );

  return nextTodo;
}

export async function getNextTodoPosition(listId: string): Promise<number> {
  const db = await getDb();
  const row = await db.get<{ maxPosition: number | null }>(
    "SELECT MAX(position) as maxPosition FROM todos WHERE list_id = ?",
    listId
  );

  return (row?.maxPosition ?? -1) + 1;
}

export async function reorderTodos(listId: string, orderedTodoIds: string[]): Promise<void> {
  const db = await getDb();

  await db.exec("BEGIN TRANSACTION");

  try {
    for (const [index, todoId] of orderedTodoIds.entries()) {
      await db.run("UPDATE todos SET position = ? WHERE id = ? AND list_id = ?", index, todoId, listId);
    }

    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDb();
  await db.run("DELETE FROM todos WHERE id = ?", id);
}
