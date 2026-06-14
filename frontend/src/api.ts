const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${BASE}/todos`);
  return res.json();
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(`${BASE}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function toggleTodo(id: number, completed: boolean): Promise<Todo> {
  const res = await fetch(`${BASE}/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  return res.json();
}

export async function deleteTodo(id: number): Promise<void> {
  await fetch(`${BASE}/todos/${id}`, { method: "DELETE" });
}
