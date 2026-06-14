from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import init_db, get_cursor


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TodoCreate(BaseModel):
    title: str
    description: str | None = None


class TodoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    completed: bool | None = None


@app.get("/todos")
def list_todos():
    with get_cursor() as cur:
        cur.execute("SELECT * FROM todos")
        return cur.fetchall()


@app.post("/todos", status_code=201)
def create_todo(body: TodoCreate):
    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO todos (title, description) VALUES (%s, %s) RETURNING *",
            (body.title, body.description),
        )
        return dict(cur.fetchone())


@app.patch("/todos/{todo_id}")
def update_todo(todo_id: int, body: TodoUpdate):
    with get_cursor() as cur:
        cur.execute("SELECT * FROM todos WHERE id = %s", (todo_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        todo = dict(row)
        new_title = body.title if body.title is not None else todo["title"]
        new_description = body.description if body.description is not None else todo["description"]
        new_completed = body.completed if body.completed is not None else todo["completed"]
        cur.execute(
            "UPDATE todos SET title = %s, description = %s, completed = %s WHERE id = %s RETURNING *",
            (new_title, new_description, new_completed, todo_id),
        )
        return dict(cur.fetchone())


@app.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int):
    with get_cursor() as cur:
        cur.execute("DELETE FROM todos WHERE id = %s RETURNING id", (todo_id,))
        if cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Not found")
