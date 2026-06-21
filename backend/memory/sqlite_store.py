import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional


class SQLiteStore:
    def __init__(self, db_path: str):
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    last_seen TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER REFERENCES users(id),
                    is_multi_user BOOLEAN DEFAULT 0,
                    started_at TEXT NOT NULL,
                    ended_at TEXT,
                    summary TEXT
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id INTEGER REFERENCES sessions(id),
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                );
            """)

    # ── Users ──────────────────────────────────────────────────────────────

    def create_user(self, name: str) -> int:
        now = datetime.utcnow().isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.execute(
                "INSERT INTO users (name, created_at, last_seen) VALUES (?, ?, ?)",
                (name, now, now),
            )
            return cur.lastrowid

    def get_user_by_name(self, name: str) -> Optional[dict]:
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute(
                "SELECT id, name, created_at, last_seen FROM users WHERE LOWER(name) = LOWER(?)",
                (name,),
            ).fetchone()
        if row:
            return {"id": row[0], "name": row[1], "created_at": row[2], "last_seen": row[3]}
        return None

    def touch_user(self, user_id: int):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "UPDATE users SET last_seen = ? WHERE id = ?",
                (datetime.utcnow().isoformat(), user_id),
            )

    # ── Sessions ───────────────────────────────────────────────────────────

    def create_session(self, user_id: Optional[int] = None, multi_user: bool = False) -> int:
        now = datetime.utcnow().isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.execute(
                "INSERT INTO sessions (user_id, is_multi_user, started_at) VALUES (?, ?, ?)",
                (user_id, int(multi_user), now),
            )
            return cur.lastrowid

    def close_session(self, session_id: int, summary: str = ""):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "UPDATE sessions SET ended_at = ?, summary = ? WHERE id = ?",
                (datetime.utcnow().isoformat(), summary, session_id),
            )

    def get_recent_session_summaries(self, limit: int = 3) -> list[str]:
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT summary FROM sessions WHERE summary IS NOT NULL AND summary != '' "
                "ORDER BY started_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [r[0] for r in rows]

    # ── Messages ───────────────────────────────────────────────────────────

    def add_message(self, session_id: int, role: str, content: str):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
                (session_id, role, content, datetime.utcnow().isoformat()),
            )

    def get_session_messages(self, session_id: int, limit: int = 10) -> list[dict]:
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT role, content, timestamp FROM messages "
                "WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?",
                (session_id, limit),
            ).fetchall()
        return [{"role": r[0], "content": r[1], "timestamp": r[2]} for r in reversed(rows)]
