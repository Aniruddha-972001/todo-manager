import type { Request, Response } from "express";
import {
  addList,
  addTodoToList,
  deleteListById,
  fetchListById,
  fetchListTodos,
  fetchLists,
  reorderListTodos,
  updateListName,
} from "../services/listService.js";
import { AppError } from "../utils/errors.js";
import {
  idParamSchema,
  listBodySchema,
  parseWithSchema,
  reorderTodosSchema,
  todoBodySchema,
} from "../utils/validation.js";

export async function getLists(req: Request, res: Response): Promise<Response> {
  return res.status(200).json({
    message: "Lists fetched successfully",
    lists: await fetchLists(req.user!.userId),
  });
}

export async function getList(req: Request, res: Response): Promise<Response> {
  const { id } = parseWithSchema(idParamSchema, req.params);

  const list = await fetchListById(id, req.user!.userId);

  if (!list) {
    throw new AppError(404, "List not found");
  }

  return res.status(200).json({
    message: "List fetched successfully",
    list,
  });
}

export async function createList(req: Request, res: Response): Promise<Response> {
  const { name } = parseWithSchema(listBodySchema, req.body);
  const list = await addList(name, req.user!.userId);

  return res.status(201).json({
    message: "List created successfully",
    list,
  });
}

export async function updateList(req: Request, res: Response): Promise<Response> {
  const { id } = parseWithSchema(idParamSchema, req.params);
  const { name } = parseWithSchema(listBodySchema, req.body);
  const result = await updateListName(id, name, req.user!.userId);

  if ("error" in result && result.error === "LIST_NOT_FOUND") {
    throw new AppError(404, "List not found");
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    throw new AppError(403, "Forbidden: you can only update your own list");
  }

  if ("error" in result) {
    throw new AppError(500, "Failed to update list");
  }

  return res.status(200).json({
    message: "List Updated Successfully",
    list: result.list,
  });
}

export async function getListTodos(req: Request, res: Response): Promise<Response> {
  const { id } = parseWithSchema(idParamSchema, req.params);

  const result = await fetchListTodos(id, req.user!.userId);

  if ("error" in result && result.error === "LIST_NOT_FOUND") {
    throw new AppError(404, "List not found");
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    throw new AppError(403, "Forbidden: you can only view your own list todos");
  }

  if ("error" in result) {
    throw new AppError(500, "Failed to fetch todos");
  }

  return res.status(200).json({
    message: "Todos fetched successfully",
    list: result.list,
    todos: result.todos,
  });
}

export async function createTodo(req: Request, res: Response): Promise<Response> {
  const { id } = parseWithSchema(idParamSchema, req.params);
  const payload = parseWithSchema(todoBodySchema, req.body);
  const result = await addTodoToList(id, payload.task, req.user!.userId, {
    priority: payload.priority,
    dueDate: payload.dueDate,
  });

  if ("error" in result && result.error === "LIST_NOT_FOUND") {
    throw new AppError(404, "List not found");
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    throw new AppError(403, "Forbidden: you can only add todos to your own list");
  }

  if ("error" in result) {
    throw new AppError(500, "Failed to add todo");
  }

  return res.status(201).json({
    message: "Todo added successfully",
    todo: result.todo,
  });
}

export async function reorderTodosInList(req: Request, res: Response): Promise<Response> {
  const { id } = parseWithSchema(idParamSchema, req.params);
  const { orderedTodoIds } = parseWithSchema(reorderTodosSchema, req.body);
  const result = await reorderListTodos(id, orderedTodoIds, req.user!.userId);

  if ("error" in result && result.error === "LIST_NOT_FOUND") {
    throw new AppError(404, "List not found");
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    throw new AppError(403, "Forbidden: you can only reorder todos in your own list");
  }

  if ("error" in result && result.error === "INVALID_TODO_ORDER") {
    throw new AppError(400, "Todo order does not match the current list");
  }

  if ("error" in result) {
    throw new AppError(500, "Failed to reorder todos");
  }

  return res.status(200).json({
    message: "Todos reordered successfully",
  });
}

export async function deleteList(req: Request, res: Response): Promise<Response> {
  const { id } = parseWithSchema(idParamSchema, req.params);

  const result = await deleteListById(id, req.user!.userId);

  if ("error" in result && result.error === "LIST_NOT_FOUND") {
    throw new AppError(404, "List not found");
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    throw new AppError(403, "Forbidden: you can only delete your own lists");
  }

  if ("error" in result) {
    throw new AppError(500, "Failed to delete list");
  }

  return res.status(200).json({
    message: "List deleted successfully",
  });
}
