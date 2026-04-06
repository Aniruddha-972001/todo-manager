import request from "supertest";
import fs from "fs";
import path from "path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.DB_PATH = "./data/test-todo-manager.sqlite";

const { default: app } = await import("../app.js");

let databaseModule: typeof import("../config/database.js");

beforeAll(async () => {
  databaseModule = await import("../config/database.js");
  const dbPath = path.resolve(process.env.DB_PATH!);

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  await databaseModule.initializeDatabase();
});

beforeEach(async () => {
  await databaseModule.resetDatabase();
});

afterAll(async () => {
  await databaseModule.closeDatabase();

  const dbPath = path.resolve(process.env.DB_PATH!);

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
});

async function signupAndLogin(username: string, password = "secret123") {
  await request(app).post("/api/signup").send({ username, password }).expect(201);

  const agent = request.agent(app);
  const loginResponse = await agent.post("/api/login").send({ username, password }).expect(200);

  return {
    agent,
    token: loginResponse.body.token as string,
  };
}

describe("API integration", () => {
  it("signs up, logs in, and returns the current user", async () => {
    const credentials = {
      username: "tester_one",
      password: "secret123",
    };

    const signupResponse = await request(app).post("/api/signup").send(credentials).expect(201);

    expect(signupResponse.body.user.username).toBe(credentials.username);

    const loginResponse = await request(app).post("/api/login").send(credentials).expect(200);

    expect(loginResponse.body.token).toBeTypeOf("string");

    const meResponse = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .expect(200);

    expect(meResponse.body.user.userId).toBeTypeOf("string");
    expect(meResponse.body.user.role).toBe("user");
  });

  it("rejects invalid signup payloads", async () => {
    const response = await request(app)
      .post("/api/signup")
      .send({ username: "ab", password: "123" })
      .expect(400);

    expect(response.body.message).toContain("Username");
  });

  it("creates, fetches, updates, and deletes user-owned lists", async () => {
    const { token } = await signupAndLogin("list_owner");

    const createResponse = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Work Items" })
      .expect(201);

    const listId = createResponse.body.list.id as string;

    const listResponse = await request(app)
      .get(`/api/lists/${listId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(listResponse.body.list.name).toBe("Work Items");
    expect(listResponse.body.list.todos).toEqual([]);

    const updateResponse = await request(app)
      .patch(`/api/lists/${listId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Work Items" })
      .expect(200);

    expect(updateResponse.body.list.name).toBe("Updated Work Items");

    const listsResponse = await request(app)
      .get("/api/lists")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(listsResponse.body.lists).toHaveLength(1);
    expect(listsResponse.body.lists[0].name).toBe("Updated Work Items");

    await request(app)
      .delete(`/api/lists/${listId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const finalListsResponse = await request(app)
      .get("/api/lists")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(finalListsResponse.body.lists).toEqual([]);
  });

  it("creates, reads, updates, and deletes todos", async () => {
    const { token } = await signupAndLogin("todo_owner");

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Daily Tasks" })
      .expect(201);

    const listId = listResponse.body.list.id as string;

    const todoResponse = await request(app)
      .post(`/api/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "Finish testing flow", priority: "high", dueDate: "2026-04-12" })
      .expect(201);

    const todoId = todoResponse.body.todo.id as string;
    expect(todoResponse.body.todo.priority).toBe("high");
    expect(todoResponse.body.todo.dueDate).toBe("2026-04-12");
    expect(todoResponse.body.todo.archived).toBe(false);

    const todosResponse = await request(app)
      .get(`/api/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(todosResponse.body.todos).toHaveLength(1);
    expect(todosResponse.body.todos[0].task).toBe("Finish testing flow");
    expect(todosResponse.body.todos[0].position).toBe(0);

    const updatedTodoResponse = await request(app)
      .patch(`/api/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        completed: true,
        task: "Finish testing flow today",
        archived: true,
        priority: "low",
        dueDate: null,
      })
      .expect(200);

    expect(updatedTodoResponse.body.todo.completed).toBe(true);
    expect(updatedTodoResponse.body.todo.task).toBe("Finish testing flow today");
    expect(updatedTodoResponse.body.todo.archived).toBe(true);
    expect(updatedTodoResponse.body.todo.priority).toBe("low");
    expect(updatedTodoResponse.body.todo.dueDate).toBeNull();

    await request(app)
      .delete(`/api/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const finalTodosResponse = await request(app)
      .get(`/api/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(finalTodosResponse.body.todos).toEqual([]);
  });

  it("reorders todos within a list", async () => {
    const { token } = await signupAndLogin("ordering_owner");

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Roadmap" })
      .expect(201);

    const listId = listResponse.body.list.id as string;

    const firstTodo = await request(app)
      .post(`/api/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "First task" })
      .expect(201);

    const secondTodo = await request(app)
      .post(`/api/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "Second task", priority: "high" })
      .expect(201);

    await request(app)
      .post(`/api/lists/${listId}/todos/reorder`)
      .set("Authorization", `Bearer ${token}`)
      .send({ orderedTodoIds: [secondTodo.body.todo.id, firstTodo.body.todo.id] })
      .expect(200);

    const refreshedList = await request(app)
      .get(`/api/lists/${listId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(refreshedList.body.list.todos.map((todo: { id: string }) => todo.id)).toEqual([
      secondTodo.body.todo.id,
      firstTodo.body.todo.id,
    ]);
  });

  it("keeps data scoped to the logged-in user", async () => {
    const firstUser = await signupAndLogin("alice_user");
    const secondUser = await signupAndLogin("bob_user");

    const createResponse = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${firstUser.token}`)
      .send({ name: "Alice Private List" })
      .expect(201);

    const listId = createResponse.body.list.id as string;

    await request(app)
      .get("/api/lists")
      .set("Authorization", `Bearer ${secondUser.token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.lists).toEqual([]);
      });

    await request(app)
      .get(`/api/lists/${listId}`)
      .set("Authorization", `Bearer ${secondUser.token}`)
      .expect(404);
  });

  it("logs out and invalidates refresh for that session", async () => {
    const { agent, token } = await signupAndLogin("logout_user");

    await agent.get("/api/me").set("Authorization", `Bearer ${token}`).expect(200);

    await agent.post("/api/refresh").expect(200);
    await agent.post("/api/logout").expect(200);
    await agent.post("/api/refresh").expect(401);
  });
});
