"""Punto de entrada de la interfaz gráfica (Tkinter): login y dashboard de pedidos.

Uso (desde la carpeta python/ o desde cualquier otra):
    python main_gui.py

Usuarios de prueba (datos/usuarios.json):  admin / 1234   y   operador / ventas
La versión de consola sigue siendo main.py.
"""
from __future__ import annotations

from pathlib import Path

from gui.app import AplicacionGUI

CARPETA_DATOS = Path(__file__).resolve().parent.parent / "datos"


def main() -> None:
    aplicacion = AplicacionGUI(CARPETA_DATOS)
    if aplicacion.iniciar():
        aplicacion.mainloop()


if __name__ == "__main__":
    main()
