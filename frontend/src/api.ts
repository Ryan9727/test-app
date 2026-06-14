const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
}

// --- token storage ---

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// --- auth ---

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Login failed");
  }
  const data = await res.json();
  setToken(data.access_token);
}

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Registration failed");
  }
  const data = await res.json();
  setToken(data.access_token);
}

// --- todos ---

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${BASE}/todos`, { headers: authHeaders() });
  return res.json();
}

export async function createTodo(title: string, description: string): Promise<Todo> {
  const res = await fetch(`${BASE}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title, description: description || null }),
  });
  return res.json();
}

export async function toggleTodo(id: number, completed: boolean): Promise<Todo> {
  const res = await fetch(`${BASE}/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ completed }),
  });
  return res.json();
}

export async function deleteTodo(id: number): Promise<void> {
  await fetch(`${BASE}/todos/${id}`, { method: "DELETE", headers: authHeaders() });
}
