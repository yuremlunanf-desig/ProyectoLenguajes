"""Pantalla principal: resumen, tabla de pedidos y los paneles de formulario y concurrencia.

Responsable: Leonardo (Dashboard).

Esta vista arma el layout y conecta las demás: cuando el formulario registra un
pedido o el despachador cambia un estado, la tabla y los indicadores se repintan.
"""
from __future__ import annotations

import tkinter as tk
from tkinter import messagebox, ttk
from typing import Callable

from autenticacion import Usuario
from gui import estilos, etiquetas
from gui.controlador_concurrencia import ControladorConcurrencia
from gui.controlador_dashboard import (
    COLUMNAS,
    FILTROS_ESTADO,
    ORDEN_FECHA,
    ORDENES,
    TODOS,
    ControladorDashboard,
)
from gui.controlador_formulario import ControladorFormulario
from gui.vista_concurrencia import VistaConcurrencia
from gui.vista_formulario import VistaFormulario
from modelos import EstadoPedido, Pedido

ANCHOS = {
    "ID": 70, "Cliente": 140, "Fecha": 90, "Prioridad": 88, "Envío": 75,
    "Subtotal": 90, "Descuento": 85, "IVA": 80, "Total": 95, "Estado": 95,
}
ALINEACION_DERECHA = {"Subtotal", "Descuento", "IVA", "Total"}


