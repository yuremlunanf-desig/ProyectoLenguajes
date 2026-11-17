"""Lectura y parseo del JSON de solicitudes a objetos del dominio.

Responsable: Ian (Modelos y Datos).

El lector no valida reglas de negocio: entrega los pedidos tal como vienen
en el archivo y deja la validación a negocio.py.
"""
from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from modelos import (
    Cliente,
    EstadoPedido,
    Pedido,
    Prioridad,
    Producto,
    TipoCliente,
    TipoEnvio,
)


def leer_pedidos(ruta: str | Path) -> list[Pedido]:
    """Lee el archivo JSON y devuelve la lista de pedidos que contiene."""
    with open(ruta, encoding="utf-8") as archivo:
        # parse_float=Decimal lee los precios directo del texto, sin pasar por float.
        datos = json.load(archivo, parse_float=Decimal)
    return [_a_pedido(d) for d in datos.get("pedidos", [])]


def _a_pedido(d: dict[str, Any]) -> Pedido:
    return Pedido(
        id=d["id"],
        cliente=_a_cliente(d["cliente"]),
        fecha=datetime.fromisoformat(d["fecha"]),
        productos=[_a_producto(p) for p in d.get("productos", [])],
        envio=TipoEnvio[d.get("envio", "ESTANDAR").upper()],
        prioridad=Prioridad[d.get("prioridad", "MEDIA").upper()],
        estado=EstadoPedido[d.get("estado", "PENDIENTE").upper()],
    )


def _a_cliente(d: dict[str, Any]) -> Cliente:
    return Cliente(
        id=d["id"],
        nombre=d["nombre"],
        tipo=TipoCliente[d.get("tipo", "REGULAR").upper()],
    )


def _a_producto(d: dict[str, Any]) -> Producto:
    return Producto(
        sku=d["sku"],
        nombre=d["nombre"],
        precio=Decimal(str(d["precio"])),
        cantidad=d["cantidad"],
    )
