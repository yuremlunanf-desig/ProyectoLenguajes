"""Ventana de inicio de sesión.

Responsable: Ian (Login).

Solo dibuja los campos y muestra los errores con messagebox. La validación real
la hace ControladorLogin; si sale bien, avisa a la aplicación con al_autenticar.
"""
from __future__ import annotations

import tkinter as tk
from tkinter import messagebox, ttk
from typing import Callable

from autenticacion import AutenticacionError, Usuario
from gui import estilos
from gui.controlador_login import CamposIncompletosError, ControladorLogin


class VistaLogin(ttk.Frame):
    def __init__(
        self,
        master: tk.Misc,
        controlador: ControladorLogin,
        al_autenticar: Callable[[Usuario], None],
        al_salir: Callable[[], None],
    ) -> None:
        super().__init__(master)
        self._controlador = controlador
        self._al_autenticar = al_autenticar
        self._usuario = tk.StringVar()
        self._contrasena = tk.StringVar()
        self._mostrar = tk.BooleanVar(value=False)

        tarjeta = tk.Frame(
            self, bg=estilos.SUPERFICIE, highlightbackground=estilos.BORDE, highlightthickness=1,
            padx=32, pady=28,
        )
        tarjeta.place(relx=0.5, rely=0.5, anchor="center")

        def etiqueta(texto: str, **opciones) -> tk.Label:
            opciones.setdefault("fg", estilos.TEXTO)
            return tk.Label(tarjeta, text=texto, bg=estilos.SUPERFICIE, anchor="w", **opciones)

        etiqueta("Sistema de pedidos", font=(estilos.FUENTE, 18, "bold")).grid(
            row=0, column=0, columnspan=2, sticky="w")
        etiqueta("Inicia sesión para continuar", fg=estilos.TEXTO_SUAVE).grid(
            row=1, column=0, columnspan=2, sticky="w", pady=(0, 18))

        etiqueta("Usuario").grid(row=2, column=0, columnspan=2, sticky="w")
        self._campo_usuario = ttk.Entry(tarjeta, textvariable=self._usuario, width=30)
        self._campo_usuario.grid(row=3, column=0, columnspan=2, sticky="ew", pady=(2, 12))

        etiqueta("Contraseña").grid(row=4, column=0, columnspan=2, sticky="w")
        self._campo_contrasena = ttk.Entry(tarjeta, textvariable=self._contrasena, show="●", width=30)
        self._campo_contrasena.grid(row=5, column=0, columnspan=2, sticky="ew", pady=(2, 6))

        ttk.Checkbutton(
            tarjeta, text="Mostrar contraseña", variable=self._mostrar, command=self._alternar_contrasena,
            style="Tarjeta.TCheckbutton",
        ).grid(row=6, column=0, columnspan=2, sticky="w", pady=(0, 18))

        ttk.Button(tarjeta, text="Ingresar", style="Primario.TButton", command=self._ingresar).grid(
            row=7, column=0, sticky="ew", padx=(0, 6))
        ttk.Button(tarjeta, text="Salir", command=al_salir).grid(row=7, column=1, sticky="ew", padx=(6, 0))
        tarjeta.columnconfigure((0, 1), weight=1)

        for campo in (self._campo_usuario, self._campo_contrasena):
            campo.bind("<Return>", self._ingresar)
        self._campo_usuario.focus_set()

    def _alternar_contrasena(self) -> None:
        self._campo_contrasena.configure(show="" if self._mostrar.get() else "●")

    def _ingresar(self, _evento: tk.Event | None = None) -> None:
        try:
            usuario = self._controlador.iniciar_sesion(self._usuario.get(), self._contrasena.get())
        except CamposIncompletosError as error:
            messagebox.showwarning("Datos incompletos", str(error), parent=self)
            (self._campo_usuario if not self._usuario.get().strip() else self._campo_contrasena).focus_set()
        except AutenticacionError as error:
            messagebox.showerror("Acceso denegado", str(error), parent=self)
            self._contrasena.set("")
            self._campo_contrasena.focus_set()
        else:
            self._contrasena.set("")
            self._al_autenticar(usuario)
