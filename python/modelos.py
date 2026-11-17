"""Modelos de dominio de la tienda: Producto, Cliente y Pedido.

Responsable: Ian (Modelos y Datos).

Estas clases solo guardan datos. Los cálculos y las validaciones viven en
negocio.py, para que cada módulo tenga una sola responsabilidad.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum


class TipoCliente(Enum):
    REGULAR = "REGULAR"
    FRECUENTE = "FRECUENTE"


class TipoEnvio(Enum):
    ESTANDAR = "ESTANDAR"
    EXPRESS = "EXPRESS"


class EstadoPedido(Enum):
    PENDIENTE = "PENDIENTE"
    EN_PROCESO = "EN_PROCESO"
    ENVIADO = "ENVIADO"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"


class Prioridad(Enum):
    """El valor numérico define el orden: 1 se atiende primero."""

    ALTA = 1
    MEDIA = 2
    BAJA = 3


@dataclass(frozen=True)
class Producto:
    sku: str
    nombre: str
    precio: Decimal
    cantidad: int


@dataclass(frozen=True)
class Cliente:
    id: str
    nombre: str
    tipo: TipoCliente = TipoCliente.REGULAR

    @property
    def es_frecuente(self) -> bool:
        return self.tipo is TipoCliente.FRECUENTE


@dataclass
class Pedido:
    id: str
    cliente: Cliente
    fecha: datetime
    productos: list[Producto] = field(default_factory=list)
    envio: TipoEnvio = TipoEnvio.ESTANDAR
    prioridad: Prioridad = Prioridad.MEDIA
    estado: EstadoPedido = EstadoPedido.PENDIENTE

    def cambiar_estado(self, nuevo: EstadoPedido) -> None:
        self.estado = nuevo
