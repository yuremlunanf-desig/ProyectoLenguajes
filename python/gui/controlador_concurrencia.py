"""Controlador del panel de concurrencia: valida los parámetros y reparte los eventos del despachador.

Responsable: Yurem (Concurrencia en la interfaz).
"""
from __future__ import annotations

from almacen import AlmacenPedidos
from despachador import Despachador, DespachadorError, EventoDespacho
from modelos import Pedido

RETARDO_MIN_MS, RETARDO_MAX_MS, RETARDO_POR_DEFECTO_MS = 50, 5000, 1000
TRABAJADORES_MIN, TRABAJADORES_MAX, TRABAJADORES_POR_DEFECTO = 1, 8, 2


class ErrorConcurrencia(ValueError):
    """Un parámetro de la corrida es inválido o no se puede iniciar. El mensaje se muestra tal cual."""


class ControladorConcurrencia:
    def __init__(self, almacen: AlmacenPedidos, despachador: Despachador | None = None) -> None:
        self._almacen = almacen
        self._despachador = despachador or Despachador()

    @property
    def en_ejecucion(self) -> bool:
        return self._despachador.en_ejecucion

    def cola_actual(self) -> list[Pedido]:
        """La cola tal como la procesaría el despachador ahora mismo (prioridad primero)."""
        return Despachador.cola_de(self._almacen.pedidos)

    def iniciar(self, retardo_texto: str, trabajadores_texto: str) -> list[Pedido]:
        retardo = self._entero(retardo_texto, "El retardo", RETARDO_MIN_MS, RETARDO_MAX_MS, "ms")
        trabajadores = self._entero(
            trabajadores_texto, "La cantidad de trabajadores", TRABAJADORES_MIN, TRABAJADORES_MAX, ""
        )
        try:
            return self._despachador.iniciar(self._almacen.pedidos, retardo, trabajadores)
        except DespachadorError as error:
            raise ErrorConcurrencia(str(error)) from error

    def detener(self) -> None:
        self._despachador.detener()

    def cerrar(self) -> None:
        """Se llama al cerrar la ventana: cancela la corrida y espera un instante a que termine."""
        self._despachador.detener()
        self._despachador.esperar(timeout=2)

    def eventos(self) -> list[EventoDespacho]:
        return self._despachador.eventos_pendientes()

    @staticmethod
    def _entero(texto: str, nombre: str, minimo: int, maximo: int, unidad: str) -> int:
        try:
            valor = int(texto.strip())
        except ValueError:
            raise ErrorConcurrencia(f"{nombre} debe ser un número entero.") from None
        if not minimo <= valor <= maximo:
            sufijo = f" {unidad}" if unidad else ""
            raise ErrorConcurrencia(f"{nombre} debe estar entre {minimo} y {maximo}{sufijo}.")
        return valor
