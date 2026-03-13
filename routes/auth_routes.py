from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from database import get_connection, _cursor, add_audit_log
from auth_middleware import generate_token, token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "username y password son requeridos"}), 400

    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute(
            "SELECT id, username, password_hash, role FROM users WHERE username = %s",
            (username,),
        )
        row = cur.fetchone()
        cur.close()
    finally:
        conn.close()

    if row is None or not check_password_hash(row["password_hash"], password):
        add_audit_log(username, "login_fallido", "Credenciales incorrectas")
        return jsonify({"error": "Credenciales invalidas"}), 401

    token = generate_token(row["username"], row["role"])
    add_audit_log(row["username"], "login_exitoso", f"Rol: {row['role']}")

    return jsonify({
        "token": token,
        "role": row["role"],
        "username": row["username"],
    }), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    # Stateless JWT – nothing to invalidate server-side.
    return jsonify({"message": "Sesion cerrada correctamente"}), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def me(current_user):
    return jsonify({
        "username": current_user["username"],
        "role": current_user["role"],
    }), 200
