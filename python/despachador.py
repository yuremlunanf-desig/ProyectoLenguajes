"""Despachador de la cola de pedidos: procesa en segundo plano y avisa cada cambio de estado.

Responsable: Yurem (Concurrencia en la interfaz).

Tkinter no es seguro entre hilos: solo el hilo principal puede tocar widgets. Por eso el
despachador trabaja en su propio hilo (con asyncio) y, en vez de llamar a la interfaz, deja
EventoDespacho en una cola (queue.Queue). La ventana vacía esa cola con after() desde el hilo
principal.

El avance de cada pedido es el de concurrencia.avanzar_pedido. Aquí solo se agrega lo que la
interfaz necesita: orden por prioridad, un máximo de pedidos a la vez («trabajadores»), eventos y
cancelación.
"""
from __future__ import annotations

import asyncio
import queue
import threading
import time
from dataclasses import dataclass
from enum import Enum
from typing import Iterable

from concurrencia import avanzar_pedido, estados_pendientes
from funcional import ordenar_por_prioridad
from modelos import EstadoPedido, Pedido


class DespachadorError(Exception):
    """No se pudo iniciar la corrida (ya hay una en curso o no hay nada que procesar)."""


class TipoEvento(Enum):
    CORRIDA_INICIADA = "CORRIDA_INICIADA"
    PEDIDO_INICIADO = "PEDIDO_INICIADO"
    TRANSICION = "TRANSICION"
    PEDIDO_TERMINADO = "PEDIDO_TERMINADO"
    CORRIDA_TERMINADA = "CORRIDA_TERMINADA"
    CORRIDA_DETENIDA = "CORRIDA_DETENIDA"
    ERROR = "ERROR"


@dataclass(frozen=True)
class ResumenCorrida:
    procesados: int
    tiempo_ms: float
    secuencial_estimado_ms: float

    @property
    def aceleracion(self) -> float | None:
        if self.tiempo_ms == 0:
            return None
        return round(self.secuencial_estimado_ms / self.tiempo_ms, 2)


@dataclass(frozen=True)
class EventoDespacho:
    tipo: TipoEvento
    pedido_id: str = ""
    trabajador: int = 0
    estado_anterior: EstadoPedido | None = None
    estado_nuevo: EstadoPedido | None = None
    detalle: str = ""
    marca_ms: float = 0.0  # milisegundos desde que arrancó la corrida
    resumen: ResumenCorrida | None = None


