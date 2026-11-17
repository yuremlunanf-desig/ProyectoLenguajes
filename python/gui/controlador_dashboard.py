"""Controlador del dashboard: consultas y resumen de los pedidos para la tabla.

Responsable: Leonardo (Dashboard).

Las consultas reutilizan funcional.py (filter / sorted / reduce): aquí solo se
combinan y se les da formato de texto para la tabla.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from almacen import AlmacenPedidos
from funcional import (
    buscar_por_cliente,
    contar_por_estado,
    filtrar_por_estado,
    ordenar_por_fecha,
    ordenar_por_prioridad,
    sumar_importes,
)
from gui import etiquetas
from modelos import EstadoPedido, Pedido

COLUMNAS = (
    "ID", "Cliente", "Fecha", "Prioridad", "Envío",
    "Subtotal", "Descuento", "IVA", "Total", "Estado",
)
TODOS = "Todos"
ORDEN_FECHA, ORDEN_PRIORIDAD, ORDEN_ID = "Fecha", "Prioridad", "ID"
ORDENES = (ORDEN_FECHA, ORDEN_PRIORIDAD, ORDEN_ID)
FILTROS_ESTADO = (TODOS, *etiquetas.ESTADOS.values())


@dataclass(frozen=True)
class FilaPedido:
    id: str
    estado: EstadoPedido  # para colorear la fila
    valores: tuple[str, ...]  # en el orden de COLUMNAS


@dataclass(frozen=True)
class ResumenPedidos:
    total_pedidos: int
    por_estado: dict[EstadoPedido, int]
    total_vendido: Decimal
    rechazados: int


class ControladorDashboard:
    def __init__(self, almacen: AlmacenPedidos) -> None:
        self._almacen = almacen

    def consultar(
        self, texto_cliente: str = "", estado: str = TODOS, orden: str = ORDEN_FECHA
    ) -> list[FilaPedido]:
        pedidos = self._almacen.pedidos
        if texto_cliente.strip():
            pedidos = buscar_por_cliente(pedidos, texto_cliente)
        if estado != TODOS:
            pedidos = filtrar_por_estado(pedidos, etiquetas.invertir(etiquetas.ESTADOS)[estado])
        if orden == ORDEN_PRIORIDAD:
            pedidos = ordenar_por_prioridad(pedidos)
        elif orden == ORDEN_ID:
            pedidos = sorted(pedidos, key=lambda p: p.id)
        else:
            pedidos = ordenar_por_fecha(pedidos)
        return [self._fila(p) for p in pedidos]

    def resumen(self) -> ResumenPedidos:
        pedidos = self._almacen.pedidos
        nombres = contar_por_estado(pedidos)
        return ResumenPedidos(
            total_pedidos=len(pedidos),
            por_estado={e: nombres.get(e.name, 0) for e in EstadoPedido},
            total_vendido=sumar_importes(self._almacen.desgloses(), lambda d: d.total),
            rechazados=len(self._almacen.rechazos),
        )

    def rechazos(self) -> list[str]:
        return self._almacen.rechazos

    def recargar(self) -> list[str]:
        """Vuelve a los pedidos del JSON de solicitudes. Devuelve los motivos de rechazo."""
        return self._almacen.cargar()

    def detalle(self, pedido_id: str) -> str:
        """Texto con el desglose completo de un pedido (lo muestra la vista al hacer doble clic)."""
        pedido = next(p for p in self._almacen.pedidos if p.id == pedido_id)
        d = self._almacen.desglose(pedido_id)
        lineas = [
            f"Pedido {pedido.id} · {etiquetas.ESTADOS[pedido.estado]}",
            f"Cliente: {pedido.cliente.nombre} ({etiquetas.TIPOS_CLIENTE[pedido.cliente.tipo]})",
            f"Fecha: {pedido.fecha:%d/%m/%Y %H:%M}",
            "",
            "Productos:",
            *(
                f"  {p.cantidad} × {p.nombre} — {etiquetas.dinero(p.precio)} c/u"
                for p in pedido.productos
            ),
            "",
            f"Subtotal:   {etiquetas.dinero(d.subtotal)}",
            f"Descuento: -{etiquetas.dinero(d.descuento)}",
            f"IVA (16%):  {etiquetas.dinero(d.iva)}",
            f"Envío {etiquetas.ENVIOS[pedido.envio].lower()}: {etiquetas.dinero(d.envio)}",
            f"TOTAL:      {etiquetas.dinero(d.total)}",
        ]
        return "\n".join(lineas)

    def _fila(self, pedido: Pedido) -> FilaPedido:
        d = self._almacen.desglose(pedido.id)
        return FilaPedido(
            id=pedido.id,
            estado=pedido.estado,
            valores=(
                pedido.id,
                pedido.cliente.nombre,
                f"{pedido.fecha:%d/%m %H:%M}",
                etiquetas.PRIORIDADES[pedido.prioridad],
                etiquetas.ENVIOS[pedido.envio],
                etiquetas.dinero(d.subtotal),
                etiquetas.dinero(d.descuento),
                etiquetas.dinero(d.iva),
                etiquetas.dinero(d.total),
                etiquetas.ESTADOS[pedido.estado],
            ),
        )
