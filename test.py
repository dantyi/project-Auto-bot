import pyautogui
import time

print("Mueve el mouse a la posición que quieras. Presiona Ctrl+C para salir.")
print("-" * 40)

while True:
    x, y = pyautogui.position()
    print(f"x={x}, y={y}", end="\r")
    time.sleep(0.1)
