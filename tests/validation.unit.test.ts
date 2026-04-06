import { describe, expect, it } from "vitest";
import {
  listBodySchema,
  loginSchema,
  parseWithSchema,
  signupSchema,
  todoBodySchema,
  todoUpdateSchema,
} from "../utils/validation.js";

describe("validation utils", () => {
  it("accepts valid signup credentials and trims username", () => {
    expect(parseWithSchema(signupSchema, { username: "  valid_user  ", password: "secret123" })).toEqual({
      username: "valid_user",
      password: "secret123",
    });
  });

  it("rejects invalid usernames and short signup passwords", () => {
    expect(() => parseWithSchema(signupSchema, { username: "ab", password: "secret123" })).toThrow(
      "Username must be 3-30 characters and contain only letters, numbers, and underscores"
    );
    expect(() => parseWithSchema(signupSchema, { username: "valid_user", password: "short" })).toThrow(
      "Password must be at least 8 characters long"
    );
  });

  it("accepts login credentials without requiring signup password length", () => {
    expect(parseWithSchema(loginSchema, { username: "valid_user", password: "short" })).toEqual({
      username: "valid_user",
      password: "short",
    });
  });

  it("validates and trims list names", () => {
    expect(parseWithSchema(listBodySchema, { name: "  Work  " })).toEqual({ name: "Work" });
    expect(() => parseWithSchema(listBodySchema, { name: "" })).toThrow("List name is required");
  });

  it("validates tasks and todo updates", () => {
    expect(parseWithSchema(todoBodySchema, { task: "  Finish tests  ", priority: "high", dueDate: "2026-04-10" })).toEqual({
      task: "Finish tests",
      priority: "high",
      dueDate: "2026-04-10",
    });
    expect(() => parseWithSchema(todoBodySchema, { task: "" })).toThrow("Task is required");

    expect(parseWithSchema(todoUpdateSchema, { completed: true })).toEqual({ completed: true });
    expect(
      parseWithSchema(todoUpdateSchema, {
        task: "  Update docs  ",
        completed: false,
        archived: true,
        priority: "low",
        dueDate: null,
      })
    ).toEqual({
      task: "Update docs",
      completed: false,
      archived: true,
      priority: "low",
      dueDate: null,
    });
    expect(() => parseWithSchema(todoUpdateSchema, {})).toThrow("Provide at least one field to update");
  });
});
