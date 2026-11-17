"""Consultas sobre colecciones de pedidos en estilo funcional.

Responsable: Yurem (Funcional y Testing).

Son funciones puras construidas con filter, map, sorted, reduce y lambdas:
no modifican la lista que reciben, siempre devuelven una nueva.
"""
from __future__ import annotations

from decimal import Decimal
from functools import reduce
from typing import Callable, Iterable

from modelos import EstadoPedido, Pedido
from negocio import CalculadoraPedido, Desglose


def buscar_por_cliente(pedidos: Iterable[Pedido], criterio: str) -> list[Pedido]:
    """Pedidos cuyo cliente coincide por id exacto o por parte del nombre."""
    texto = criterio.strip().lower()
    if not texto:
        return []
    return list(
        filter(
            lambda p: p.cliente.id.lower() == texto or texto in p.cliente.nombre.lower(),
            pedidos,
        )
    )


def filtrar_por_estado(pedidos: Iterable[Pedido], estado: EstadoPedido) -> list[Pedido]:
    return list(filter(lambda p: p.estado is estado, pedidos))


def ordenar_por_fecha(pedidos: Iterable[Pedido], descendente: bool = False) -> list[Pedido]:
    return sorted(pedidos, key=lambda p: p.fecha, reverse=descendente)


def ordenar_por_prioridad(pedidos: Iterable[Pedido]) -> list[Pedido]:
    """Primero la prioridad más alta; a igual prioridad, el pedido más antiguo."""
    return sorted(pedidos, key=lambda p: (p.prioridad.value, p.fecha))


def ids(pedidos: Iterable[Pedido]) -> list[str]:
    return list(map(lambda p: p.id, pedidos))


def contar_por_estado(pedidos: Iterable[Pedido]) -> dict[str, int]:
    return reduce(
        lambda conteo, p: {**conteo, p.estado.name: conteo.get(p.estado.name, 0) + 1},
        pedidos,
        {},
    )


def sumar_importes(
    desgloses: Iterable[Desglose], selector: Callable[[Desglose], Decimal]
) -> Decimal:
    """Suma un importe de cada desglose, por ejemplo: lambda d: d.iva."""
    return reduce(lambda acumulado, d: acumulado + selector(d), desgloses, Decimal("0.00"))


def total_vendido(pedidos: Iterable[Pedido]) -> Decimal:
    return sumar_importes(map(CalculadoraPedido.desglose, pedidos), lambda d: d.total)
