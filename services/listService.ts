import crypto from "node:crypto";
import {
  createList,
  deleteList,
  findListById,
  getListsByCreatorId,
  updateListNameById,
} from "../models/listModel.js";
import { createTodo, getNextTodoPosition, getTodosByListId, reorderTodos } from "../models/todoModel.js";
import type { List, ListWithTodos, Todo, TodoPriority } from "../models/dataStore.js";

type ListOperationResult =
  | { list: List }
  | { error: "LIST_NOT_FOUND" | "FORBIDDEN" };

type TodoOperationResult =
  | { todo: Todo }
  | { error: "LIST_NOT_FOUND" | "FORBIDDEN" };

type ListDeleteResult = { success: true } | { error: "LIST_NOT_FOUND" | "FORBIDDEN" };
type ListTodosResult = { list: List; todos: Todo[] } | { error: "LIST_NOT_FOUND" | "FORBIDDEN" };
type ReorderTodosResult =
  | { success: true }
  | { error: "LIST_NOT_FOUND" | "FORBIDDEN" | "INVALID_TODO_ORDER" };

export async function fetchLists(userId: string): Promise<List[]> {
  return getListsByCreatorId(userId);
}

export async function fetchListById(id: string, userId: string): Promise<ListWithTodos | null> {
  const list = await findListById(id);

  if (!list || list.creatorId !== userId) {
    return null;
  }

  const todos = await getTodosByListId(id);

  return {
    ...list,
    todos,
  };
}

export async function addList(name: string, creatorId: string): Promise<List> {
  const newList: List = {
    id: crypto.randomUUID(),
    name,
    creatorId,
  };

  return createList(newList);
}

export async function updateListName(id: string, name: string, userId: string): Promise<ListOperationResult> {
  const list = await findListById(id);

  if (!list) {
    return { error: "LIST_NOT_FOUND" };
  }

  if (list.creatorId !== userId) {
    return { error: "FORBIDDEN" };
  }

  list.name = name;
  await updateListNameById(list.id, list.name);
  return { list };
}

export async function deleteListById(id: string, userId: string): Promise<ListDeleteResult> {
  const list = await findListById(id);

  if (!list) {
    return { error: "LIST_NOT_FOUND" };
  }

  if (list.creatorId !== userId) {
    return { error: "FORBIDDEN" };
  }

  await deleteList(id);
  return { success: true };
}

export async function fetchListTodos(id: string, userId: string): Promise<ListTodosResult> {
  const list = await findListById(id);

  if (!list) {
    return { error: "LIST_NOT_FOUND" };
  }

  if (list.creatorId !== userId) {
    return { error: "FORBIDDEN" };
  }

  const todos = await getTodosByListId(id);
  return { list, todos };
}

export async function addTodoToList(
  id: string,
  task: string,
  userId: string,
  options?: { priority?: TodoPriority; dueDate?: string | null }
): Promise<TodoOperationResult> {
  const list = await findListById(id);

  if (!list) {
    return { error: "LIST_NOT_FOUND" };
  }

  if (list.creatorId !== userId) {
    return { error: "FORBIDDEN" };
  }

  const position = await getNextTodoPosition(id);
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    task,
    completed: false,
    archived: false,
    priority: options?.priority ?? "medium",
    dueDate: options?.dueDate ?? null,
    position,
    listId: id,
  };

  await createTodo(newTodo);
  return { todo: newTodo };
}

export async function reorderListTodos(
  id: string,
  orderedTodoIds: string[],
  userId: string
): Promise<ReorderTodosResult> {
  const list = await findListById(id);

  if (!list) {
    return { error: "LIST_NOT_FOUND" };
  }

  if (list.creatorId !== userId) {
    return { error: "FORBIDDEN" };
  }

  const todos = await getTodosByListId(id);

  if (
    todos.length !== orderedTodoIds.length ||
    new Set(orderedTodoIds).size !== orderedTodoIds.length ||
    todos.some((todo) => !orderedTodoIds.includes(todo.id))
  ) {
    return { error: "INVALID_TODO_ORDER" };
  }

  await reorderTodos(id, orderedTodoIds);
  return { success: true };
}
