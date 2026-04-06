import { beforeEach, describe, expect, it, vi } from "vitest";
import type { List, Todo } from "../models/dataStore.js";

const {
  randomUuidMock,
  createListMock,
  deleteListMock,
  findListByIdMock,
  getListsByCreatorIdMock,
  updateListNameByIdMock,
  createTodoMock,
  getNextTodoPositionMock,
  getTodosByListIdMock,
  reorderTodosMock,
} = vi.hoisted(() => ({
  randomUuidMock: vi.fn(),
  createListMock: vi.fn(),
  deleteListMock: vi.fn(),
  findListByIdMock: vi.fn(),
  getListsByCreatorIdMock: vi.fn(),
  updateListNameByIdMock: vi.fn(),
  createTodoMock: vi.fn(),
  getNextTodoPositionMock: vi.fn(),
  getTodosByListIdMock: vi.fn(),
  reorderTodosMock: vi.fn(),
}));

vi.mock("node:crypto", () => ({
  default: {
    randomUUID: randomUuidMock,
  },
}));

vi.mock("../models/listModel.js", () => ({
  createList: createListMock,
  deleteList: deleteListMock,
  findListById: findListByIdMock,
  getListsByCreatorId: getListsByCreatorIdMock,
  updateListNameById: updateListNameByIdMock,
}));

vi.mock("../models/todoModel.js", () => ({
  createTodo: createTodoMock,
  getNextTodoPosition: getNextTodoPositionMock,
  getTodosByListId: getTodosByListIdMock,
  reorderTodos: reorderTodosMock,
}));

const {
  addList,
  addTodoToList,
  deleteListById,
  fetchListById,
  fetchListTodos,
  fetchLists,
  updateListName,
  reorderListTodos,
} = await import("../services/listService.js");

describe("listService", () => {
  beforeEach(() => {
    randomUuidMock.mockReset();
    createListMock.mockReset();
    deleteListMock.mockReset();
    findListByIdMock.mockReset();
    getListsByCreatorIdMock.mockReset();
    updateListNameByIdMock.mockReset();
    createTodoMock.mockReset();
    getNextTodoPositionMock.mockReset();
    getTodosByListIdMock.mockReset();
    reorderTodosMock.mockReset();
  });

  it("fetches only the current user's lists", async () => {
    const lists: List[] = [{ id: "1", name: "Work", creatorId: "user-1" }];
    getListsByCreatorIdMock.mockResolvedValue(lists);

    const result = await fetchLists("user-1");

    expect(getListsByCreatorIdMock).toHaveBeenCalledWith("user-1");
    expect(result).toEqual(lists);
  });

  it("creates a list with a generated id", async () => {
    randomUuidMock.mockReturnValue("list-1");
    createListMock.mockImplementation(async (list: List) => list);

    const result = await addList("Sprint", "user-1");

    expect(createListMock).toHaveBeenCalledWith({
      id: "list-1",
      name: "Sprint",
      creatorId: "user-1",
    });
    expect(result).toEqual({
      id: "list-1",
      name: "Sprint",
      creatorId: "user-1",
    });
  });

  it("returns a list with todos for the owner", async () => {
    findListByIdMock.mockResolvedValue({ id: "list-1", name: "Sprint", creatorId: "user-1" });
    getTodosByListIdMock.mockResolvedValue([
      {
        id: "todo-1",
        task: "Ship",
        completed: false,
        archived: false,
        priority: "medium",
        dueDate: null,
        position: 0,
        listId: "list-1",
      },
    ]);

    const result = await fetchListById("list-1", "user-1");

    expect(result).toEqual({
      id: "list-1",
      name: "Sprint",
      creatorId: "user-1",
      todos: [
        {
          id: "todo-1",
          task: "Ship",
          completed: false,
          archived: false,
          priority: "medium",
          dueDate: null,
          position: 0,
          listId: "list-1",
        },
      ],
    });
  });

  it("rejects list updates for non-owners", async () => {
    findListByIdMock.mockResolvedValue({ id: "list-1", name: "Sprint", creatorId: "other-user" });

    const result = await updateListName("list-1", "Updated", "user-1");

    expect(result).toEqual({ error: "FORBIDDEN" });
    expect(updateListNameByIdMock).not.toHaveBeenCalled();
  });

  it("returns todos for a list when the user owns it", async () => {
    const list: List = { id: "list-1", name: "Sprint", creatorId: "user-1" };
    const todos: Todo[] = [
      {
        id: "todo-1",
        task: "Ship",
        completed: false,
        archived: false,
        priority: "medium",
        dueDate: null,
        position: 0,
        listId: "list-1",
      },
    ];

    findListByIdMock.mockResolvedValue(list);
    getTodosByListIdMock.mockResolvedValue(todos);

    const result = await fetchListTodos("list-1", "user-1");

    expect(result).toEqual({ list, todos });
  });

  it("creates a todo on an owned list", async () => {
    randomUuidMock.mockReturnValue("todo-1");
    findListByIdMock.mockResolvedValue({ id: "list-1", name: "Sprint", creatorId: "user-1" });
    getNextTodoPositionMock.mockResolvedValue(0);
    createTodoMock.mockImplementation(async (todo: Todo) => todo);

    const result = await addTodoToList("list-1", "Ship docs", "user-1", {
      priority: "high",
      dueDate: "2026-04-09",
    });

    expect(createTodoMock).toHaveBeenCalledWith({
      id: "todo-1",
      task: "Ship docs",
      completed: false,
      archived: false,
      priority: "high",
      dueDate: "2026-04-09",
      position: 0,
      listId: "list-1",
    });
    expect(result).toEqual({
      todo: {
        id: "todo-1",
        task: "Ship docs",
        completed: false,
        archived: false,
        priority: "high",
        dueDate: "2026-04-09",
        position: 0,
        listId: "list-1",
      },
    });
  });

  it("deletes a list for the owner", async () => {
    findListByIdMock.mockResolvedValue({ id: "list-1", name: "Sprint", creatorId: "user-1" });

    const result = await deleteListById("list-1", "user-1");

    expect(deleteListMock).toHaveBeenCalledWith("list-1");
    expect(result).toEqual({ success: true });
  });

  it("reorders todos when the payload matches the list", async () => {
    findListByIdMock.mockResolvedValue({ id: "list-1", name: "Sprint", creatorId: "user-1" });
    getTodosByListIdMock.mockResolvedValue([
      {
        id: "todo-1",
        task: "First",
        completed: false,
        archived: false,
        priority: "medium",
        dueDate: null,
        position: 0,
        listId: "list-1",
      },
      {
        id: "todo-2",
        task: "Second",
        completed: false,
        archived: false,
        priority: "low",
        dueDate: null,
        position: 1,
        listId: "list-1",
      },
    ]);

    const result = await reorderListTodos("list-1", ["todo-2", "todo-1"], "user-1");

    expect(reorderTodosMock).toHaveBeenCalledWith("list-1", ["todo-2", "todo-1"]);
    expect(result).toEqual({ success: true });
  });
});
