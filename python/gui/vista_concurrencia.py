"""Panel de concurrencia: muestra en tiempo real cómo el despachador procesa la cola.

Responsable: Yurem (Concurrencia en la interfaz).

El despachador trabaja en otro hilo y no toca la interfaz: deja eventos en una
cola. Este panel los recoge con after() cada 50 ms desde el hilo principal (el
único que puede tocar widgets en Tkinter) y actualiza la tabla de la cola, la
barra de avance y el registro de eventos.
"""
from __future__ import annotations

import time
import tkinter as tk
from tkinter import messagebox, ttk
from typing import Callable

from concurrencia import FLUJO_ESTADOS, estados_pendientes
from despachador import EventoDespacho, TipoEvento
from gui import estilos, etiquetas
from gui.controlador_concurrencia import (
    RETARDO_POR_DEFECTO_MS,
    TRABAJADORES_POR_DEFECTO,
    ControladorConcurrencia,
    ErrorConcurrencia,
)
from modelos import Pedido

INTERVALO_MS = 50
PASOS = len(FLUJO_ESTADOS) - 1


def barra_de_progreso(estado) -> str:
    """▰▰▱ 67 % según cuántos estados del flujo lleva recorridos."""
    if estado not in FLUJO_ESTADOS:
        return "—"
    avance = FLUJO_ESTADOS.index(estado)
    return f"{'▰' * avance}{'▱' * (PASOS - avance)}  {round(100 * avance / PASOS)} %"


