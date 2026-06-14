import { useEffect, useState } from "react";
import { Todo, fetchTodos, createTodo, toggleTodo, deleteTodo } from "./api";
import "./App.css";

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
    setTodos((prev) => [todo, ...prev]);
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

  const completed = todos.filter((t) => t.completed).length;

  return (
    <div className="container">
      <h1>My Tasks</h1>
      <p className="subtitle">Stay organised, get things done.</p>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task..."
        />
        <button type="submit">+ Add</button>
      </form>

      <div className="stats">
        <div className="stat">
          <div className="stat-number">{todos.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat">
          <div className="stat-number">{todos.length - completed}</div>
          <div className="stat-label">Remaining</div>
        </div>
        <div className="stat">
          <div className="stat-number">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {todos.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <p>No tasks yet. Add one above!</p>
        </div>
      ) : (
        <ul className="todo-list" style={{ listStyle: "none", padding: 0 }}>
          {todos.map((todo) => (
            <li key={todo.id} className={`todo-item ${todo.completed ? "completed" : ""}`}>
              <div
                className={`checkbox ${todo.completed ? "checked" : ""}`}
                onClick={() => handleToggle(todo)}
              />
              <span className="todo-title">{todo.title}</span>
              <button className="delete-btn" onClick={() => handleDelete(todo.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
