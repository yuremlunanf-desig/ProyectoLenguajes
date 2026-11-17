"""Aplicación principal: una sola ventana que pasa del login al dashboard.

Responsable: Ian (Login) crea el esqueleto y la navegación; Leonardo conecta el dashboard.

Aquí se arma todo el MVC («composition root»): se crea el modelo, los
controladores y se entregan a las vistas.
"""
from __future__ import annotations

import sys
import tkinter as tk
import traceback
from pathlib import Path
from tkinter import messagebox

from almacen import AlmacenPedidos
from autenticacion import AutenticacionError, ServicioAutenticacion, Usuario
from catalogo import CatalogoError, leer_catalogo
from gui import estilos
from gui.controlador_concurrencia import ControladorConcurrencia
from gui.controlador_dashboard import ControladorDashboard
from gui.controlador_formulario import ControladorFormulario
from gui.controlador_login import ControladorLogin
from gui.vista_dashboard import VistaDashboard
from gui.vista_login import VistaLogin

TAMANO_LOGIN = (440, 400)
TAMANO_DASHBOARD = (1400, 840)
ERRORES_DE_DATOS = (OSError, ValueError, KeyError, TypeError, ArithmeticError, CatalogoError)


class AplicacionGUI(tk.Tk):
    def __init__(self, carpeta_datos: Path) -> None:
        super().__init__()
        self._datos = carpeta_datos
        self._vista: tk.Misc | None = None
        self._servicio: ServicioAutenticacion | None = None
        self.title("Sistema de pedidos")
        estilos.aplicar(self)
        self.protocol("WM_DELETE_WINDOW", self.salir)

    def iniciar(self) -> bool:
        """Carga los usuarios y muestra el login. Devuelve False (tras avisar) si no se pudo."""
        try:
            self._servicio = ServicioAutenticacion(self._datos / "usuarios.json")
        except AutenticacionError as error:
            self.withdraw()
            messagebox.showerror("No se puede iniciar el sistema", str(error))
            self.destroy()
            return False
        self.mostrar_login()
        return True

    # --- navegación -----------------------------------------------------------------------

    def mostrar_login(self) -> None:
        self._cambiar_vista(
            VistaLogin(self, ControladorLogin(self._servicio), self._entrar, self.salir), TAMANO_LOGIN, False
        )

    def _entrar(self, usuario: Usuario) -> None:
        try:
            almacen = AlmacenPedidos(self._datos / "solicitudes_pequenas.json")
            almacen.cargar()
            catalogo = leer_catalogo(self._datos / "catalogo.json")
        except ERRORES_DE_DATOS as error:
            messagebox.showerror(
                "No se pudieron cargar los datos",
                f"Revisa los archivos de la carpeta datos/.\n\n{type(error).__name__}: {error}",
                parent=self,
            )
            return
        vista = VistaDashboard(
            self, usuario, ControladorDashboard(almacen), ControladorFormulario(almacen, catalogo),
            ControladorConcurrencia(almacen), al_cerrar_sesion=self._cerrar_sesion,
        )
        self._cambiar_vista(vista, TAMANO_DASHBOARD, True)

    def _cerrar_sesion(self) -> None:
        if isinstance(self._vista, VistaDashboard) and self._vista.procesando:
            if not messagebox.askyesno(
                "Cerrar sesión", "El despachador sigue procesando pedidos. Se detendrá al cerrar la sesión.\n\n"
                "¿Cerrar la sesión?", parent=self):
                return
        self.mostrar_login()

    def salir(self) -> None:
        self._descartar_vista()
        self.destroy()

    def _cambiar_vista(self, vista: tk.Misc, tamano: tuple[int, int], redimensionable: bool) -> None:
        self._descartar_vista()
        self._vista = vista
        vista.pack(fill="both", expand=True)
        self.resizable(redimensionable, redimensionable)
        if redimensionable:
            self.minsize(1180, 720)
        else:
            self.minsize(*tamano)
        estilos.centrar(self, *tamano)

    def _descartar_vista(self) -> None:
        if self._vista is not None:
            if isinstance(self._vista, VistaDashboard):
                self._vista.cerrar()
            self._vista.destroy()
            self._vista = None

    # --- errores no previstos -------------------------------------------------------------

    def report_callback_exception(self, tipo, valor, rastro) -> None:  # noqa: D102 (método de tk.Tk)
        """Cualquier excepción que escape de un botón se muestra en una ventana, no solo en la consola."""
        traceback.print_exception(tipo, valor, rastro, file=sys.stderr)
        try:
            messagebox.showerror(
                "Error inesperado",
                f"Ocurrió un error que la aplicación no esperaba:\n\n{tipo.__name__}: {valor}\n\n"
                "El detalle quedó en la consola.",
            )
        except tk.TclError:
            pass  # la ventana ya se estaba cerrando
