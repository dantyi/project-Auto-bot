"""
bot.py — Bot de automatización CRM INTEEGRA con Claude AI.

Lee tareas pendientes de PostgreSQL, usa Claude AI con visión para analizar
el CRM en tiempo real y ejecuta las acciones necesarias con pyautogui.
"""

import json
import os
import sys
import time

import psutil
import pyautogui
import pyperclip
from dotenv import load_dotenv

from claude_vision import CRMAgent, take_screenshot
from database import add_bot_log, get_connection, _cursor

load_dotenv()

# ── Configuración ──────────────────────────────────────────────────────────────
CRM_USER        = os.getenv("CRM_USER", "")
CRM_PASS        = os.getenv("CRM_PASS", "")
POLL_INTERVAL   = 5
INACTIVITY_TIMEOUT = 480
LOCK_FILE       = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bot.lock")

pyautogui.FAILSAFE = True
pyautogui.PAUSE    = 0.3


# ── Lock ───────────────────────────────────────────────────────────────────────

def acquire_lock() -> bool:
    if os.path.exists(LOCK_FILE):
        try:
            with open(LOCK_FILE) as f:
                pid = int(f.read().strip())
            if psutil.pid_exists(pid):
                return False
        except Exception:
            pass
    with open(LOCK_FILE, "w") as f:
        f.write(str(os.getpid()))
    return True


def release_lock():
    if os.path.exists(LOCK_FILE):
        try:
            os.remove(LOCK_FILE)
        except Exception:
            pass


# ── Base de datos ──────────────────────────────────────────────────────────────

def get_pending_task() -> dict | None:
    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute(
            "SELECT * FROM tasks WHERE estado = 'pendiente' ORDER BY created_at ASC LIMIT 1"
        )
        row = cur.fetchone()
        cur.close()
        return dict(row) if row else None
    finally:
        conn.close()


def mark_task(task_id: int, estado: str):
    conn = get_connection()
    try:
        cur = _cursor(conn)
        cur.execute(
            "UPDATE tasks SET estado = %s, updated_at = NOW() WHERE id = %s",
            (estado, task_id),
        )
        conn.commit()
        cur.close()
    finally:
        conn.close()


# ── Ejecución de acciones ──────────────────────────────────────────────────────

def type_text(text: str):
    """Usa el portapapeles para escribir texto con caracteres especiales (ñ, tildes)."""
    pyperclip.copy(str(text))
    pyautogui.hotkey("ctrl", "v")
    time.sleep(0.3)


def execute_action(action: dict) -> bool:
    """
    Ejecuta la acción de Claude. Retorna False cuando la tarea termina.
    """
    act = action.get("action", "error")

    if act == "click":
        pyautogui.click(int(action.get("x", 0)), int(action.get("y", 0)))
        time.sleep(0.5)

    elif act == "type":
        type_text(action.get("text", ""))

    elif act == "key":
        key = action.get("key", "")
        if "+" in key:
            pyautogui.hotkey(*[k.strip() for k in key.split("+")])
        else:
            pyautogui.press(key)
        time.sleep(0.3)

    elif act == "wait":
        time.sleep(float(action.get("seconds", 1.5)))

    elif act == "done":
        return False

    elif act == "error":
        raise RuntimeError(action.get("description", "Error desconocido"))

    return True


# ── Procesamiento de tarea ─────────────────────────────────────────────────────

def run_task(task: dict):
    task_id   = task["id"]
    task_type = task["tipo"]
    datos     = task["datos"]

    if isinstance(datos, str):
        try:
            datos = json.loads(datos)
        except json.JSONDecodeError:
            datos = {}

    add_bot_log(task_id, "inicio", f"Iniciando tarea tipo={task_type}")
    mark_task(task_id, "en_proceso")

    agent = CRMAgent(
        task_id=task_id,
        task_type=task_type,
        task_data=datos,
        crm_user=CRM_USER,
        crm_pass=CRM_PASS,
    )

    try:
        while True:
            action = agent.get_next_action(take_screenshot())

            act_type = action.get("action", "unknown")
            desc     = action.get("description", "")
            conf     = action.get("confidence", 0.0)

            add_bot_log(task_id, act_type, f"{desc} (confianza={conf:.2f})")
            print(f"[Bot][{task_id}] [{act_type}] {desc}")

            if not execute_action(action):
                mark_task(task_id, "completado")
                add_bot_log(task_id, "completado", "Tarea finalizada exitosamente")
                print(f"[Bot][{task_id}] Completada ✓")
                break

    except RuntimeError as e:
        mark_task(task_id, "error")
        add_bot_log(task_id, "error", str(e))
        print(f"[Bot][{task_id}] Error: {e}")

    except Exception as e:
        mark_task(task_id, "error")
        add_bot_log(task_id, "error_inesperado", str(e))
        print(f"[Bot][{task_id}] Error inesperado: {e}")


# ── Loop principal ─────────────────────────────────────────────────────────────

def main():
    if not acquire_lock():
        print("[Bot] Ya hay una instancia corriendo.")
        sys.exit(0)

    print("[Bot] Iniciado. Esperando tareas...")
    last_activity = time.time()

    try:
        while True:
            task = get_pending_task()
            if task:
                last_activity = time.time()
                print(f"[Bot] Tarea ID={task['id']} tipo={task['tipo']}")
                run_task(task)
            else:
                if time.time() - last_activity > INACTIVITY_TIMEOUT:
                    print("[Bot] Timeout de inactividad. Cerrando.")
                    break
                time.sleep(POLL_INTERVAL)
    finally:
        release_lock()
        print("[Bot] Detenido.")


if __name__ == "__main__":
    main()
