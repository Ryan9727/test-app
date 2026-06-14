import { useEffect, useState } from "react";
import { Todo, fetchTodos, createTodo, toggleTodo, deleteTodo } from "./api";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetchTodos().then(setTodos);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const todo = await createTodo(input.trim());
    setTodos((prev) => [...prev, todo]);
    setInput("");
  }

  async function handleToggle(todo: Todo) {
    const updated = await toggleTodo(todo.id, !todo.completed);
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
  }

  async function handleDelete(id: number) {
    await deleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>Todos</h1>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="New todo…"
          style={{ flex: 1, padding: "6px 10px", fontSize: 16 }}
        />
        <button type="submit" style={{ padding: "6px 16px" }}>Add</button>
      </form>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo)}
            />
            <span style={{ flex: 1, textDecoration: todo.completed ? "line-through" : "none" }}>
              {todo.title}
            </span>
            <button onClick={() => handleDelete(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
