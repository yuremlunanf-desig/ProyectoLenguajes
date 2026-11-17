"""Cambio de estado de los pedidos de forma asíncrona con asyncio.

Responsable: Edsson (Concurrencia y Main).

Cada pedido avanza por el flujo PENDIENTE -> EN_PROCESO -> ENVIADO -> ENTREGADO.
Cada transición tarda un tiempo simulado (almacén, paquetería). En modo
concurrente las esperas de todos los pedidos se traslapan con asyncio.gather;
en modo secuencial se atiende un pedido tras otro y sirve como línea base.
"""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Callable, Iterable

from modelos import EstadoPedido, Pedido

FLUJO_ESTADOS = (
    EstadoPedido.PENDIENTE,
    EstadoPedido.EN_PROCESO,
    EstadoPedido.ENVIADO,
    EstadoPedido.ENTREGADO,
)
RETARDO_TRANSICION_MS = 100


@dataclass(frozen=True)
class ResultadoProcesamiento:
    pedido_id: str
    estado_inicial: EstadoPedido
    estado_final: EstadoPedido
    transiciones: tuple[str, ...]
    duracion_ms: float


def estados_pendientes(estado: EstadoPedido) -> tuple[EstadoPedido, ...]:
    """Estados que le faltan recorrer a un pedido (vacío si ya terminó o se canceló)."""
    if estado not in FLUJO_ESTADOS:
        return ()
    return FLUJO_ESTADOS[FLUJO_ESTADOS.index(estado) + 1 :]


AlCambiarEstado = Callable[[Pedido, EstadoPedido, EstadoPedido], None]


async def avanzar_pedido(
    pedido: Pedido,
    retardo_ms: int = RETARDO_TRANSICION_MS,
    al_cambiar_estado: AlCambiarEstado | None = None,
) -> ResultadoProcesamiento:
    """Lleva un pedido hasta ENTREGADO, esperando retardo_ms en cada transición.

    al_cambiar_estado (opcional) se invoca como (pedido, estado_anterior,
    estado_nuevo) justo después de cada transición. La interfaz gráfica lo usa
    para enterarse en tiempo real; sin él la función se comporta igual que antes.
    """
    inicio = time.perf_counter()
    estado_inicial = pedido.estado
    transiciones: list[str] = []
    for siguiente in estados_pendientes(estado_inicial):
        await asyncio.sleep(retardo_ms / 1000)
        anterior = pedido.estado
        transiciones.append(f"{anterior.name}->{siguiente.name}")
        pedido.cambiar_estado(siguiente)
        if al_cambiar_estado is not None:
            al_cambiar_estado(pedido, anterior, siguiente)
    return ResultadoProcesamiento(
        pedido_id=pedido.id,
        estado_inicial=estado_inicial,
        estado_final=pedido.estado,
        transiciones=tuple(transiciones),
        duracion_ms=(time.perf_counter() - inicio) * 1000,
    )


async def procesar_concurrente(
    pedidos: Iterable[Pedido], retardo_ms: int = RETARDO_TRANSICION_MS
) -> list[ResultadoProcesamiento]:
    """Avanza todos los pedidos a la vez. Los resultados salen en el orden de entrada."""
    return list(await asyncio.gather(*(avanzar_pedido(p, retardo_ms) for p in pedidos)))


async def procesar_secuencial(
    pedidos: Iterable[Pedido], retardo_ms: int = RETARDO_TRANSICION_MS
) -> list[ResultadoProcesamiento]:
    """Avanza los pedidos uno por uno (línea base para medir la aceleración)."""
    return [await avanzar_pedido(p, retardo_ms) for p in pedidos]
