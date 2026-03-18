import os
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET", "inteegra_secret_2024_change_in_prod")
ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 8


def generate_token(username: str, role: str) -> str:
    """Generate a signed JWT valid for TOKEN_EXPIRY_HOURS hours."""
    payload = {
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str):
    """Decode and verify a JWT. Returns payload dict or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def _extract_token_from_request():
    """Pull the Bearer token from the Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def token_required(f):
    """
    Decorator that validates the JWT and injects current_user as the first
    positional argument to the wrapped route function.

    Usage::

        @app.route("/protected")
        @token_required
        def protected(current_user):
            return jsonify(current_user)
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = _extract_token_from_request()
        if not token:
            return jsonify({"error": "Token de autenticacion requerido"}), 401

        payload = verify_token(token)
        if payload is None:
            return jsonify({"error": "Token invalido o expirado"}), 401

        current_user = {
            "username": payload.get("username"),
            "role": payload.get("role"),
        }
        return f(current_user, *args, **kwargs)

    return decorated


def role_required(*roles):
    """
    Decorator factory that first validates the JWT (via token_required logic)
    then checks that the authenticated user's role is among *roles*.

    Usage::

        @app.route("/admin-only")
        @role_required("admin")
        def admin_only(current_user):
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = _extract_token_from_request()
            if not token:
                return jsonify({"error": "Token de autenticacion requerido"}), 401

            payload = verify_token(token)
            if payload is None:
                return jsonify({"error": "Token invalido o expirado"}), 401

            current_user = {
                "username": payload.get("username"),
                "role": payload.get("role"),
            }

            if current_user["role"] not in roles:
                return jsonify({"error": "Acceso denegado: rol insuficiente"}), 403

            return f(current_user, *args, **kwargs)

        return decorated
    return decorator
