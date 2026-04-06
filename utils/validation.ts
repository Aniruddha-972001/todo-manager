interface ValidationSuccess<T> {
  value: T;
}

interface ValidationFailure {
  error: string;
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateCredentials(
  username: unknown,
  password: unknown,
  mode: "signup" | "login"
): ValidationResult<{ username: string; password: string }> {
  if (!isNonEmptyString(username) || typeof password !== "string" || password.length === 0) {
    return { error: "Username and password are required" };
  }

  const normalizedUsername = username.trim();

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    return {
      error: "Username must be 3-30 characters and contain only letters, numbers, and underscores",
    };
  }

  if (mode === "signup" && password.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  if (password.length > 72) {
    return { error: "Password must be 72 characters or fewer" };
  }

  return {
    value: {
      username: normalizedUsername,
      password,
    },
  };
}

export function validateListName(name: unknown): ValidationResult<string> {
  if (!isNonEmptyString(name)) {
    return { error: "List name is required" };
  }

  const normalizedName = name.trim();

  if (normalizedName.length > 80) {
    return { error: "List name must be 80 characters or fewer" };
  }

  return { value: normalizedName };
}

export function validateTask(task: unknown): ValidationResult<string> {
  if (!isNonEmptyString(task)) {
    return { error: "Task is required" };
  }

  const normalizedTask = task.trim();

  if (normalizedTask.length > 200) {
    return { error: "Task must be 200 characters or fewer" };
  }

  return { value: normalizedTask };
}

export function validateTodoUpdate(input: unknown): ValidationResult<{
  task?: string;
  completed?: boolean;
}> {
  if (typeof input !== "object" || input === null) {
    return { error: "Request body must be an object" };
  }

  const candidate = input as { task?: unknown; completed?: unknown };
  const updates: { task?: string; completed?: boolean } = {};

  if (candidate.task !== undefined) {
    const taskResult = validateTask(candidate.task);

    if ("error" in taskResult) {
      return taskResult;
    }

    updates.task = taskResult.value;
  }

  if (candidate.completed !== undefined) {
    if (typeof candidate.completed !== "boolean") {
      return { error: "Completed must be a boolean value" };
    }

    updates.completed = candidate.completed;
  }

  if (updates.task === undefined && updates.completed === undefined) {
    return { error: "Provide at least one field to update" };
  }

  return { value: updates };
}
