"""
telegram_notifier.py — Notificaciones Telegram para el bot RPA KICKOFF.

Envía al grupo MONITOREO RPA_DATAFILL:
  · Un mensaje al iniciar la cola (con cantidad de OTs)
  · Un mensaje inmediato si una OT falla
  · Un resumen final al terminar toda la cola
"""

import os
import time
from datetime import datetime

import requests
from dotenv import load_dotenv

load_dotenv()

_TOKEN   = os.getenv("TELEGRAM_BOT_TOKEN", "")
_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# ── Estado de sesión ────────────────────────────────────────────────────────────
_sesion = {
    "inicio":      None,
    "total":       0,
    "completadas": [],
    "fallidas":    [],
}


# ── Envío HTTP ──────────────────────────────────────────────────────────────────
def _send(mensaje: str) -> None:
    if not _TOKEN or not _CHAT_ID:
        print("⚠ Telegram: TOKEN o CHAT_ID no configurados en .env")
        return
    try:
        url = f"https://api.telegram.org/bot{_TOKEN}/sendMessage"
        requests.post(
            url,
            json={"chat_id": _CHAT_ID, "text": mensaje, "parse_mode": "HTML"},
            timeout=10,
        )
    except Exception as e:
        print(f"⚠ Telegram error al enviar: {e}")


def _hora() -> str:
    return datetime.now().strftime("%H:%M:%S")


# ── API pública ─────────────────────────────────────────────────────────────────
def notificar_inicio_cola(total_otps: int) -> None:
    """Llamar una sola vez al detectar la primera OT pendiente."""
    _sesion["inicio"]      = time.time()
    _sesion["total"]       = total_otps
    _sesion["completadas"] = []
    _sesion["fallidas"]    = []

    _send(
        f"🚀 <b>Cola iniciada — KICKOFF</b>\n"
        f"📋 OTs en cola: <b>{total_otps}</b>\n"
        f"🕐 {_hora()}"
    )


def notificar_ot_completada(otp: str) -> None:
    """Registra la OT como completada (sin enviar mensaje individual)."""
    _sesion["completadas"].append(otp)


def notificar_ot_fallida(otp: str) -> None:
    """Registra la OT como fallida y envía alerta inmediata."""
    _sesion["fallidas"].append(otp)
    _send(
        f"❌ <b>Falló OTP: {otp} — KICKOFF</b>\n"
        f"💥 Requiere revisión manual\n"
        f"🕐 {_hora()}"
    )


def notificar_resumen_final() -> None:
    """Enviar al cerrar la cola (sin más pendientes)."""
    completadas = len(_sesion["completadas"])
    fallidas    = len(_sesion["fallidas"])

    duracion = ""
    if _sesion["inicio"]:
        seg = int(time.time() - _sesion["inicio"])
        m, s = divmod(seg, 60)
        duracion = f"{m}m {s}s"

    linea_fallidas = ""
    if _sesion["fallidas"]:
        linea_fallidas = f"\n❌ Fallidas:    {fallidas} ({', '.join(_sesion['fallidas'])})"

    _send(
        f"📊 <b>Cola finalizada — KICKOFF</b>\n"
        f"✅ Completadas: {completadas}{linea_fallidas}\n"
        f"⏱ Tiempo total: {duracion}\n"
        f"🕐 {_hora()}"
    )
