"""Interfaz gráfica (Tkinter) del sistema de pedidos, organizada en MVC.

Modelo:       modelos.py, negocio.py, lector_json.py, funcional.py, concurrencia.py,
              autenticacion.py, catalogo.py, almacen.py, despachador.py (carpeta python/).
Vista:        gui/vista_*.py. Solo dibujan widgets y muestran errores con messagebox.
Controlador:  gui/controlador_*.py. Traducen lo que escribe el usuario a llamadas al
              modelo. No importan tkinter, así que se prueban sin abrir ventanas.
"""
