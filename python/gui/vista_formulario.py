"""Formulario de captura de pedidos: datos del cliente, carrito y registro.

Responsable: Edsson (Formularios).

Cada acción que puede fallar se envuelve en try/except y el error se muestra con
messagebox en lugar de llegar a la consola:
  - ErrorFormulario      -> aviso (datos faltantes o con mal formato).
  - PedidoInvalidoError  -> error (la regla de negocio rechazó el pedido).
"""
from __future__ import annotations

import tkinter as tk
from tkinter import messagebox, ttk
from typing import Callable

from gui import etiquetas
from gui.controlador_formulario import ControladorFormulario, ErrorFormulario
from modelos import Pedido, Prioridad, TipoCliente, TipoEnvio
from negocio import PedidoInvalidoError


class VistaFormulario(ttk.LabelFrame):
    def __init__(
        self,
        master: tk.Misc,
        controlador: ControladorFormulario,
        al_registrar: Callable[[Pedido], None],
    ) -> None:
        super().__init__(master, text="Nuevo pedido")
        self._controlador = controlador
        self._al_registrar = al_registrar

        self._cliente_id = tk.StringVar()
        self._cliente_nombre = tk.StringVar()
        self._tipo = tk.StringVar(value=etiquetas.TIPOS_CLIENTE[TipoCliente.REGULAR])
        self._prioridad = tk.StringVar(value=etiquetas.PRIORIDADES[Prioridad.MEDIA])
        self._envio = tk.StringVar(value=etiquetas.ENVIOS_CON_COSTO[TipoEnvio.ESTANDAR])
        self._producto = tk.StringVar()
        self._cantidad = tk.StringVar(value="1")
        self._importes = {nombre: tk.StringVar(value="—") for nombre in
                          ("Subtotal", "Descuento", "IVA", "Envío", "Total")}
        self.columnconfigure(0, weight=1)

        # --- cliente ---
        cliente = ttk.Frame(self)
        cliente.grid(row=0, column=0, sticky="ew")
        cliente.columnconfigure(1, weight=1)
        ttk.Label(cliente, text="ID cliente").grid(row=0, column=0, sticky="w")
        ttk.Label(cliente, text="Nombre").grid(row=0, column=1, sticky="w", padx=(8, 0))
        self._campo_id = ttk.Entry(cliente, textvariable=self._cliente_id, width=9)
        self._campo_id.grid(row=1, column=0, sticky="w")
        self._campo_nombre = ttk.Entry(cliente, textvariable=self._cliente_nombre)
        self._campo_nombre.grid(row=1, column=1, sticky="ew", padx=(8, 0))

        opciones = ttk.Frame(self)
        opciones.grid(row=1, column=0, sticky="ew", pady=(8, 0))
        opciones.columnconfigure((0, 1, 2), weight=1, uniform="opc")
        for columna, (titulo, variable, valores) in enumerate((
            ("Tipo de cliente", self._tipo, list(etiquetas.TIPOS_CLIENTE.values())),
            ("Prioridad", self._prioridad, list(etiquetas.PRIORIDADES.values())),
            ("Envío", self._envio, list(etiquetas.ENVIOS_CON_COSTO.values())),
        )):
            ttk.Label(opciones, text=titulo).grid(row=0, column=columna, sticky="w", padx=(0 if columna == 0 else 6, 0))
            combo = ttk.Combobox(opciones, textvariable=variable, values=valores, state="readonly", width=12)
            combo.grid(row=1, column=columna, sticky="ew", padx=(0 if columna == 0 else 6, 0))
            combo.bind("<<ComboboxSelected>>", lambda _e: self._actualizar_importes())

        ttk.Separator(self).grid(row=2, column=0, sticky="ew", pady=10)

        # --- producto y carrito ---
        ttk.Label(self, text="Producto").grid(row=3, column=0, sticky="w")
        self._combo_producto = ttk.Combobox(
            self, textvariable=self._producto, values=controlador.opciones_producto, state="readonly"
        )
        self._combo_producto.grid(row=4, column=0, sticky="ew")

        fila_cantidad = ttk.Frame(self)
        fila_cantidad.grid(row=5, column=0, sticky="ew", pady=(8, 0))
        ttk.Label(fila_cantidad, text="Cantidad").pack(side="left")
        self._campo_cantidad = ttk.Spinbox(fila_cantidad, from_=1, to=999, textvariable=self._cantidad, width=6)
        self._campo_cantidad.pack(side="left", padx=(8, 12))
        self._campo_cantidad.bind("<Return>", lambda _e: self._agregar())
        ttk.Button(fila_cantidad, text="Agregar al carrito", command=self._agregar).pack(side="left")

        self._tabla = ttk.Treeview(self, columns=("producto", "cantidad", "importe"), show="headings",
                                   height=5, selectmode="browse")
        self._tabla.heading("producto", text="Producto")
        self._tabla.heading("cantidad", text="Cant.")
        self._tabla.heading("importe", text="Importe")
        self._tabla.column("producto", width=190, anchor="w")
        self._tabla.column("cantidad", width=45, anchor="center", stretch=False)
        self._tabla.column("importe", width=85, anchor="e", stretch=False)
        self._tabla.grid(row=6, column=0, sticky="nsew", pady=(10, 4))
        self.rowconfigure(6, weight=1)

        botones = ttk.Frame(self)
        botones.grid(row=7, column=0, sticky="w")
        ttk.Button(botones, text="Quitar línea", command=self._quitar).pack(side="left")
        ttk.Button(botones, text="Vaciar carrito", command=self._vaciar).pack(side="left", padx=6)

        # --- importes (vista previa con las reglas de negocio) ---
        totales = ttk.Frame(self)
        totales.grid(row=8, column=0, sticky="ew", pady=(10, 0))
        totales.columnconfigure(1, weight=1)
        for fila, nombre in enumerate(self._importes):
            es_total = nombre == "Total"
            estilo = "Total.TLabel" if es_total else "TLabel"
            ttk.Label(totales, text=nombre, style=estilo).grid(row=fila, column=0, sticky="w")
            ttk.Label(totales, textvariable=self._importes[nombre], style=estilo).grid(
                row=fila, column=1, sticky="e")

        ttk.Button(self, text="Registrar pedido", style="Primario.TButton", command=self._registrar).grid(
            row=9, column=0, sticky="ew", pady=(12, 0))

    # --- acciones ------------------------------------------------------------------------

    def _agregar(self) -> None:
        try:
            self._controlador.agregar_al_carrito(self._producto.get(), self._cantidad.get())
        except (ErrorFormulario, PedidoInvalidoError) as error:
            self._avisar(error)
            self._campo_cantidad.focus_set()
            return
        self._cantidad.set("1")
        self._refrescar_carrito()

    def _quitar(self) -> None:
        seleccion = self._tabla.selection()
        try:
            self._controlador.quitar_del_carrito(self._tabla.index(seleccion[0]) if seleccion else -1)
        except ErrorFormulario as error:
            self._avisar(error)
            return
        self._refrescar_carrito()

    def _vaciar(self) -> None:
        self._controlador.vaciar_carrito()
        self._refrescar_carrito()

    def _registrar(self) -> None:
        try:
            pedido = self._controlador.registrar(
                self._cliente_id.get(), self._cliente_nombre.get(), self._tipo.get(),
                self._envio_nombre(), self._prioridad.get(),
            )
        except (ErrorFormulario, PedidoInvalidoError) as error:
            self._avisar(error)
            return
        self._cliente_id.set("")
        self._cliente_nombre.set("")
        self._refrescar_carrito()
        self._campo_id.focus_set()
        self._al_registrar(pedido)

    # --- soporte -------------------------------------------------------------------------

    def _avisar(self, error: Exception) -> None:
        """Muestra el error: aviso si es un dato mal capturado, error si lo rechazó el negocio."""
        if isinstance(error, PedidoInvalidoError):
            messagebox.showerror("Pedido inválido", str(error), parent=self)
        else:
            messagebox.showwarning("Revisa el formulario", str(error), parent=self)

    def _envio_nombre(self) -> str:
        """«Estándar ($50)» -> «Estándar», que es lo que espera el controlador."""
        return self._envio.get().split(" (")[0]

    def _refrescar_carrito(self) -> None:
        self._tabla.delete(*self._tabla.get_children())
        for linea in self._controlador.carrito:
            self._tabla.insert("", "end", values=(linea.item.nombre, linea.cantidad,
                                                  etiquetas.dinero(linea.importe)))
        self._actualizar_importes()

    def _actualizar_importes(self) -> None:
        desglose = self._controlador.vista_previa(self._tipo.get(), self._envio_nombre())
        valores = (
            dict.fromkeys(self._importes, "—") if desglose is None else {
                "Subtotal": etiquetas.dinero(desglose.subtotal),
                "Descuento": f"-{etiquetas.dinero(desglose.descuento)}",
                "IVA": etiquetas.dinero(desglose.iva),
                "Envío": etiquetas.dinero(desglose.envio),
                "Total": etiquetas.dinero(desglose.total),
            }
        )
        for nombre, texto in valores.items():
            self._importes[nombre].set(texto)
