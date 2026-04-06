import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";

export function notFoundMiddleware(req: Request, res: Response): Response {
  return res.status(404).json({
    message: "Route not found",
  });
}

export function errorMiddleware(error: unknown, req: Request, res: Response, next: NextFunction): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Internal server error",
  });
}