class VistaDashboard(ttk.Frame):
    def __init__(
        self,
        master: tk.Misc,
        usuario: Usuario,
        controlador: ControladorDashboard,
        formulario: ControladorFormulario,
        concurrencia: ControladorConcurrencia,
        al_cerrar_sesion: Callable[[], None],
    ) -> None:
        super().__init__(master, padding=12)
        self._controlador = controlador
        self._concurrencia = concurrencia
        self._buscar = tk.StringVar()
        self._estado_filtro = tk.StringVar(value=TODOS)
        self._orden = tk.StringVar(value=ORDEN_FECHA)
        self._mensaje = tk.StringVar(value="Listo.")
        self._tarjetas: dict[str, tk.StringVar] = {}

        self.columnconfigure(1, weight=1)
        self.rowconfigure(1, weight=1)

        # --- encabezado ---
        encabezado = ttk.Frame(self)
        encabezado.grid(row=0, column=0, columnspan=2, sticky="ew", pady=(0, 10))
        ttk.Label(encabezado, text="Pedidos de la tienda", style="Titulo.TLabel").pack(side="left")
        ttk.Button(encabezado, text="Cerrar sesión", command=al_cerrar_sesion).pack(side="right")
        ttk.Label(encabezado, text=f"{usuario.nombre} ({usuario.usuario})", style="Suave.TLabel").pack(
            side="right", padx=12)

        # --- columna izquierda: formulario ---
        self._formulario = VistaFormulario(self, formulario, self._pedido_registrado)
        self._formulario.grid(row=1, column=0, sticky="ns", padx=(0, 12))

        # --- columna derecha: indicadores, filtros, tabla y concurrencia ---
        derecha = ttk.Frame(self)
        derecha.grid(row=1, column=1, sticky="nsew")
        derecha.columnconfigure(0, weight=1)
        derecha.rowconfigure(2, weight=2)
        derecha.rowconfigure(3, weight=3)
        self._construir_tarjetas(derecha).grid(row=0, column=0, sticky="ew")
        self._construir_filtros(derecha).grid(row=1, column=0, sticky="ew", pady=(10, 6))
        self._construir_tabla(derecha).grid(row=2, column=0, sticky="nsew")
        self._concurrencia_vista = VistaConcurrencia(
            derecha, concurrencia, al_cambiar=self.refrescar, al_informar=self._mensaje.set)
        self._concurrencia_vista.grid(row=3, column=0, sticky="nsew", pady=(10, 0))

        # --- barra de estado ---
        ttk.Label(self, textvariable=self._mensaje, style="Suave.TLabel", anchor="w").grid(
            row=2, column=0, columnspan=2, sticky="ew", pady=(8, 0))

        self.refrescar()
        self.after(250, self._avisar_rechazos)

    # --- construcción ---------------------------------------------------------------------

    def _construir_tarjetas(self, padre: tk.Misc) -> ttk.Frame:
        marco = ttk.Frame(padre)
        elementos = [("Pedidos", estilos.TEXTO)] + [
            (etiquetas.ESTADOS[e], estilos.COLORES_ESTADO[e][1])
            for e in (EstadoPedido.PENDIENTE, EstadoPedido.EN_PROCESO, EstadoPedido.ENVIADO, EstadoPedido.ENTREGADO)
        ] + [("Total vendido", estilos.EXITO)]
        for columna, (titulo, color) in enumerate(elementos):
            tarjeta = tk.Frame(marco, bg=estilos.SUPERFICIE, highlightbackground=estilos.BORDE,
                               highlightthickness=1, padx=12, pady=6)
            tarjeta.grid(row=0, column=columna, sticky="ew", padx=(0 if columna == 0 else 8, 0))
            marco.columnconfigure(columna, weight=2 if titulo == "Total vendido" else 1, uniform=None)
            variable = tk.StringVar(value="0")
            self._tarjetas[titulo] = variable
            tk.Label(tarjeta, textvariable=variable, bg=estilos.SUPERFICIE, fg=color,
                     font=(estilos.FUENTE, 16, "bold"), anchor="w").pack(fill="x")
            tk.Label(tarjeta, text=titulo, bg=estilos.SUPERFICIE, fg=estilos.TEXTO_SUAVE, anchor="w").pack(fill="x")
        return marco

    def _construir_filtros(self, padre: tk.Misc) -> ttk.Frame:
        marco = ttk.Frame(padre)
        ttk.Label(marco, text="Buscar cliente").pack(side="left")
        campo = ttk.Entry(marco, textvariable=self._buscar, width=22)
        campo.pack(side="left", padx=(6, 14))
        ttk.Label(marco, text="Estado").pack(side="left")
        combo_estado = ttk.Combobox(marco, textvariable=self._estado_filtro, values=FILTROS_ESTADO,
                                    state="readonly", width=12)
        combo_estado.pack(side="left", padx=(6, 14))
        ttk.Label(marco, text="Ordenar por").pack(side="left")
        combo_orden = ttk.Combobox(marco, textvariable=self._orden, values=ORDENES, state="readonly", width=10)
        combo_orden.pack(side="left", padx=(6, 14))
        ttk.Button(marco, text="Limpiar", command=self._limpiar_filtros).pack(side="left")
        ttk.Button(marco, text="Restablecer datos", command=self._restablecer).pack(side="right")
        self._buscar.trace_add("write", lambda *_: self.refrescar())
        combo_estado.bind("<<ComboboxSelected>>", lambda _e: self.refrescar())
        combo_orden.bind("<<ComboboxSelected>>", lambda _e: self.refrescar())
        return marco

    def _construir_tabla(self, padre: tk.Misc) -> ttk.Frame:
        marco = ttk.Frame(padre)
        self._tabla = ttk.Treeview(marco, columns=COLUMNAS, show="headings", selectmode="browse")
        for columna in COLUMNAS:
            self._tabla.heading(columna, text=columna)
            self._tabla.column(columna, width=ANCHOS[columna], minwidth=60,
                               anchor="e" if columna in ALINEACION_DERECHA else "w",
                               stretch=columna == "Cliente")
        estilos.colorear_filas(self._tabla)
        barra = ttk.Scrollbar(marco, command=self._tabla.yview)
        self._tabla.configure(yscrollcommand=barra.set)
        barra.pack(side="right", fill="y")
        self._tabla.pack(side="left", fill="both", expand=True)
        self._tabla.bind("<Double-1>", self._mostrar_detalle)
        self._tabla.bind("<Return>", self._mostrar_detalle)
        return marco

    # --- actualización --------------------------------------------------------------------

    def refrescar(self) -> None:
        """Vuelve a consultar el modelo y repinta la tabla y los indicadores (conserva la selección)."""
        seleccion = self._tabla.selection()
        self._tabla.delete(*self._tabla.get_children())
        for fila in self._controlador.consultar(self._buscar.get(), self._estado_filtro.get(), self._orden.get()):
            self._tabla.insert("", "end", iid=fila.id, values=fila.valores, tags=(fila.estado.name,))
        if seleccion and self._tabla.exists(seleccion[0]):
            self._tabla.selection_set(seleccion[0])

        resumen = self._controlador.resumen()
        self._tarjetas["Pedidos"].set(str(resumen.total_pedidos))
        for estado, cantidad in resumen.por_estado.items():
            if etiquetas.ESTADOS[estado] in self._tarjetas:
                self._tarjetas[etiquetas.ESTADOS[estado]].set(str(cantidad))
        self._tarjetas["Total vendido"].set(etiquetas.dinero(resumen.total_vendido))

    def _pedido_registrado(self, pedido: Pedido) -> None:
        self.refrescar()
        self._mensaje.set(f"Pedido {pedido.id} registrado para {pedido.cliente.nombre}.")
        if self._tabla.exists(pedido.id):
            self._tabla.see(pedido.id)
            self._tabla.selection_set(pedido.id)
        else:
            # Los filtros activos lo ocultan: se avisa en lugar de dejar al usuario sin entender.
            self._mensaje.set(self._mensaje.get() + " (No se ve en la tabla por los filtros activos.)")

    def _limpiar_filtros(self) -> None:
        self._buscar.set("")
        self._estado_filtro.set(TODOS)
        self._orden.set(ORDEN_FECHA)
        self.refrescar()

    def _restablecer(self) -> None:
        if self._concurrencia.en_ejecucion:
            messagebox.showwarning("Despachador en curso",
                                   "Detén el despachador antes de restablecer los datos.", parent=self)
            return
        if not messagebox.askyesno(
            "Restablecer datos",
            "Se descartarán los pedidos capturados y los cambios de estado, y se volverá a cargar "
            "solicitudes_pequenas.json.\n\n¿Continuar?", parent=self):
            return
        try:
            self._controlador.recargar()
        except (OSError, ValueError, KeyError, TypeError, ArithmeticError) as error:
            messagebox.showerror("No se pudieron cargar los datos", f"{type(error).__name__}: {error}", parent=self)
            return
        self.refrescar()
        self._mensaje.set("Datos restablecidos desde solicitudes_pequenas.json.")
        self._avisar_rechazos()

    def _mostrar_detalle(self, _evento: tk.Event | None = None) -> None:
        seleccion = self._tabla.selection()
        if seleccion:
            messagebox.showinfo(f"Detalle de {seleccion[0]}", self._controlador.detalle(seleccion[0]), parent=self)

    def _avisar_rechazos(self) -> None:
        rechazos = self._controlador.rechazos()
        if rechazos:
            messagebox.showwarning(
                "Pedidos rechazados",
                f"Al cargar las solicitudes se rechazaron {len(rechazos)} pedido(s) por no cumplir "
                "las reglas de negocio:\n\n" + "\n".join(f"• {motivo}" for motivo in rechazos),
                parent=self)

    @property
    def procesando(self) -> bool:
        return self._concurrencia.en_ejecucion

    def cerrar(self) -> None:
        """Detiene el despachador antes de destruir la ventana."""
        self._concurrencia.cerrar()
