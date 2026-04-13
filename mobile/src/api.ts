import type { AuthUser, TodoItem, TodoList, TodoListWithTodos, TodoPriority } from "./types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

let accessToken: string | null = null;

function buildHeaders(additionalHeaders: HeadersInit = {}) {
  const headers = new Headers(additionalHeaders);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;

    if (response.status === 401 || response.status === 403) {
      await clearStoredToken();
    }

    throw new Error(errorBody?.message ?? "Request failed");
  }

  return (await response.json()) as T;
}

export async function hydrateStoredToken() {
  return accessToken;
}

export async function setStoredToken(token: string | null) {
  accessToken = token;
}

export async function clearStoredToken() {
  await setStoredToken(null);
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function signup(username: string, password: string) {
  return request<{ message: string; user: { id: string; username: string } }>("/api/signup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string) {
  const response = await request<{ message: string; token: string }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  await setStoredToken(response.token);
  return response;
}

export async function logout() {
  try {
    await request<{ message: string }>("/api/logout", {
      method: "POST",
    });
  } finally {
    await clearStoredToken();
  }
}

export async function getCurrentUser() {
  return request<{ message: string; user: AuthUser }>("/api/me");
}

export async function getLists() {
  return request<{ message: string; lists: TodoList[] }>("/api/lists");
}

export async function createList(name: string) {
  return request<{ message: string; list: TodoList }>("/api/lists", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getList(id: string) {
  return request<{ message: string; list: TodoListWithTodos }>(`/api/lists/${id}`);
}

export async function createTodo(
  listId: string,
  payload: { task: string; priority?: TodoPriority; dueDate?: string | null }
) {
  return request<{ message: string; todo: TodoItem }>(`/api/lists/${listId}/todos`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTodo(
  todoId: string,
  payload: Partial<Pick<TodoItem, "task" | "completed" | "archived" | "priority" | "dueDate">>
) {
  return request<{ message: string; todo: TodoItem }>(`/api/todos/${todoId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTodo(todoId: string) {
  return request<{ message: string }>(`/api/todos/${todoId}`, {
    method: "DELETE",
  });
}

export async function reorderTodos(listId: string, orderedTodoIds: string[]) {
  return request<{ message: string }>(`/api/lists/${listId}/todos/reorder`, {
    method: "POST",
    body: JSON.stringify({ orderedTodoIds }),
  });
}
