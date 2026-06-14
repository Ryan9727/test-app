import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

DATABASE_URL = os.environ["DATABASE_URL"]


def init_db():
    with get_cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                completed BOOLEAN NOT NULL DEFAULT FALSE
            )
        """)
        cur.execute("ALTER TABLE todos ADD COLUMN IF NOT EXISTS description TEXT")


@contextmanager
def get_cursor():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        cur = conn.cursor()
        yield cur
        conn.commit()
    finally:
        conn.close()
