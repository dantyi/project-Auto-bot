import json
import os
import sys
import subprocess
from flask import Blueprint, request, jsonify
from database import get_connection, _cursor, add_audit_log, add_bot_log
from auth_middleware import token_required

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

BOT_PATH = os.path.join(os.path.dirname(__file__), "..", "bot.py")

# ── Tipos de tarea permitidos por rol ─────────────────────────────────────────
ROLE_TASK_TYPES = {
    "orquestador": [
        "gestion_cierre_otp", "creacion_oth", "documentacion_oth",
        "check_config_pem", "otp_documentacion", "marcacion_otp", "remarcacion_oth",
    ],
    "coordinador": ["solicitud_marcacion_otp", "solicitud_cambio_fechas"],
    "kickoff":     ["solicitud_doc_oth_kickoff", "planear_cliente", "cierre_oth"],
    "ultima_milla": ["solicitud_doc_oth_um"],
    "config_pem":  [
        "solicitud_doc_oth_config_pem", "solicitud_saturacion_internet",
        "consulta_disponibilidad_ip", "marcacion_red",
    ],
}
ROLE_TASK_TYPES["admin"] = [t for types in ROLE_TASK_TYPES.values() for t in types]


def _visible_where(role: str):
    """Devuelve (fragmento WHERE, params) según el rol."""
    if role in ("admin", "coordinador"):
        return "", ()
    if role == "orquestador":
        return "WHERE created_by IN ('orquestador', 'kickoff')", ()
    return "WHERE created_by = %s", (role,)


def _row_to_dict(row) -> dict:
    d = dict(row)
    # JSONB ya viene deserializado desde psycopg2; si viene como str lo parseamos
    if isinstance(d.get("datos"), str):
        try:
            d["datos"] = json.loads(d["datos"])
        except (TypeError, json.JSONDecodeError):
            pass
    # Convertir timestamps a string ISO para JSON
    for key in ("created_at", "updated_at", "timestamp"):
        if key in d and hasattr(d[key], "isoformat"):
            d[key] = d[key].isoformat()
    return d