class VistaConcurrencia(ttk.LabelFrame):
    def __init__(
        self,
        master: tk.Misc,
        controlador: ControladorConcurrencia,
        al_cambiar: Callable[[], None],
        al_informar: Callable[[str], None],
    ) -> None:
        super().__init__(master, text="Despachador de pedidos (concurrencia)")
        self._controlador = controlador
        self._al_cambiar = al_cambiar
        self._al_informar = al_informar
        self._retardo = tk.StringVar(value=str(RETARDO_POR_DEFECTO_MS))
        self._trabajadores = tk.StringVar(value=str(TRABAJADORES_POR_DEFECTO))
        self._estado = tk.StringVar(value="Inactivo. Pulsa «Procesar cola» para despachar los pedidos pendientes.")
        self._inicio_corrida = 0.0
        self._transiciones_hechas = 0
        self._transiciones_totales = 0
        self._deteniendo = False
        self._cancelar_tick: str | None = None

        # --- controles ---
        controles = ttk.Frame(self)
        controles.grid(row=0, column=0, columnspan=2, sticky="ew")
        ttk.Label(controles, text="Retardo por transición (ms)").pack(side="left")
        self._campo_retardo = ttk.Spinbox(controles, from_=50, to=5000, increment=100,
                                          textvariable=self._retardo, width=6)
        self._campo_retardo.pack(side="left", padx=(6, 16))
        ttk.Label(controles, text="Trabajadores simultáneos").pack(side="left")
        self._campo_trabajadores = ttk.Spinbox(controles, from_=1, to=8, textvariable=self._trabajadores, width=4)
        self._campo_trabajadores.pack(side="left", padx=(6, 16))
        self._boton_iniciar = ttk.Button(controles, text="▶  Procesar cola", style="Primario.TButton",
                                         command=self._iniciar)
        self._boton_iniciar.pack(side="left")
        self._boton_detener = ttk.Button(controles, text="■  Detener", command=self._detener, state="disabled")
        self._boton_detener.pack(side="left", padx=6)

        # --- cola ---
        self._cola = ttk.Treeview(
            self, columns=("orden", "pedido", "prioridad", "trabajador", "progreso", "estado"),
            show="headings", height=6, selectmode="none",
        )
        for columna, titulo, ancho, ancla in (
            ("orden", "#", 32, "center"), ("pedido", "Pedido", 80, "w"), ("prioridad", "Prioridad", 88, "w"),
            ("trabajador", "Trabajador", 85, "w"), ("progreso", "Progreso", 120, "w"), ("estado", "Estado", 95, "w"),
        ):
            self._cola.heading(columna, text=titulo)
            self._cola.column(columna, width=ancho, anchor=ancla, stretch=columna == "progreso")
        estilos.colorear_filas(self._cola)
        self._cola.tag_configure("activo", font=(estilos.FUENTE, 10, "bold"))
        self._cola.grid(row=1, column=0, sticky="nsew", pady=(8, 0))

        # --- registro de eventos ---
        marco_log = ttk.Frame(self)
        marco_log.grid(row=1, column=1, sticky="nsew", padx=(8, 0), pady=(8, 0))
        self._log = tk.Text(marco_log, height=5, width=44, wrap="word", state="disabled",
                            background=estilos.SUPERFICIE, relief="flat", font="TkFixedFont",
                            highlightthickness=1, highlightbackground=estilos.BORDE)
        barra = ttk.Scrollbar(marco_log, command=self._log.yview)
        self._log.configure(yscrollcommand=barra.set)
        barra.pack(side="right", fill="y")
        self._log.pack(side="left", fill="both", expand=True)
        for estado, (_fondo, texto) in estilos.COLORES_ESTADO.items():
            self._log.tag_configure(estado.name, foreground=texto)
        self._log.tag_configure("error", foreground=estilos.PELIGRO)
        self._log.tag_configure("suave", foreground=estilos.TEXTO_SUAVE)

        # --- avance general ---
        self._avance = ttk.Progressbar(self, mode="determinate")
        self._avance.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(8, 2))
        ttk.Label(self, textvariable=self._estado, style="Suave.TLabel").grid(
            row=3, column=0, columnspan=2, sticky="w")

        self.columnconfigure(0, weight=3)
        self.columnconfigure(1, weight=2)
        self.rowconfigure(1, weight=1)
        self._tick()

    # --- acciones ------------------------------------------------------------------------

    def _iniciar(self) -> None:
        try:
            cola = self._controlador.iniciar(self._retardo.get(), self._trabajadores.get())
        except ErrorConcurrencia as error:
            messagebox.showwarning("No se puede procesar", str(error), parent=self)
            return
        self._preparar_corrida(cola)

    def _detener(self) -> None:
        self._controlador.detener()
        self._deteniendo = True
        self._estado.set("Deteniendo…")
        self._boton_detener.configure(state="disabled")

    def _preparar_corrida(self, cola: list[Pedido]) -> None:
        self._cola.delete(*self._cola.get_children())
        for posicion, pedido in enumerate(cola, start=1):
            self._cola.insert("", "end", iid=pedido.id, tags=(pedido.estado.name,), values=(
                posicion, pedido.id, etiquetas.PRIORIDADES[pedido.prioridad], "en espera",
                barra_de_progreso(pedido.estado), etiquetas.ESTADOS[pedido.estado]))
        self._transiciones_totales = sum(len(estados_pendientes(p.estado)) for p in cola)
        self._transiciones_hechas = 0
        self._deteniendo = False
        self._avance.configure(maximum=max(1, self._transiciones_totales), value=0)
        self._inicio_corrida = time.perf_counter()
        self._log.configure(state="normal")
        self._log.delete("1.0", "end")
        self._log.configure(state="disabled")
        self._poner_controles(en_ejecucion=True)
        self._estado.set(f"Procesando {len(cola)} pedido(s)…")
        self._al_informar(f"Despachador: procesando {len(cola)} pedido(s) por prioridad.")

    def _poner_controles(self, en_ejecucion: bool) -> None:
        ajuste = "disabled" if en_ejecucion else "normal"
        for control in (self._boton_iniciar, self._campo_retardo, self._campo_trabajadores):
            control.configure(state=ajuste)
        self._boton_detener.configure(state="normal" if en_ejecucion else "disabled")

    # --- tiempo real ---------------------------------------------------------------------

    def _tick(self) -> None:
        """Se ejecuta en el hilo principal cada 50 ms: recoge los eventos del despachador y los pinta."""
        eventos = self._controlador.eventos()
        if eventos:
            for evento in eventos:
                self._aplicar(evento)
            if any(e.tipo in (TipoEvento.TRANSICION, TipoEvento.CORRIDA_TERMINADA, TipoEvento.CORRIDA_DETENIDA)
                   for e in eventos):
                self._al_cambiar()  # el dashboard repinta su tabla una sola vez por lote de eventos
        if self._controlador.en_ejecucion and not self._deteniendo:
            transcurrido = time.perf_counter() - self._inicio_corrida
            self._estado.set(
                f"Procesando… {self._transiciones_hechas}/{self._transiciones_totales} transiciones "
                f"· {transcurrido:.1f} s"
            )
        self._cancelar_tick = self.after(INTERVALO_MS, self._tick)

    def _aplicar(self, evento: EventoDespacho) -> None:
        segundos = f"+{evento.marca_ms / 1000:5.2f} s"
        tipo = evento.tipo
        if tipo is TipoEvento.CORRIDA_INICIADA:
            self._registrar(f"{segundos}  Corrida iniciada ({evento.detalle} pedidos)", "suave")
        elif tipo is TipoEvento.PEDIDO_INICIADO:
            self._actualizar_fila(evento.pedido_id, trabajador=f"Trabajador {evento.trabajador}", activo=True)
            self._registrar(f"{segundos}  Trabajador {evento.trabajador} toma {evento.pedido_id}", "suave")
        elif tipo is TipoEvento.TRANSICION:
            self._transiciones_hechas += 1
            self._avance.configure(value=self._transiciones_hechas)
            self._actualizar_fila(evento.pedido_id, estado=evento.estado_nuevo, activo=True)
            self._registrar(
                f"{segundos}  {evento.pedido_id}: {etiquetas.ESTADOS[evento.estado_anterior]} → "
                f"{etiquetas.ESTADOS[evento.estado_nuevo]}", evento.estado_nuevo.name)
        elif tipo is TipoEvento.PEDIDO_TERMINADO:
            self._actualizar_fila(evento.pedido_id, trabajador="libre", activo=False)
            self._registrar(f"{segundos}  {evento.pedido_id} completado", "suave")
        elif tipo is TipoEvento.CORRIDA_TERMINADA:
            self._terminar(evento)
        elif tipo is TipoEvento.CORRIDA_DETENIDA:
            self._poner_controles(en_ejecucion=False)
            mensaje = f"Corrida detenida ({evento.detalle} pedidos completados)."
            self._estado.set(mensaje)
            self._registrar(f"{segundos}  {mensaje}", "error")
            self._al_informar(f"Despachador: {mensaje}")
        elif tipo is TipoEvento.ERROR:
            self._poner_controles(en_ejecucion=False)
            self._estado.set("La corrida terminó con un error.")
            self._registrar(f"Error: {evento.detalle}", "error")
            messagebox.showerror("Error en el despachador", evento.detalle, parent=self)

    def _terminar(self, evento: EventoDespacho) -> None:
        resumen = evento.resumen
        self._poner_controles(en_ejecucion=False)
        mensaje = (
            f"Cola completada: {resumen.procesados} pedido(s) en {resumen.tiempo_ms / 1000:.2f} s "
            f"(secuencial estimado {resumen.secuencial_estimado_ms / 1000:.2f} s, "
            f"aceleración ×{resumen.aceleracion})."
        )
        self._estado.set(mensaje)
        self._registrar(f"+{evento.marca_ms / 1000:5.2f} s  {mensaje}", "suave")
        self._al_informar(f"Despachador: {mensaje}")

    def _actualizar_fila(self, pedido_id: str, estado=None, trabajador: str | None = None,
                         activo: bool | None = None) -> None:
        if not self._cola.exists(pedido_id):
            return
        valores = list(self._cola.item(pedido_id, "values"))
        etiquetas_fila = list(self._cola.item(pedido_id, "tags"))
        if trabajador is not None:
            valores[3] = trabajador
        if estado is not None:
            valores[4], valores[5] = barra_de_progreso(estado), etiquetas.ESTADOS[estado]
            etiquetas_fila = [estado.name] + [t for t in etiquetas_fila if t == "activo"]
        if activo is not None:
            etiquetas_fila = [t for t in etiquetas_fila if t != "activo"] + (["activo"] if activo else [])
        self._cola.item(pedido_id, values=valores, tags=etiquetas_fila)

    def _registrar(self, texto: str, etiqueta: str) -> None:
        self._log.configure(state="normal")
        self._log.insert("end", texto + "\n", etiqueta)
        self._log.see("end")
        self._log.configure(state="disabled")

    def destroy(self) -> None:
        if self._cancelar_tick is not None:
            self.after_cancel(self._cancelar_tick)
        super().destroy()
