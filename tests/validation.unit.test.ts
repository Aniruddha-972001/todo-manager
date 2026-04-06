import { describe, expect, it } from "vitest";
import {
  validateCredentials,
  validateListName,
  validateTask,
  validateTodoUpdate,
} from "../utils/validation.js";

describe("validation utils", () => {
  it("accepts valid signup credentials and trims username", () => {
    const result = validateCredentials("  valid_user  ", "secret123", "signup");

    expect("value" in result).toBe(true);
    if ("value" in result) {
      expect(result.value).toEqual({
        username: "valid_user",
        password: "secret123",
      });
    }
  });

  it("rejects invalid usernames and short signup passwords", () => {
    expect(validateCredentials("ab", "secret123", "signup")).toEqual({
      error: "Username must be 3-30 characters and contain only letters, numbers, and underscores",
    });

    expect(validateCredentials("valid_user", "short", "signup")).toEqual({
      error: "Password must be at least 8 characters long",
    });
  });

  it("validates and trims list names", () => {
    expect(validateListName("  Work  ")).toEqual({ value: "Work" });
    expect(validateListName("")).toEqual({ error: "List name is required" });
  });

  it("validates tasks and todo updates", () => {
    expect(validateTask("  Finish tests  ")).toEqual({ value: "Finish tests" });
    expect(validateTask("")).toEqual({ error: "Task is required" });

    expect(validateTodoUpdate({ completed: true })).toEqual({
      value: { completed: true },
    });

    expect(validateTodoUpdate({ task: "  Update docs  ", completed: false })).toEqual({
      value: { task: "Update docs", completed: false },
    });

    expect(validateTodoUpdate({})).toEqual({
      error: "Provide at least one field to update",
    });
  });
});
