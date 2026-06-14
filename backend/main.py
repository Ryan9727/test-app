import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from database import init_db, get_cursor

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


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


# --- models ---

class UserCreate(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TodoCreate(BaseModel):
    title: str
    description: str | None = None


class TodoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    completed: bool | None = None


# --- auth helpers ---

def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    with get_cursor() as cur:
        cur.execute("SELECT id, email FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return dict(user)


# --- auth endpoints ---

@app.post("/auth/register", response_model=Token, status_code=201)
def register(body: UserCreate):
    with get_cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (body.email,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Email already registered")
        hashed = pwd_context.hash(body.password)
        cur.execute(
            "INSERT INTO users (email, hashed_password) VALUES (%s, %s) RETURNING id",
            (body.email, hashed),
        )
        user_id = cur.fetchone()["id"]
    return Token(access_token=create_access_token(user_id))


@app.post("/auth/login", response_model=Token)
def login(body: UserCreate):
    with get_cursor() as cur:
        cur.execute("SELECT id, hashed_password FROM users WHERE email = %s", (body.email,))
        user = cur.fetchone()
    if not user or not pwd_context.verify(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return Token(access_token=create_access_token(user["id"]))


# --- todo endpoints ---

@app.get("/todos")
def list_todos(current_user: dict = Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute("SELECT * FROM todos WHERE user_id = %s ORDER BY id DESC", (current_user["id"],))
        return cur.fetchall()


@app.post("/todos", status_code=201)
def create_todo(body: TodoCreate, current_user: dict = Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO todos (title, description, user_id) VALUES (%s, %s, %s) RETURNING *",
            (body.title, body.description, current_user["id"]),
        )
        return dict(cur.fetchone())


@app.patch("/todos/{todo_id}")
def update_todo(todo_id: int, body: TodoUpdate, current_user: dict = Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute("SELECT * FROM todos WHERE id = %s AND user_id = %s", (todo_id, current_user["id"]))
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
def delete_todo(todo_id: int, current_user: dict = Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute(
            "DELETE FROM todos WHERE id = %s AND user_id = %s RETURNING id",
            (todo_id, current_user["id"]),
        )
        if cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Not found")
