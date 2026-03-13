"""
claude_vision.py — Módulo de visión e inteligencia Claude AI para el bot CRM Claro.

Claude analiza screenshots del CRM en tiempo real y decide la siguiente acción,
reemplazando completamente la detección de imágenes hardcodeadas (PNG).
"""

import base64
import io
import json
import os

import anthropic
import pyautogui
from dotenv import load_dotenv

load_dotenv()

MODEL = "claude-opus-4-6"
MAX_ACTIONS = 200  # límite de seguridad por tarea

# ── Etiquetas legibles para tipos de tarea ────────────────────────────────────
TIPO_LABELS = {
    "gestion_cierre_otp":           "Gestión y Cierre de OTP",
    "creacion_oth":                  "Creación de OTH",
    "documentacion_oth":             "Documentación en OTH",
    "check_config_pem":              "Check de Config / Check de PEM",
    "otp_documentacion":             "OTP Documentación",
    "marcacion_otp":                 "Marcación OTP",
    "remarcacion_oth":               "Remarcación OTH",
    "solicitud_marcacion_otp":       "Solicitud Marcación OTP",
    "solicitud_cambio_fechas":       "Solicitud Cambio de Fechas",
    "solicitud_doc_oth_kickoff":     "Solicitud Documentación OTH Kickoff",
    "planear_cliente":               "Planear con Cliente / Cierre OTH",
    "cierre_oth":                    "Cierre OTH",
    "solicitud_doc_oth_um":          "Solicitud Documentación OTH Última Milla",
    "solicitud_doc_oth_config_pem":  "Solicitud Documentación OTH Config y PEM",
    "solicitud_saturacion_internet": "Solicitud Saturación Internet Dedicado",
    "consulta_disponibilidad_ip":    "Consulta Disponibilidad de IP",
    "marcacion_red":                 "Marcación en RED",
}

SYSTEM_PROMPT = """Eres un agente de automatización que controla el CRM de Claro (Ordenes de Trabajo v8) en Windows.

Tu trabajo es analizar capturas de pantalla del CRM y determinar la siguiente acción
para completar la tarea asignada, exactamente como lo haría un operario humano.

## CRM Claro — Descripción de la aplicación
- Es una aplicación de escritorio Windows con logo Claro (círculo rojo)
- Pantalla de login tiene campos: Servidor, Base de Datos, Usuario de Red, Clave de Red
- Color principal: rojo oscuro en barras de sección
- Ventana principal: "Ordenes de Trabajo v8"

## CRM Claro — Flujo general para buscar un incidente/OTP
1. Si el CRM no está abierto o muestra la pantalla de login:
   - Ingresar Usuario de Red y Clave de Red con las credenciales proporcionadas
   - Hacer clic en el botón de conectar/ingresar
2. Una vez dentro, abrir "Consultas" desde el menú principal
3. En la ventana "Consultas" hay 3 pestañas: Incidentes | Cliente | CUN
   - Pestaña "Incidentes": campo "ID del Incidente" + botón "Buscar"
   - Radio buttons: "Cargar" y "Cargar Cliente"
4. Escribir el número de OTP/incidente en "ID del Incidente" y hacer clic en "Buscar"
5. Si aparece diálogo "¿Desea asignar el incidente a su usuario?" → hacer clic en "Sí" o "No" según la tarea
6. Se abre la ventana del incidente con botones: "Editar Incidente", "Tareas", etc.
7. Para ver tareas: hacer clic en el botón/pestaña "Tareas"
8. En la lista de tareas buscar la tarea correspondiente según el tipo:
   - KICKOFF - NCV
   - KICKOFF NOVE (Kickoff Novedades)
   - OTH PLANEAR C (OTH Planear con Cliente)
   - y otros tipos de OTH
9. Hacer doble clic o clic en la tarea para abrirla
10. Si aparece diálogo "¿Desea asignar la tarea a su usuario?" → hacer clic en "Sí" o "No" según corresponda
11. Con la tarea abierta, hacer clic en "Editar Tarea"
12. Completar los campos requeridos según la tarea:
    - Estado
    - Fecha Atención
    - Fecha Comprometida
    - Anotaciones (campo de texto libre)
    - Códigos de Resolución → COD. RESOLUCIÓN 1 (y más si aplica)
13. Hacer clic en "Guardar" para guardar los cambios
14. Cerrar las ventanas abiertas con la X

## Elementos visuales clave del CRM
- Barras de sección: color rojo oscuro con texto blanco (ej: "Búsqueda de Incidente", "Códigos de Resolución")
- Botón "Buscar": gris claro con borde
- Botón "Guardar": gris claro con borde
- Botón "Editar Incidente": gris claro pequeño
- Botón "Editar Tarea": gris claro pequeño
- Diálogos de confirmación: ventana CRM con ícono azul de pregunta, botones "Sí" y "No"
- Campos de fecha: formato DD/MM/AAAA

## Formato de respuesta — SIEMPRE responde SOLO con JSON válido, sin markdown:
{
  "action": "click" | "type" | "key" | "wait" | "done" | "error",
  "x": <entero>,          // solo para "click" — coordenada X del centro del elemento
  "y": <entero>,          // solo para "click" — coordenada Y del centro del elemento
  "text": "<string>",     // solo para "type" — texto a escribir
  "key": "<string>",      // solo para "key" — tecla o combinación (enter, tab, f2, ctrl+a, ctrl+v, etc.)
  "seconds": <float>,     // opcional para "wait" — segundos a esperar (por defecto 1.5)
  "description": "<string>", // SIEMPRE requerido — explica qué haces y por qué
  "confidence": <0.0-1.0>    // tu nivel de confianza en esta acción
}

## Reglas importantes
- Haz clic en el CENTRO exacto de botones y campos
- Antes de escribir en un campo, haz clic en él primero
- Usa ctrl+a antes de escribir para limpiar el contenido existente
- Para texto con caracteres especiales (tildes, ñ, fechas), usa "type" y el sistema lo manejará
- Si la pantalla está cargando o cambiando, usa "wait"
- Si completaste todo y guardaste, usa "done"
- Si encuentras un error irrecuperable, usa "error" con descripción detallada
- NO hagas suposiciones sobre coordenadas — úsalas solo si las ves claramente en pantalla
- Si no estás seguro del estado de la pantalla, usa "wait" con seconds=1 para observar
- Los diálogos de confirmación (Sí/No) deben responderse antes de continuar
"""