class Despachador:
    def __init__(self) -> None:
        self._eventos: queue.Queue[EventoDespacho] = queue.Queue()
        self._cerrojo = threading.Lock()  # protege los datos que comparten la ventana y el hilo del despachador
        self._ocupado = False
        self._hilo: threading.Thread | None = None
        self._bucle: asyncio.AbstractEventLoop | None = None
        self._tarea: asyncio.Task | None = None
        self._detener_pedido = False
        # Datos de la corrida en curso
        self._inicio = 0.0
        self._retardo_ms = 0
        self._pendientes: list[Pedido] = []
        self._terminados = 0

    @property
    def en_ejecucion(self) -> bool:
        return self._ocupado

    @staticmethod
    def cola_de(pedidos: Iterable[Pedido]) -> list[Pedido]:
        """Pedidos que aún tienen estados por recorrer, el de mayor prioridad primero."""
        pendientes = []
        for pedido in pedidos:
            if estados_pendientes(pedido.estado):
                pendientes.append(pedido)
        return ordenar_por_prioridad(pendientes)

    def iniciar(self, pedidos: Iterable[Pedido], retardo_ms: int, trabajadores: int) -> list[Pedido]:
        """Arranca una corrida en segundo plano y devuelve la cola que va a procesar."""
        cola = self.cola_de(pedidos)
        if not cola:
            raise DespachadorError("No hay pedidos pendientes por procesar.")
        with self._cerrojo:
            if self._ocupado:
                raise DespachadorError("El despachador ya está procesando la cola.")
            self._ocupado = True
            self._detener_pedido = False
        self._hilo = threading.Thread(
            target=self._ejecutar, args=(cola, retardo_ms, max(1, trabajadores)), daemon=True
        )
        self._hilo.start()
        return cola

    def detener(self) -> None:
        """Cancela la corrida en curso. Los pedidos quedan en el estado que ya alcanzaron."""
        with self._cerrojo:
            self._detener_pedido = True
            if self._bucle is not None and self._tarea is not None:
                try:
                    self._bucle.call_soon_threadsafe(self._tarea.cancel)
                except RuntimeError:
                    pass  # el bucle acaba de cerrarse: la corrida ya terminó sola

    def esperar(self, timeout: float | None = None) -> None:
        """Bloquea hasta que termine el hilo (lo usan las pruebas y el cierre de la ventana)."""
        if self._hilo is not None:
            self._hilo.join(timeout)

    def eventos_pendientes(self) -> list[EventoDespacho]:
        """Saca, sin bloquear, todos los eventos acumulados desde la última llamada."""
        eventos = []
        while True:
            try:
                eventos.append(self._eventos.get_nowait())
            except queue.Empty:
                return eventos

    # --- hilo de fondo -------------------------------------------------------------------

    def _ejecutar(self, cola: list[Pedido], retardo_ms: int, trabajadores: int) -> None:
        """Se ejecuta en el hilo del despachador: corre asyncio y, al terminar, avisa el resultado."""
        try:
            final = asyncio.run(self._correr(cola, retardo_ms, trabajadores))
        except Exception as error:  # el hilo nunca debe morir en silencio
            final = EventoDespacho(TipoEvento.ERROR, detalle=f"{type(error).__name__}: {error}")
        with self._cerrojo:
            self._ocupado = False  # se libera antes del aviso final: la ventana ya puede iniciar otra corrida
            self._bucle = None
            self._tarea = None
        self._eventos.put(final)

    async def _correr(self, cola: list[Pedido], retardo_ms: int, trabajadores: int) -> EventoDespacho:
        self._inicio = time.perf_counter()
        self._retardo_ms = retardo_ms
        self._pendientes = list(cola)  # los trabajadores toman pedidos de aquí, el de mayor prioridad primero
        self._terminados = 0
        transiciones = sum(len(estados_pendientes(p.estado)) for p in cola)

        with self._cerrojo:
            self._bucle = asyncio.get_running_loop()
            self._tarea = asyncio.current_task()
            cancelar_ya = self._detener_pedido
        if cancelar_ya:
            return self._evento_detenido(len(cola))

        self._avisar(TipoEvento.CORRIDA_INICIADA, detalle=str(len(cola)))
        cantidad = min(trabajadores, len(cola))
        try:
            await asyncio.gather(*(self._trabajar(n) for n in range(1, cantidad + 1)))
        except asyncio.CancelledError:
            # Es la cancelación pedida con detener(): se informa y se termina con normalidad.
            return self._evento_detenido(len(cola))

        tiempo = self._ms()
        resumen = ResumenCorrida(self._terminados, tiempo, float(transiciones * retardo_ms))
        return EventoDespacho(TipoEvento.CORRIDA_TERMINADA, marca_ms=tiempo, resumen=resumen)

    async def _trabajar(self, trabajador: int) -> None:
        """Un trabajador toma pedidos de la cola, uno tras otro, hasta que no quede ninguno."""
        while self._pendientes:
            pedido = self._pendientes.pop(0)
            await self._atender(pedido, trabajador)

    async def _atender(self, pedido: Pedido, trabajador: int) -> None:
        self._avisar(TipoEvento.PEDIDO_INICIADO, pedido.id, trabajador)
        # avanzar_pedido llama a la función de abajo cada vez que el pedido cambia de estado.
        await avanzar_pedido(
            pedido,
            self._retardo_ms,
            lambda p, anterior, nuevo: self._avisar(TipoEvento.TRANSICION, p.id, trabajador, anterior, nuevo),
        )
        self._terminados += 1
        self._avisar(TipoEvento.PEDIDO_TERMINADO, pedido.id, trabajador)

    # --- ayudas ------------------------------------------------------------------------

    def _ms(self) -> float:
        return round((time.perf_counter() - self._inicio) * 1000, 1)

    def _avisar(
        self,
        tipo: TipoEvento,
        pedido_id: str = "",
        trabajador: int = 0,
        anterior: EstadoPedido | None = None,
        nuevo: EstadoPedido | None = None,
        detalle: str = "",
    ) -> None:
        self._eventos.put(EventoDespacho(tipo, pedido_id, trabajador, anterior, nuevo, detalle, self._ms()))

    def _evento_detenido(self, total: int) -> EventoDespacho:
        return EventoDespacho(
            TipoEvento.CORRIDA_DETENIDA, detalle=f"{self._terminados} de {total}", marca_ms=self._ms()
        )
