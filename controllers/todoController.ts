import type { Request, Response } from "express";
import { deleteTodoById, updateTodoDetails } from "../services/todoService.js";
import { AppError } from "../utils/errors.js";
import { parseWithSchema, todoIdParamSchema, todoUpdateSchema } from "../utils/validation.js";

export async function updateTodo(req: Request, res: Response): Promise<Response> {
  const { todoId } = parseWithSchema(todoIdParamSchema, req.params);
  const updates = parseWithSchema(todoUpdateSchema, req.body);
  const result = await updateTodoDetails(todoId, updates, req.user!.userId);

  if ("error" in result && result.error === "TODO_NOT_FOUND") {
    throw new AppError(404, "Todo not found");
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    throw new AppError(403, "Forbidden: you can only update todos in your own lists");
  }

  if ("error" in result) {
    throw new AppError(500, "Failed to update todo");
  }

  return res.status(200).json({
    message: "Todo updated successfully",
    todo: result.todo,
  });
}

export async function deleteTodo(req: Request, res: Response): Promise<Response> {
  const { todoId } = parseWithSchema(todoIdParamSchema, req.params);

  const result = await deleteTodoById(todoId, req.user!.userId);

  if ("error" in result && result.error === "TODO_NOT_FOUND") {
    throw new AppError(404, "Todo not found");
  }

  if ("error" in result && result.error === "FORBIDDEN") {
    throw new AppError(403, "Forbidden: you can only delete todos in your own lists");
  }

  if ("error" in result) {
    throw new AppError(500, "Failed to delete todo");
  }

  return res.status(200).json({ message: "Todo deleted successfully" });
}
