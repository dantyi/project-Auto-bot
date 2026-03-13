from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database import get_connection, _cursor, add_audit_log
from auth_middleware import role_required

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

VALID_ROLES = ("admin", "coordinador", "orquestador", "kickoff", "ultima_milla", "config_pem")


# ── GET / ─────────────────────────────────────────────────────────────────────
@users_bp.route("/", methods=["GET"])
@role_required("admin")
def list_users(current_user):
    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute("SELECT id, username, role, created_at FROM users ORDER BY id")
        rows = cur.fetchall()
        cur.close()
    finally:
        conn.close()
    return jsonify([{**dict(r), "created_at": r["created_at"].isoformat()} for r in rows]), 200


# ── POST / ────────────────────────────────────────────────────────────────────
@users_bp.route("/", methods=["POST"])
@role_required("admin")
def create_user(current_user):
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    role = data.get("role", "").strip()

    if not username or not password or not role:
        return jsonify({"error": "username, password y role son requeridos"}), 400
    if role not in VALID_ROLES:
        return jsonify({"error": f"Rol invalido. Opciones: {VALID_ROLES}"}), 400

    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            cur.close()
            return jsonify({"error": "El username ya existe"}), 409

        cur.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s) RETURNING id",
            (username, generate_password_hash(password), role),
        )
        new_id = cur.fetchone()["id"]
        conn.commit()
        cur.execute("SELECT id, username, role, created_at FROM users WHERE id = %s", (new_id,))
        row = cur.fetchone()
        cur.close()
    finally:
        conn.close()

    add_audit_log(current_user["username"], "usuario_creado",
                  f"Nuevo usuario '{username}' rol '{role}'")
    return jsonify({**dict(row), "created_at": row["created_at"].isoformat()}), 201


# ── PATCH /<id> ───────────────────────────────────────────────────────────────
@users_bp.route("/<int:user_id>", methods=["PATCH"])
@role_required("admin")
def update_user(current_user, user_id):
    data = request.get_json(silent=True) or {}
    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if row is None:
            cur.close()
            return jsonify({"error": "Usuario no encontrado"}), 404

        updates, values = [], []

        if "username" in data:
            new_u = data["username"].strip()
            if not new_u:
                cur.close()
                return jsonify({"error": "username no puede estar vacio"}), 400
            cur.execute("SELECT id FROM users WHERE username = %s AND id != %s", (new_u, user_id))
            if cur.fetchone():
                cur.close()
                return jsonify({"error": "El username ya esta en uso"}), 409
            updates.append("username = %s"); values.append(new_u)

        if "password" in data:
            if not data["password"]:
                cur.close()
                return jsonify({"error": "password no puede estar vacio"}), 400
            updates.append("password_hash = %s")
            values.append(generate_password_hash(data["password"]))

        if "role" in data:
            new_r = data["role"].strip()
            if new_r not in VALID_ROLES:
                cur.close()
                return jsonify({"error": f"Rol invalido. Opciones: {VALID_ROLES}"}), 400
            updates.append("role = %s"); values.append(new_r)

        if not updates:
            cur.close()
            return jsonify({"error": "No hay campos validos para actualizar"}), 400

        values.append(user_id)
        cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", values)
        conn.commit()
        cur.execute("SELECT id, username, role, created_at FROM users WHERE id = %s", (user_id,))
        updated = cur.fetchone()
        cur.close()
    finally:
        conn.close()

    add_audit_log(current_user["username"], "usuario_actualizado", f"ID={user_id}")
    return jsonify({**dict(updated), "created_at": updated["created_at"].isoformat()}), 200


# ── DELETE /<id> ──────────────────────────────────────────────────────────────
@users_bp.route("/<int:user_id>", methods=["DELETE"])
@role_required("admin")
def delete_user(current_user, user_id):
    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if row is None:
            cur.close()
            return jsonify({"error": "Usuario no encontrado"}), 404
        if row["username"] == current_user["username"]:
            cur.close()
            return jsonify({"error": "No puedes eliminar tu propio usuario"}), 400
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        cur.close()
    finally:
        conn.close()

    add_audit_log(current_user["username"], "usuario_eliminado",
                  f"Usuario '{row['username']}' ID={user_id}")
    return jsonify({"message": f"Usuario '{row['username']}' eliminado"}), 200
