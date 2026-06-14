import { useEffect, useState } from "react";
import { Todo, fetchTodos, createTodo, toggleTodo, deleteTodo, getToken, clearToken } from "./api";
import AuthPage from "./AuthPage";
import "./App.css";

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (authed) fetchTodos().then(setTodos);
  }, [authed]);

  function handleLogout() {
    clearToken();
    setAuthed(false);
    setTodos([]);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const todo = await createTodo(title.trim(), description.trim());
    setTodos((prev) => [todo, ...prev]);
    setTitle("");
    setDescription("");
  }

  async function handleToggle(todo: Todo) {
    const updated = await toggleTodo(todo.id, !todo.completed);
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
  }

  async function handleDelete(id: number) {
    await deleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  if (!authed) {
    return <AuthPage onSuccess={() => setAuthed(true)} />;
  }

  const completed = todos.filter((t) => t.completed).length;

  return (
    <div className="container">
      <div className="header-row">
        <div>
          <h1>My Tasks</h1>
          <p className="subtitle">Stay organised, get things done.</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Log out</button>
      </div>

      <form className="add-form" onSubmit={handleAdd}>
        <div className="add-fields">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
          />
          <input
            className="desc-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)..."
          />
        </div>
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
              <div className="todo-text">
                <span className="todo-title">{todo.title}</span>
                {todo.description && (
                  <span className="todo-description">{todo.description}</span>
                )}
              </div>
              <button className="delete-btn" onClick={() => handleDelete(todo.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
