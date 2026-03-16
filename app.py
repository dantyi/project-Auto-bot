import os
from flask import Flask, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_socketio import SocketIO

from database import init_db
from routes.auth_routes import auth_bp
from routes.task_routes import tasks_bp
from routes.user_routes import users_bp

# ── App factory ───────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=None)

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:5000"]}},
    supports_credentials=True,
)

# ── SocketIO ──────────────────────────────────────────────────────────────────
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:5173", "http://localhost:5000"],
    namespace="/ws",
    async_mode="threading",
)

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(users_bp)

# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

# ── Serve React build (frontend/dist) if it exists ────────────────────────────
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    # Do not intercept API routes (already handled above)
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404

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


# ── SocketIO events ───────────────────────────────────────────────────────────
@socketio.on("connect", namespace="/ws")
def on_connect():
    print("[WS] Client connected")


@socketio.on("disconnect", namespace="/ws")
def on_disconnect():
    print("[WS] Client disconnected")


# ── Initialise DB and run ─────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    socketio.run(app, host="0.0.0.0", port=5000, debug=False)
