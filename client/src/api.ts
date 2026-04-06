import type { AuthUser, TodoItem, TodoList, TodoListWithTodos, TodoPriority } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? window.location.origin;

let accessToken: string | null = localStorage.getItem("todo-manager-token");
let refreshPromise: Promise<string | null> | null = null;

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

async function executeRequest(path: string, options: RequestInit = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: buildHeaders(options.headers),
  });
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/api/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        setToken(null);
        return null;
      }

      const payload = (await response.json()) as { token: string };
      setToken(payload.token);
      return payload.token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function request<T>(path: string, options: RequestInit = {}, retryOnAuthFailure = true): Promise<T> {
  let response = await executeRequest(path, options);

  if ((response.status === 401 || response.status === 403) && retryOnAuthFailure && path !== "/api/refresh") {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      response = await executeRequest(path, options);
    }
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorBody?.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getStoredToken() {
  return accessToken;
}

export function setToken(token: string | null) {
  accessToken = token;

  if (token) {
    localStorage.setItem("todo-manager-token", token);
  } else {
    localStorage.removeItem("todo-manager-token");
  }
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

  setToken(response.token);
  return response;
}

export async function refreshToken() {
  const token = await refreshAccessToken();

  if (!token) {
    throw new Error("Unable to refresh session");
  }

  return {
    message: "Access token refreshed successfully",
    token,
  };
}

export async function logout() {
  await request<{ message: string }>("/api/logout", {
    method: "POST",
  });

  setToken(null);
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

export async function updateList(id: string, name: string) {
  return request<{ message: string; list: TodoList }>(`/api/lists/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deleteList(id: string) {
  return request<{ message: string }>(`/api/lists/${id}`, {
    method: "DELETE",
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
