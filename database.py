import os
from datetime import datetime, timezone

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()

# ── Conexión ───────────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", 5432)),
    "dbname":   os.getenv("DB_NAME", "inteegra_bot"),
    "user":     os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASS", "inteegra2024"),
}


def get_connection():
    uri = (
        f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}"
        f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"
    )
    conn = psycopg.connect(uri, row_factory=dict_row)
    conn.autocommit = False
    return conn


def _cursor(conn):
    """Devuelve un cursor que retorna filas como diccionarios."""
    return conn.cursor(row_factory=dict_row)


# ── Inicialización de tablas ───────────────────────────────────────────────────
def init_db():
    conn = get_connection()
    cur = _cursor(conn)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            username      TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL CHECK(role IN (
                              'admin','coordinador','orquestador',
                              'kickoff','ultima_milla','config_pem')),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id          SERIAL PRIMARY KEY,
            tipo        TEXT NOT NULL,
            datos       JSONB NOT NULL DEFAULT '{}',
            estado      TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK(estado IN ('pendiente','en_proceso','completado','error')),
            created_by  TEXT NOT NULL,
            assigned_to TEXT,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS bot_logs (
            id        SERIAL PRIMARY KEY,
            task_id   INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
            accion    TEXT NOT NULL,
            resultado TEXT,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id        SERIAL PRIMARY KEY,
            username  TEXT NOT NULL,
            accion    TEXT NOT NULL,
            detalle   TEXT,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    conn.commit()

    # ── Seed usuarios por defecto ──────────────────────────────────────────────
    cur.execute("SELECT COUNT(*) AS cnt FROM users")
    if cur.fetchone()["cnt"] == 0:
        default_users = [
            ("admin",       "Admin2024*",  "admin"),
            ("coordinador", "Coord2024*",  "coordinador"),
            ("orquestador", "Orq2024*",    "orquestador"),
            ("kickoff",     "Kick2024*",   "kickoff"),
            ("ultimamilla", "UM2024*",     "ultima_milla"),
            ("configpem",   "Conf2024*",   "config_pem"),
        ]
        for username, password, role in default_users:
            cur.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s)",
                (username, generate_password_hash(password), role),
            )
        conn.commit()

    cur.close()
    conn.close()


# ── Helpers ────────────────────────────────────────────────────────────────────
def add_audit_log(username: str, accion: str, detalle: str = None):
    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute(
            "INSERT INTO audit_logs (username, accion, detalle) VALUES (%s, %s, %s)",
            (username, accion, detalle),
        )
        conn.commit()
        cur.close()
    finally:
        conn.close()


def add_bot_log(task_id: int, accion: str, resultado: str = None):
    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute(
            "INSERT INTO bot_logs (task_id, accion, resultado) VALUES (%s, %s, %s)",
            (task_id, accion, resultado),
        )
        conn.commit()
        cur.close()
    finally:
        conn.close()
