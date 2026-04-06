import type { Request, Response } from "express";
import { deleteTodoById, updateTodoDetails } from "../services/todoService.js";
import { validateTodoUpdate } from "../utils/validation.js";

function getRouteParam(param: string | string[] | undefined): string | null {
  return typeof param === "string" ? param : null;
}

export async function updateTodo(req: Request, res: Response): Promise<Response> {
  const todoId = getRouteParam(req.params.todoId);

  if (!todoId) {
    return res.status(400).json({ message: "Todo id is required" });
  }

  const validation = validateTodoUpdate(req.body);

  if ("error" in validation) {
    return res.status(400).json({ message: validation.error });
  }

  const result = await updateTodoDetails(todoId, validation.value, req.user!.userId);

  if ("error" in result && result.error === "TODO_NOT_FOUND") {
    return res.status(404).json({ message: "Todo not found" });
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    return res.status(403).json({ message: "Forbidden: you can only update todos in your own lists" });
  }

  if ("error" in result) {
    return res.status(500).json({ message: "Failed to update todo" });
  }

  return res.status(200).json({
    message: "Todo updated successfully",
    todo: result.todo,
  });
}

export async function deleteTodo(req: Request, res: Response): Promise<Response> {
  const todoId = getRouteParam(req.params.todoId);

  if (!todoId) {
    return res.status(400).json({ message: "Todo id is required" });
  }

  const result = await deleteTodoById(todoId, req.user!.userId);

  if ("error" in result && result.error === "TODO_NOT_FOUND") {
    return res.status(404).json({ message: "Todo not found" });
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    return res.status(403).json({ message: "Forbidden: you can only delete todos in your own lists" });
  }

  if ("error" in result) {
    return res.status(500).json({ message: "Failed to delete todo" });
  }

  return res.status(200).json({ message: "Todo deleted successfully" });
}
