"""SQLite persistence for the standalone DICOM colorizer service."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterable


class ColorizerStore:
    def __init__(self, database_path: Path):
        self.database_path = Path(database_path)

    @contextmanager
    def _connect(self):
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 30000")
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize(self) -> None:
        with self._connect() as connection:
            connection.execute("PRAGMA journal_mode = WAL")
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS batches (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    label TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_batches_user_created
                    ON batches(user_id, created_at DESC);

                CREATE TABLE IF NOT EXISTS items (
                    id TEXT PRIMARY KEY,
                    batch_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    relative_path TEXT NOT NULL,
                    storage_path TEXT NOT NULL,
                    content_hash TEXT NOT NULL,
                    image_hash TEXT,
                    error TEXT,
                    acquisition_json TEXT,
                    created_at REAL NOT NULL,
                    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_items_batch ON items(batch_id, created_at);
                CREATE INDEX IF NOT EXISTS idx_items_user_hash ON items(user_id, content_hash);

                CREATE TABLE IF NOT EXISTS color_settings (
                    user_id TEXT NOT NULL,
                    content_hash TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (user_id, content_hash),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS roi_annotations (
                    user_id TEXT NOT NULL,
                    content_hash TEXT NOT NULL,
                    rows INTEGER NOT NULL,
                    columns INTEGER NOT NULL,
                    payload_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (user_id, content_hash),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS roi_labels (
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    position INTEGER NOT NULL,
                    PRIMARY KEY (user_id, name),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_roi_labels_user_position
                    ON roi_labels(user_id, position);

                CREATE TABLE IF NOT EXISTS service_metadata (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                """
            )
            item_columns = {
                row["name"] for row in connection.execute("PRAGMA table_info(items)").fetchall()
            }
            if "acquisition_json" not in item_columns:
                connection.execute("ALTER TABLE items ADD COLUMN acquisition_json TEXT")

    @staticmethod
    def _dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
        return dict(row) if row is not None else None

    def create_user(
        self,
        user_id: str,
        username: str,
        password_hash: str,
        created_at: str,
        default_labels: Iterable[str],
    ) -> dict[str, Any]:
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO users(id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
                (user_id, username, password_hash, created_at),
            )
            connection.executemany(
                "INSERT INTO roi_labels(user_id, name, position) VALUES (?, ?, ?)",
                [(user_id, name, position) for position, name in enumerate(default_labels)],
            )
        return {"id": user_id, "username": username, "created_at": created_at}

    def user_by_username(self, username: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            return self._dict(
                connection.execute(
                    "SELECT id, username, password_hash, created_at FROM users WHERE username = ?",
                    (username,),
                ).fetchone()
            )

    def user_by_id(self, user_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            return self._dict(
                connection.execute(
                    "SELECT id, username, password_hash, created_at FROM users WHERE id = ?",
                    (user_id,),
                ).fetchone()
            )

    def create_batch(self, record: dict[str, Any]) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO batches(id, user_id, label, source_type, created_at)
                VALUES (:id, :user_id, :label, :source_type, :created_at)
                """,
                record,
            )

    def list_batches(self, user_id: str) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT b.id, b.user_id, b.label, b.source_type, b.created_at,
                       COUNT(i.id) AS item_count
                FROM batches b
                LEFT JOIN items i ON i.batch_id = b.id
                WHERE b.user_id = ?
                GROUP BY b.id
                ORDER BY b.created_at DESC
                """,
                (user_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def batch_by_id(self, batch_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            return self._dict(
                connection.execute(
                    "SELECT id, user_id, label, source_type, created_at FROM batches WHERE id = ?",
                    (batch_id,),
                ).fetchone()
            )

    def delete_batch(self, batch_id: str, user_id: str) -> bool:
        with self._connect() as connection:
            cursor = connection.execute(
                "DELETE FROM batches WHERE id = ? AND user_id = ?", (batch_id, user_id)
            )
            return cursor.rowcount > 0

    def create_item(self, record: dict[str, Any]) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO items(
                    id, batch_id, user_id, relative_path, storage_path,
                    content_hash, image_hash, error, acquisition_json, created_at
                ) VALUES (
                    :id, :batch_id, :user_id, :relative_path, :storage_path,
                    :content_hash, :image_hash, :error, :acquisition_json, :created_at
                )
                """,
                {**record, "acquisition_json": json.dumps(record.get("acquisition"))},
            )

    def list_items(self, batch_id: str) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT id, batch_id, user_id, relative_path, storage_path,
                       content_hash, image_hash, error, acquisition_json, created_at
                FROM items WHERE batch_id = ? ORDER BY created_at, id
                """,
                (batch_id,),
            ).fetchall()
        records = [dict(row) for row in rows]
        for record in records:
            payload = record.pop("acquisition_json", None)
            record["acquisition"] = json.loads(payload) if payload else None
        return records

    def item_by_id(self, item_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            record = self._dict(
                connection.execute(
                    """
                    SELECT id, batch_id, user_id, relative_path, storage_path,
                           content_hash, image_hash, error, acquisition_json, created_at
                    FROM items WHERE id = ?
                    """,
                    (item_id,),
                ).fetchone()
            )
        if record is not None:
            payload = record.pop("acquisition_json", None)
            record["acquisition"] = json.loads(payload) if payload else None
        return record

    def delete_items(self, batch_id: str, user_id: str, item_ids: list[str]) -> int:
        if not item_ids:
            return 0
        placeholders = ",".join("?" for _ in item_ids)
        with self._connect() as connection:
            cursor = connection.execute(
                f"DELETE FROM items WHERE batch_id = ? AND user_id = ? AND id IN ({placeholders})",
                (batch_id, user_id, *item_ids),
            )
            return cursor.rowcount

    def update_item_error(self, item_id: str, error: str | None) -> None:
        with self._connect() as connection:
            connection.execute("UPDATE items SET error = ? WHERE id = ?", (error, item_id))

    def get_settings(self, user_id: str, content_hash: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT payload_json FROM color_settings WHERE user_id = ? AND content_hash = ?",
                (user_id, content_hash),
            ).fetchone()
        return json.loads(row["payload_json"]) if row else None

    def save_settings(
        self, user_id: str, content_hash: str, payload: dict[str, Any], updated_at: str
    ) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO color_settings(user_id, content_hash, payload_json, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id, content_hash) DO UPDATE SET
                    payload_json = excluded.payload_json,
                    updated_at = excluded.updated_at
                """,
                (user_id, content_hash, json.dumps(payload, ensure_ascii=False), updated_at),
            )

    def get_annotations(self, user_id: str, content_hash: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT rows, columns, payload_json, updated_at
                FROM roi_annotations WHERE user_id = ? AND content_hash = ?
                """,
                (user_id, content_hash),
            ).fetchone()
        if row is None:
            return None
        payload = json.loads(row["payload_json"])
        return {
            "rows": row["rows"],
            "columns": row["columns"],
            **payload,
            "updatedAt": row["updated_at"],
        }

    def save_annotations(
        self,
        user_id: str,
        content_hash: str,
        rows: int,
        columns: int,
        payload: dict[str, Any],
        updated_at: str,
    ) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO roi_annotations(
                    user_id, content_hash, rows, columns, payload_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, content_hash) DO UPDATE SET
                    rows = excluded.rows,
                    columns = excluded.columns,
                    payload_json = excluded.payload_json,
                    updated_at = excluded.updated_at
                """,
                (
                    user_id,
                    content_hash,
                    rows,
                    columns,
                    json.dumps(payload, ensure_ascii=False),
                    updated_at,
                ),
            )

    def delete_annotations(self, user_id: str, content_hash: str) -> None:
        with self._connect() as connection:
            connection.execute(
                "DELETE FROM roi_annotations WHERE user_id = ? AND content_hash = ?",
                (user_id, content_hash),
            )

    def list_labels(self, user_id: str) -> list[str]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT name FROM roi_labels WHERE user_id = ? ORDER BY position, rowid",
                (user_id,),
            ).fetchall()
        return [str(row["name"]) for row in rows]

    def replace_labels(self, user_id: str, labels: Iterable[str]) -> None:
        with self._connect() as connection:
            connection.execute("DELETE FROM roi_labels WHERE user_id = ?", (user_id,))
            connection.executemany(
                "INSERT INTO roi_labels(user_id, name, position) VALUES (?, ?, ?)",
                [(user_id, name, position) for position, name in enumerate(labels)],
            )

    def add_label(self, user_id: str, name: str) -> None:
        with self._connect() as connection:
            next_position = connection.execute(
                "SELECT COALESCE(MAX(position), -1) + 1 FROM roi_labels WHERE user_id = ?",
                (user_id,),
            ).fetchone()[0]
            connection.execute(
                "INSERT INTO roi_labels(user_id, name, position) VALUES (?, ?, ?)",
                (user_id, name, next_position),
            )

    def rename_label(self, user_id: str, old_name: str, new_name: str) -> int:
        renamed_regions = 0
        with self._connect() as connection:
            label = connection.execute(
                "SELECT position FROM roi_labels WHERE user_id = ? AND name = ?",
                (user_id, old_name),
            ).fetchone()
            if label is None:
                return -1
            connection.execute(
                "UPDATE roi_labels SET name = ? WHERE user_id = ? AND name = ?",
                (new_name, user_id, old_name),
            )
            annotation_rows = connection.execute(
                "SELECT content_hash, payload_json FROM roi_annotations WHERE user_id = ?",
                (user_id,),
            ).fetchall()
            for row in annotation_rows:
                payload = json.loads(row["payload_json"])
                changed = False
                for region in payload.get("regions", []):
                    if region.get("label") == old_name:
                        region["label"] = new_name
                        renamed_regions += 1
                        changed = True
                if changed:
                    connection.execute(
                        """
                        UPDATE roi_annotations SET payload_json = ?
                        WHERE user_id = ? AND content_hash = ?
                        """,
                        (json.dumps(payload, ensure_ascii=False), user_id, row["content_hash"]),
                    )
        return renamed_regions

    def metadata_value(self, key: str) -> str | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT value FROM service_metadata WHERE key = ?", (key,)
            ).fetchone()
        return str(row["value"]) if row else None

    def save_metadata(self, key: str, value: str) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO service_metadata(key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, value),
            )