def _trigger_bot(task_id: int):
    try:
        subprocess.Popen(
            [sys.executable, os.path.abspath(BOT_PATH)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        add_bot_log(task_id, "bot_triggered", "Proceso iniciado en background")
    except Exception as exc:
        add_bot_log(task_id, "bot_trigger_error", str(exc))


# ── GET / ─────────────────────────────────────────────────────────────────────
@tasks_bp.route("/", methods=["GET"])
@token_required
def list_tasks(current_user):
    role = current_user["role"]
    where, params = _visible_where(role)
    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute(f"SELECT * FROM tasks {where} ORDER BY created_at DESC", params)
        rows = cur.fetchall()
        cur.close()
    finally:
        conn.close()
    return jsonify([_row_to_dict(r) for r in rows]), 200


# ── GET /stats ────────────────────────────────────────────────────────────────
@tasks_bp.route("/stats", methods=["GET"])
@token_required
def task_stats(current_user):
    role = current_user["role"]
    where, params = _visible_where(role)
    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute(
            f"SELECT estado, COUNT(*) AS count FROM tasks {where} GROUP BY estado",
            params,
        )
        rows = cur.fetchall()
        cur.close()
    finally:
        conn.close()

    stats = {"pendiente": 0, "en_proceso": 0, "completado": 0, "error": 0, "total": 0}
    for row in rows:
        stats[row["estado"]] = row["count"]
        stats["total"] += row["count"]
    return jsonify(stats), 200


# ── GET /<id> ─────────────────────────────────────────────────────────────────
@tasks_bp.route("/<int:task_id>", methods=["GET"])
@token_required
def get_task(current_user, task_id):
    role = current_user["role"]
    where, params = _visible_where(role)

    if where:
        query = f"SELECT * FROM tasks WHERE id = %s AND {where[6:]}"
        params = (task_id,) + params
    else:
        query = "SELECT * FROM tasks WHERE id = %s"
        params = (task_id,)

    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute(query, params)
        row = cur.fetchone()
        cur.close()
    finally:
        conn.close()

    if row is None:
        return jsonify({"error": "Tarea no encontrada o sin permiso"}), 404
    return jsonify(_row_to_dict(row)), 200


# ── POST / ────────────────────────────────────────────────────────────────────
@tasks_bp.route("/", methods=["POST"])
@token_required
def create_task(current_user):
    role = current_user["role"]
    data = request.get_json(silent=True) or {}

    tipo = data.get("tipo", "").strip()
    datos = data.get("datos", {})

    if not tipo:
        return jsonify({"error": "El campo 'tipo' es requerido"}), 400

    allowed = ROLE_TASK_TYPES.get(role, [])
    if tipo not in allowed:
        return jsonify({"error": f"Tipo '{tipo}' no permitido para rol '{role}'",
                        "tipos_permitidos": allowed}), 400

    if not isinstance(datos, dict):
        return jsonify({"error": "'datos' debe ser un objeto JSON"}), 400

    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute(
            """INSERT INTO tasks (tipo, datos, created_by)
               VALUES (%s, %s::jsonb, %s) RETURNING id""",
            (tipo, json.dumps(datos), role),
        )
        task_id = cur.fetchone()["id"]
        conn.commit()
        cur.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
        row = cur.fetchone()
        cur.close()
    finally:
        conn.close()

    add_audit_log(current_user["username"], "tarea_creada",
                  f"Task ID={task_id} tipo={tipo} role={role}")
    _trigger_bot(task_id)
    return jsonify(_row_to_dict(row)), 201


# ── PATCH /<id> ───────────────────────────────────────────────────────────────
@tasks_bp.route("/<int:task_id>", methods=["PATCH"])
@token_required
def update_task(current_user, task_id):
    role = current_user["role"]
    data = request.get_json(silent=True) or {}

    where, params = _visible_where(role)
    if where:
        check_q = f"SELECT * FROM tasks WHERE id = %s AND {where[6:]}"
        check_p = (task_id,) + params
    else:
        check_q = "SELECT * FROM tasks WHERE id = %s"
        check_p = (task_id,)

    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute(check_q, check_p)
        row = cur.fetchone()
        if row is None:
            cur.close()
            return jsonify({"error": "Tarea no encontrada o sin permiso"}), 404

        updates, values = [], []
        old_estado = row["estado"]

        if "estado" in data:
            new_estado = data["estado"]
            if new_estado not in ("pendiente", "en_proceso", "completado", "error"):
                cur.close()
                return jsonify({"error": "Estado invalido"}), 400
            updates.append("estado = %s")
            values.append(new_estado)

        if "assigned_to" in data:
            if role not in ("admin", "coordinador"):
                cur.close()
                return jsonify({"error": "Solo admin o coordinador pueden asignar tareas"}), 403
            updates.append("assigned_to = %s")
            values.append(data["assigned_to"])

        if not updates:
            cur.close()
            return jsonify({"error": "No hay campos validos para actualizar"}), 400

        updates.append("updated_at = NOW()")
        values.append(task_id)
        cur.execute(f"UPDATE tasks SET {', '.join(updates)} WHERE id = %s", values)
        conn.commit()
        cur.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
        updated = cur.fetchone()
        cur.close()
    finally:
        conn.close()

    if "estado" in data and data["estado"] != old_estado:
        add_audit_log(current_user["username"], "cambio_estado_tarea",
                      f"Task ID={task_id} {old_estado} -> {data['estado']}")

    return jsonify(_row_to_dict(updated)), 200


# ── GET /<id>/logs ─────────────────────────────────────────────────────────────
@tasks_bp.route("/<int:task_id>/logs", methods=["GET"])
@token_required
def get_task_logs(current_user, task_id):
    role = current_user["role"]
    where, params = _visible_where(role)

    if where:
        check_q = f"SELECT id FROM tasks WHERE id = %s AND {where[6:]}"
        check_p = (task_id,) + params
    else:
        check_q = "SELECT id FROM tasks WHERE id = %s"
        check_p = (task_id,)

    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute(check_q, check_p)
        if cur.fetchone() is None:
            cur.close()
            return jsonify({"error": "Tarea no encontrada o sin permiso"}), 404
        cur.execute(
            "SELECT * FROM bot_logs WHERE task_id = %s ORDER BY timestamp ASC",
            (task_id,),
        )
        logs = cur.fetchall()
        cur.close()
    finally:
        conn.close()

    return jsonify([_row_to_dict(r) for r in logs]), 200