def take_screenshot() -> str:
    """Captura la pantalla completa y retorna como base64 PNG."""
    screenshot = pyautogui.screenshot()
    buffer = io.BytesIO()
    screenshot.save(buffer, format="PNG")
    return base64.standard_b64encode(buffer.getvalue()).decode("utf-8")


class CRMAgent:
    """
    Agente Claude que analiza screenshots del CRM y decide la siguiente acción.
    Mantiene el historial de conversación para contexto acumulado.
    """

    def __init__(
        self,
        task_id: int,
        task_type: str,
        task_data: dict,
        crm_user: str,
        crm_pass: str,
    ):
        self.task_id = task_id
        self.task_type = task_type
        self.task_label = TIPO_LABELS.get(task_type, task_type)
        self.task_data = task_data
        self.crm_user = crm_user
        self.crm_pass = crm_pass
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.history: list[dict] = []
        self.action_count = 0

    def _initial_context(self) -> str:
        data_str = json.dumps(self.task_data, indent=2, ensure_ascii=False)
        return f"""## Tarea asignada
- ID: {self.task_id}
- Tipo: {self.task_label}
- Usuario CRM: {self.crm_user}
- Contraseña CRM: {self.crm_pass}

## Datos a ingresar en el CRM
{data_str}

## Instrucción
Analiza la captura de pantalla actual y determina la primera acción a realizar
para completar esta tarea en el CRM de Claro."""

    def get_next_action(self, screenshot_b64: str) -> dict:
        """Envía el screenshot a Claude y obtiene la próxima acción."""
        self.action_count += 1

        if self.action_count > MAX_ACTIONS:
            return {
                "action": "error",
                "description": f"Límite de {MAX_ACTIONS} acciones alcanzado sin completar la tarea.",
                "confidence": 1.0,
            }

        # Primera llamada incluye contexto completo; las siguientes solo el screenshot
        if not self.history:
            user_content = [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": screenshot_b64,
                    },
                },
                {"type": "text", "text": self._initial_context()},
            ]
        else:
            user_content = [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": screenshot_b64,
                    },
                },
                {
                    "type": "text",
                    "text": f"Acción #{self.action_count}. ¿Cuál es el siguiente paso?",
                },
            ]

        self.history.append({"role": "user", "content": user_content})

        response = self.client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=self.history,
        )

        assistant_text = response.content[0].text
        self.history.append({"role": "assistant", "content": assistant_text})

        return self._parse_action(assistant_text)

    def _parse_action(self, text: str) -> dict:
        """Parsea la respuesta JSON de Claude."""
        try:
            # Limpiar markdown si Claude lo incluye
            clean = text.strip()
            if clean.startswith("```"):
                parts = clean.split("```")
                clean = parts[1] if len(parts) > 1 else clean
                if clean.startswith("json"):
                    clean = clean[4:]
            return json.loads(clean.strip())
        except (json.JSONDecodeError, IndexError):
            return {
                "action": "error",
                "description": f"Claude devolvió respuesta no válida: {text[:300]}",
                "confidence": 0.0,
            }
