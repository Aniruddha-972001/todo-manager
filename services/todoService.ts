import { findListById } from "../models/listModel.js";
import { deleteTodo, findTodoById, updateTodo } from "../models/todoModel.js";
import type { Todo } from "../models/dataStore.js";

type TodoMutationResult = { todo: Todo } | { error: "TODO_NOT_FOUND" | "FORBIDDEN" };
type TodoDeleteResult = { success: true } | { error: "TODO_NOT_FOUND" | "FORBIDDEN" };

export async function updateTodoDetails(
  todoId: string,
  updates: { task?: string; completed?: boolean },
  userId: string
): Promise<TodoMutationResult> {
  const todo = await findTodoById(todoId);

  if (!todo) {
    return { error: "TODO_NOT_FOUND" };
  }

  const list = await findListById(todo.listId);

  if (!list || list.creatorId !== userId) {
    return { error: "FORBIDDEN" };
  }

  const updatedTodo = await updateTodo(todoId, updates);

  if (!updatedTodo) {
    return { error: "TODO_NOT_FOUND" };
  }

  return { todo: updatedTodo };
}

export async function deleteTodoById(todoId: string, userId: string): Promise<TodoDeleteResult> {
  const todo = await findTodoById(todoId);

  if (!todo) {
    return { error: "TODO_NOT_FOUND" };
  }

  const list = await findListById(todo.listId);

  if (!list || list.creatorId !== userId) {
    return { error: "FORBIDDEN" };
  }

  await deleteTodo(todoId);
  return { success: true };
}
