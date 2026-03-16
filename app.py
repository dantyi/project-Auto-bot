<<<<<<< HEAD
=======
from flask import Flask, render_template, request, jsonify
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment
>>>>>>> parent of e7a7d6a (config)
import os
from flask import Flask, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_socketio import SocketIO

<<<<<<< HEAD
from database import init_db
from routes.auth_routes import auth_bp
from routes.task_routes import tasks_bp
from routes.user_routes import users_bp

# ── App factory ───────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=None)
=======
app = Flask(__name__)
EXCEL_FILE = "datos.xlsx"
>>>>>>> parent of e7a7d6a (config)

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:5000"]}},
    supports_credentials=True,
)

<<<<<<< HEAD
# ── SocketIO ──────────────────────────────────────────────────────────────────
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:5173", "http://localhost:5000"],
    namespace="/ws",
    async_mode="threading",
)
=======
        # ✅ ESTRUCTURA ORIGINAL (NO SE TOCA) + ADICIONALES AL FINAL
        encabezados = [
            "OTP",
            "DOCUMENTAR_CHECK_FACTIBILIDAD",
            "CORREO_REPORTE_INICIO",
            "MARCACION_OTH",
            "COD_RESOLUCION_1",
            "GERENCIA",
            "FECHA_COMPROMISO",
            "FECHA_PROGRAMACION",
            "TIPO_SERVICIO",
            "COMPLETADO",
            "DOCUMENTACION_ITEM_FACTURACION",
            "CERRADO_OTP",
            "COD_RESOLUCION_1_OTP",
            "MODIFICAR_OTP",
            "TIPO",
            "DOCUMENTACION_UM",
            "CERRAR_OTH"
        ]
>>>>>>> parent of e7a7d6a (config)

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(users_bp)

<<<<<<< HEAD
# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200
=======
def agregar_columnas_faltantes():
    """Agrega columnas nuevas al Excel si ya existe pero le faltan."""
    nuevas = ["TIPO", "DOCUMENTACION_UM", "CERRAR_OTH"]
    wb = load_workbook(EXCEL_FILE)
    ws = wb.active
    existentes = [cell.value for cell in ws[1]]
    agregado = False
    for col in nuevas:
        if col not in existentes:
            ws.cell(row=1, column=len(existentes) + 1, value=col)
            existentes.append(col)
            agregado = True
    if agregado:
        wb.save(EXCEL_FILE)
>>>>>>> parent of e7a7d6a (config)

# ── Serve React build (frontend/dist) if it exists ────────────────────────────
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    # Do not intercept API routes (already handled above)
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404

<<<<<<< HEAD
    if os.path.isdir(FRONTEND_DIST):
        # Serve static assets (JS, CSS, images, etc.) from the dist folder
        asset_path = os.path.join(FRONTEND_DIST, path)
        if path and os.path.isfile(asset_path):
            return send_from_directory(FRONTEND_DIST, path)
        # Fall back to index.html for client-side routing
        index_path = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.isfile(index_path):
            return send_file(index_path)

    # Frontend not built yet – return a simple status message
    return jsonify({"message": "Backend running. Frontend not built yet."}), 200
=======
# ==========================
# GUARDAR REGISTRO + ACTIVAR BOT
# ==========================
@app.route("/guardar", methods=["POST"])
def guardar():
    try:
        data = request.json
        wb = load_workbook(EXCEL_FILE)
        ws = wb.active
>>>>>>> parent of e7a7d6a (config)


<<<<<<< HEAD
# ── SocketIO events ───────────────────────────────────────────────────────────
@socketio.on("connect", namespace="/ws")
def on_connect():
    print("[WS] Client connected")
=======
            data.get("documentacion_item_facturacion", ""),  # "SI" / "NO"
            data.get("cerrado_otp", ""),                     # "SI" / "NO"
            data.get("cod_resolucion_otp", ""),              # TEXTO
            data.get("modificar_otp", ""),                   # "SI" / "NO"
            "KICKOFF",                                       # TIPO
            "",                                              # DOCUMENTACION_UM
            ""                                               # CERRAR_OTH
        ]
>>>>>>> parent of e7a7d6a (config)


<<<<<<< HEAD
@socketio.on("disconnect", namespace="/ws")
def on_disconnect():
    print("[WS] Client disconnected")
=======
        nueva_fila_num = ws.max_row
        for col in range(1, 18):  # 1..17
            ws.cell(row=nueva_fila_num, column=col).alignment = Alignment(wrap_text=True)
>>>>>>> parent of e7a7d6a (config)


<<<<<<< HEAD
# ── Initialise DB and run ─────────────────────────────────────────────────────
=======
        subprocess.Popen(["python", "bot.py"])

        return jsonify({"mensaje": "Guardado y BOT ejecutado correctamente"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================
# GUARDAR UM + ACTIVAR BOT UM
# ==========================
@app.route("/guardar_um", methods=["POST"])
def guardar_um():
    try:
        data = request.json
        wb = load_workbook(EXCEL_FILE)
        ws = wb.active

        fila = [
            data.get("otp", ""),   # OTP
            "", "", "", "", "",    # cols 2-6 vacías
            "", "", "",            # cols 7-9 vacías
            "",                    # COMPLETADO
            "", "", "", "",        # cols 11-14 vacías
            "UM",                  # TIPO
            data.get("documentacion_um", ""),  # DOCUMENTACION_UM
            data.get("cerrar_oth", "")          # CERRAR_OTH
        ]

        ws.append(fila)

        nueva_fila_num = ws.max_row
        for col in range(1, 18):  # 1..17
            ws.cell(row=nueva_fila_num, column=col).alignment = Alignment(wrap_text=True)

        wb.save(EXCEL_FILE)

        subprocess.Popen(["python", "bot_um.py"])

        return jsonify({"mensaje": "Guardado y BOT UM ejecutado correctamente"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================
# EJECUTAR EN RED 0.0.0.0
# ==========================
>>>>>>> parent of e7a7d6a (config)
if __name__ == "__main__":
    init_db()
    socketio.run(app, host="0.0.0.0", port=5000, debug=False)
