"""Reglas de negocio: validaciones y cálculos monetarios de un pedido.

Responsable: Leonardo (Negocio y Validaciones).

Reglas:
- Descuento (no acumulable): 10% si el subtotal es >= $2,000; si no, 5% si el
  cliente es frecuente; en otro caso no hay descuento.
- IVA: 16% sobre (subtotal - descuento).
- Envío: estándar $50, express $120 (no causa IVA).
- Total = subtotal - descuento + IVA + envío.

Todo el dinero se maneja con Decimal y se redondea a centavos con
ROUND_HALF_UP (0.005 sube a 0.01).
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from modelos import Pedido, TipoEnvio

TASA_IVA = Decimal("0.16")
UMBRAL_DESCUENTO_MONTO = Decimal("2000.00")
DESCUENTO_POR_MONTO = Decimal("0.10")
DESCUENTO_FRECUENTE = Decimal("0.05")
COSTO_ENVIO = {
    TipoEnvio.ESTANDAR: Decimal("50.00"),
    TipoEnvio.EXPRESS: Decimal("120.00"),
}
_CENTAVO = Decimal("0.01")


class PedidoInvalidoError(ValueError):
    """El pedido no cumple las reglas mínimas para registrarse."""


def redondear(monto: Decimal) -> Decimal:
    """Redondea a dos decimales con la regla comercial (mitad hacia arriba)."""
    return monto.quantize(_CENTAVO, rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class Desglose:
    """Importes de un pedido, ya redondeados a centavos."""

    subtotal: Decimal
    descuento: Decimal
    iva: Decimal
    envio: Decimal
    total: Decimal


class ValidadorPedido:
    """Validaciones estrictas: lanza PedidoInvalidoError si el pedido no es válido."""

    @staticmethod
    def validar(pedido: Pedido) -> None:
        if not pedido.productos:
            raise PedidoInvalidoError(f"El pedido {pedido.id} no tiene productos.")
        for producto in pedido.productos:
            cantidad = producto.cantidad
            if not isinstance(cantidad, int) or cantidad <= 0:
                raise PedidoInvalidoError(
                    f"El pedido {pedido.id} tiene una cantidad inválida "
                    f"({cantidad}) en el producto {producto.sku}: debe ser un entero mayor que 0."
                )


class CalculadoraPedido:
    """Cálculos monetarios sobre un Pedido."""

    @staticmethod
    def subtotal(pedido: Pedido) -> Decimal:
        suma = sum((p.precio * p.cantidad for p in pedido.productos), Decimal("0"))
        return redondear(suma)

    @staticmethod
    def tasa_descuento(pedido: Pedido) -> Decimal:
        """Los descuentos no se acumulan: gana el de monto y, si no aplica, el de frecuente."""
        if CalculadoraPedido.subtotal(pedido) >= UMBRAL_DESCUENTO_MONTO:
            return DESCUENTO_POR_MONTO
        if pedido.cliente.es_frecuente:
            return DESCUENTO_FRECUENTE
        return Decimal("0")

    @staticmethod
    def descuento(pedido: Pedido) -> Decimal:
        return redondear(
            CalculadoraPedido.subtotal(pedido) * CalculadoraPedido.tasa_descuento(pedido)
        )

    @staticmethod
    def iva(pedido: Pedido) -> Decimal:
        base = CalculadoraPedido.subtotal(pedido) - CalculadoraPedido.descuento(pedido)
        return redondear(base * TASA_IVA)

    @staticmethod
    def envio(pedido: Pedido) -> Decimal:
        return COSTO_ENVIO[pedido.envio]

    @staticmethod
    def total(pedido: Pedido) -> Decimal:
        return CalculadoraPedido.desglose(pedido).total

    @staticmethod
    def desglose(pedido: Pedido) -> Desglose:
        """Valida el pedido y devuelve todos sus importes."""
        ValidadorPedido.validar(pedido)
        subtotal = CalculadoraPedido.subtotal(pedido)
        descuento = CalculadoraPedido.descuento(pedido)
        iva = CalculadoraPedido.iva(pedido)
        envio = CalculadoraPedido.envio(pedido)
        return Desglose(
            subtotal=subtotal,
            descuento=descuento,
            iva=iva,
            envio=envio,
            total=subtotal - descuento + iva + envio,
        )
