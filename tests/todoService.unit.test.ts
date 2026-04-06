import { beforeEach, describe, expect, it, vi } from "vitest";
import type { List, Todo } from "../models/dataStore.js";

const {
  findListByIdMock,
  deleteTodoMock,
  findTodoByIdMock,
  updateTodoMock,
} = vi.hoisted(() => ({
  findListByIdMock: vi.fn(),
  deleteTodoMock: vi.fn(),
  findTodoByIdMock: vi.fn(),
  updateTodoMock: vi.fn(),
}));

vi.mock("../models/listModel.js", () => ({
  findListById: findListByIdMock,
}));

vi.mock("../models/todoModel.js", () => ({
  deleteTodo: deleteTodoMock,
  findTodoById: findTodoByIdMock,
  updateTodo: updateTodoMock,
}));

const { deleteTodoById, updateTodoDetails } = await import("../services/todoService.js");

describe("todoService", () => {
  beforeEach(() => {
    findListByIdMock.mockReset();
    deleteTodoMock.mockReset();
    findTodoByIdMock.mockReset();
    updateTodoMock.mockReset();
  });

  it("returns not found when the todo does not exist", async () => {
    findTodoByIdMock.mockResolvedValue(undefined);

    const result = await updateTodoDetails("todo-1", { completed: true }, "user-1");

    expect(result).toEqual({ error: "TODO_NOT_FOUND" });
  });

  it("rejects updates for todos in lists the user does not own", async () => {
    const todo: Todo = {
      id: "todo-1",
      task: "Ship",
      completed: false,
      archived: false,
      priority: "medium",
      dueDate: null,
      position: 0,
      listId: "list-1",
    };
    const list: List = { id: "list-1", name: "Sprint", creatorId: "other-user" };

    findTodoByIdMock.mockResolvedValue(todo);
    findListByIdMock.mockResolvedValue(list);

    const result = await updateTodoDetails("todo-1", { completed: true }, "user-1");

    expect(result).toEqual({ error: "FORBIDDEN" });
  });

  it("updates a todo when the user owns the parent list", async () => {
    const todo: Todo = {
      id: "todo-1",
      task: "Ship",
      completed: false,
      archived: false,
      priority: "medium",
      dueDate: null,
      position: 0,
      listId: "list-1",
    };
    const list: List = { id: "list-1", name: "Sprint", creatorId: "user-1" };
    const updatedTodo: Todo = { ...todo, completed: true, priority: "high", dueDate: "2026-04-09" };

    findTodoByIdMock.mockResolvedValue(todo);
    findListByIdMock.mockResolvedValue(list);
    updateTodoMock.mockResolvedValue(updatedTodo);

    const result = await updateTodoDetails(
      "todo-1",
      { completed: true, priority: "high", dueDate: "2026-04-09" },
      "user-1"
    );

    expect(updateTodoMock).toHaveBeenCalledWith("todo-1", {
      completed: true,
      priority: "high",
      dueDate: "2026-04-09",
    });
    expect(result).toEqual({ todo: updatedTodo });
  });

  it("deletes a todo when the user owns the parent list", async () => {
    const todo: Todo = {
      id: "todo-1",
      task: "Ship",
      completed: false,
      archived: false,
      priority: "medium",
      dueDate: null,
      position: 0,
      listId: "list-1",
    };
    const list: List = { id: "list-1", name: "Sprint", creatorId: "user-1" };

    findTodoByIdMock.mockResolvedValue(todo);
    findListByIdMock.mockResolvedValue(list);

    const result = await deleteTodoById("todo-1", "user-1");

    expect(deleteTodoMock).toHaveBeenCalledWith("todo-1");
    expect(result).toEqual({ success: true });
  });
});
