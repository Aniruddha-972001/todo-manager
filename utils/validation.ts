import { z, type ZodType } from "zod";
import { AppError } from "./errors.js";

const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_]{3,30}$/, "Username must be 3-30 characters and contain only letters, numbers, and underscores");

const passwordSchema = z
  .string()
  .min(1, "Username and password are required")
  .max(72, "Password must be 72 characters or fewer");

const listNameSchema = z
  .string()
  .trim()
  .min(1, "List name is required")
  .max(80, "List name must be 80 characters or fewer");

const taskSchema = z
  .string()
  .trim()
  .min(1, "Task is required")
  .max(200, "Task must be 200 characters or fewer");

const prioritySchema = z.enum(["low", "medium", "high"], {
  message: "Priority must be low, medium, or high",
});

const dueDateSchema = z
  .union([
    z.string().date("Due date must be in YYYY-MM-DD format"),
    z.null(),
  ])
  .optional();

export const signupSchema = z.object({
  username: usernameSchema,
  password: passwordSchema.min(8, "Password must be at least 8 characters long"),
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const listBodySchema = z.object({
  name: listNameSchema,
});

export const todoBodySchema = z.object({
  task: taskSchema,
  priority: prioritySchema.optional(),
  dueDate: dueDateSchema,
});

export const todoUpdateSchema = z
  .object({
    task: taskSchema.optional(),
    completed: z.boolean({ message: "Completed must be a boolean value" }).optional(),
    archived: z.boolean({ message: "Archived must be a boolean value" }).optional(),
    priority: prioritySchema.optional(),
    dueDate: dueDateSchema,
  })
  .refine(
    (value) =>
      value.task !== undefined ||
      value.completed !== undefined ||
      value.archived !== undefined ||
      value.priority !== undefined ||
      value.dueDate !== undefined,
    {
    message: "Provide at least one field to update",
  });

export const idParamSchema = z.object({
  id: z.string().min(1, "List id is required"),
});

export const todoIdParamSchema = z.object({
  todoId: z.string().min(1, "Todo id is required"),
});

export const reorderTodosSchema = z.object({
  orderedTodoIds: z.array(z.string().min(1, "Todo id is required")).min(1, "Provide at least one todo id"),
});

function formatZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid request";
}

export function parseWithSchema<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new AppError(400, formatZodError(result.error));
  }

  return result.data;
}
