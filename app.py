from flask import Flask, render_template, request, jsonify
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment
import os
import subprocess

app = Flask(__name__)
EXCEL_FILE = "datos.xlsx"

# ==========================
# CREAR EXCEL SI NO EXISTE
# ==========================
def crear_excel():
    if not os.path.exists(EXCEL_FILE):
        wb = Workbook()
        ws = wb.active
        ws.title = "Registros"

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
            "COD_RESOLUCION_1_OTP"
        ]

        ws.append(encabezados)
        wb.save(EXCEL_FILE)

crear_excel()

# ==========================
# RUTA PRINCIPAL
# ==========================
@app.route("/")
def index():
    return render_template("index.html")

# ==========================
# GUARDAR REGISTRO + ACTIVAR BOT
# ==========================
@app.route("/guardar", methods=["POST"])
def guardar():
    try:
        data = request.json
        wb = load_workbook(EXCEL_FILE)
        ws = wb.active

        # ✅ FILA ORIGINAL (NO SE TOCA) + ADICIONALES AL FINAL
        fila = [
            data.get("otp", ""),
            data.get("factibilidad", ""),
            data.get("correo_inicio", ""),
            data.get("marcacion_oth", ""),
            data.get("cod_resolucion", ""),
            data.get("gerencia", ""),
            data.get("fecha_compromiso", ""),
            data.get("fecha_programacion", ""),
            data.get("tipo_servicio", ""),
            "" ,

            data.get("documentacion_item_facturacion", ""),  # "SI" / "NO"
            data.get("cerrado_otp", ""),                     # "SI" / "NO"
            data.get("cod_resolucion_otp", "")               # TEXTO
        ]

        ws.append(fila)

        # ✅ Activar wrap_text en todas las celdas de la nueva fila (ahora 13 columnas)
        nueva_fila_num = ws.max_row
        for col in range(1, 14):  # 1..13
            ws.cell(row=nueva_fila_num, column=col).alignment = Alignment(wrap_text=True)

        wb.save(EXCEL_FILE)

        # 🔥 ACTIVAR BOT CUANDO SE DETECTA POST
        subprocess.Popen(["python", "bot.py"])

        return jsonify({"mensaje": "Guardado y BOT ejecutado correctamente"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================
# EJECUTAR EN RED 0.0.0.0
# ==========================
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )