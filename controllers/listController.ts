import type { Request, Response } from "express";
import {
  addList,
  addTodoToList,
  deleteListById,
  fetchListById,
  fetchListTodos,
  fetchLists,
  updateListName,
} from "../services/listService.js";
import { validateListName, validateTask } from "../utils/validation.js";

function getRouteParam(param: string | string[] | undefined): string | null {
  if (typeof param === "string") {
    return param;
  }

  return null;
}

export async function getLists(req: Request, res: Response): Promise<Response> {
  return res.status(200).json({
    message: "Lists fetched successfully",
    lists: await fetchLists(req.user!.userId),
  });
}

export async function getList(req: Request, res: Response): Promise<Response> {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "List id is required" });
  }

  const list = await fetchListById(id, req.user!.userId);

  if (!list) {
    return res.status(404).json({ message: "List not found" });
  }

  return res.status(200).json({
    message: "List fetched successfully",
    list,
  });
}

export async function createList(req: Request, res: Response): Promise<Response> {
  const validation = validateListName((req.body as { name?: unknown }).name);

  if ("error" in validation) {
    return res.status(400).json({ message: validation.error });
  }

  const list = await addList(validation.value, req.user!.userId);

  return res.status(201).json({
    message: "List created successfully",
    list,
  });
}

export async function updateList(req: Request, res: Response): Promise<Response> {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "List id is required" });
  }

  const validation = validateListName((req.body as { name?: unknown }).name);

  if ("error" in validation) {
    return res.status(400).json({ message: validation.error });
  }

  const result = await updateListName(id, validation.value, req.user!.userId);

  if ("error" in result && result.error === "LIST_NOT_FOUND") {
    return res.status(404).json({ message: "List Not Found" });
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    return res.status(403).json({
      message: "Forbidden: you can only update your own list",
    });
  }

  if ("error" in result) {
    return res.status(500).json({ message: "Failed to update list" });
  }

  return res.status(200).json({
    message: "List Updated Successfully",
    list: result.list,
  });
}

export async function getListTodos(req: Request, res: Response): Promise<Response> {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "List id is required" });
  }

  const result = await fetchListTodos(id, req.user!.userId);

  if ("error" in result && result.error === "LIST_NOT_FOUND") {
    return res.status(404).json({ message: "List not found" });
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    return res.status(403).json({ message: "Forbidden: you can only view your own list todos" });
  }

  if ("error" in result) {
    return res.status(500).json({ message: "Failed to fetch todos" });
  }

  return res.status(200).json({
    message: "Todos fetched successfully",
    list: result.list,
    todos: result.todos,
  });
}

export async function createTodo(req: Request, res: Response): Promise<Response> {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "List id is required" });
  }

  const validation = validateTask((req.body as { task?: unknown }).task);

  if ("error" in validation) {
    return res.status(400).json({ message: validation.error });
  }

  const result = await addTodoToList(id, validation.value, req.user!.userId);

  if ("error" in result && result.error === "LIST_NOT_FOUND") {
    return res.status(404).json({ message: "List not found" });
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    return res.status(403).json({
      message: "Forbidden : you can only add todos to your own list",
    });
  }

  if ("error" in result) {
    return res.status(500).json({ message: "Failed to add todo" });
  }

  return res.status(201).json({
    message: "Todo added successfully",
    todo: result.todo,
  });
}

export async function deleteList(req: Request, res: Response): Promise<Response> {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "List id is required" });
  }

  const result = await deleteListById(id, req.user!.userId);

  if ("error" in result && result.error === "LIST_NOT_FOUND") {
    return res.status(404).json({ message: "List not found" });
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    return res.status(403).json({ message: "Forbidden: you can only delete your own lists" });
  }

  if ("error" in result) {
    return res.status(500).json({ message: "Failed to delete list" });
  }

  return res.status(200).json({
    message: "List deleted successfully",
  });
}
