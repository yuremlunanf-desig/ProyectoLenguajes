"""Pruebas automatizadas con pytest (5 casos).

Responsable: Yurem (Funcional y Testing).

Ejecutar desde la carpeta python/:  python -m pytest -v
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pathlib import Path

import pytest

from funcional import (
    buscar_por_cliente,
    filtrar_por_estado,
    ids,
    ordenar_por_fecha,
    ordenar_por_prioridad,
)
from lector_json import leer_pedidos
from modelos import Cliente, EstadoPedido, Pedido, Producto, TipoCliente, TipoEnvio
from negocio import CalculadoraPedido, Desglose, PedidoInvalidoError, ValidadorPedido

RUTA_JSON = Path(__file__).resolve().parent.parent / "datos" / "solicitudes_pequenas.json"


def crear_pedido(lineas, tipo=TipoCliente.REGULAR, envio=TipoEnvio.ESTANDAR) -> Pedido:
    """Arma un pedido de prueba a partir de pares (precio, cantidad)."""
    productos = [
        Producto(sku=f"SKU-{i}", nombre=f"Producto {i}", precio=Decimal(precio), cantidad=cantidad)
        for i, (precio, cantidad) in enumerate(lineas, start=1)
    ]
    return Pedido(
        id="PRUEBA-1",
        cliente=Cliente(id="C999", nombre="Cliente de prueba", tipo=tipo),
        fecha=datetime(2026, 11, 1, 10, 0),
        productos=productos,
        envio=envio,
    )


def test_descuento_del_10_por_monto_con_iva_y_envio_estandar():
    pedido = crear_pedido([("899.50", 2), ("349.90", 1)])

    assert CalculadoraPedido.desglose(pedido) == Desglose(
        subtotal=Decimal("2148.90"),
        descuento=Decimal("214.89"),
        iva=Decimal("309.44"),
        envio=Decimal("50.00"),
        total=Decimal("2293.45"),
    )


def test_descuento_frecuente_del_5_y_no_acumulable_con_el_de_monto():
    lineas_chico = [("615.33", 1), ("89.99", 3)]
    lineas_grande = [("3299.00", 1), ("450.50", 1)]

    chico = CalculadoraPedido.desglose(
        crear_pedido(lineas_chico, TipoCliente.FRECUENTE, TipoEnvio.EXPRESS)
    )
    # 5% de 885.30 = 44.265: con ROUND_HALF_UP sube a 44.27.
    assert chico.descuento == Decimal("44.27")
    assert chico.total == Decimal("1095.59")

    grande = CalculadoraPedido.desglose(
        crear_pedido(lineas_grande, TipoCliente.FRECUENTE, TipoEnvio.EXPRESS)
    )
    # Solo el 10% por monto, no 10% + 5%.
    assert grande.descuento == Decimal("374.95")
    assert grande.total == Decimal("4034.48")


def test_cantidad_cero_o_negativa_lanza_excepcion():
    for cantidad in (0, -3):
        pedido = crear_pedido([("100.00", 1), ("50.00", cantidad)])

        with pytest.raises(PedidoInvalidoError, match="cantidad inválida"):
            ValidadorPedido.validar(pedido)
        with pytest.raises(PedidoInvalidoError):
            CalculadoraPedido.desglose(pedido)


def test_pedido_sin_productos_lanza_excepcion():
    pedido = crear_pedido([])

    with pytest.raises(PedidoInvalidoError, match="no tiene productos"):
        ValidadorPedido.validar(pedido)
    with pytest.raises(PedidoInvalidoError):
        CalculadoraPedido.desglose(pedido)


def test_consultas_funcionales_sobre_el_json_de_prueba():
    pedidos = leer_pedidos(RUTA_JSON)

    assert len(pedidos) == 5
    assert ids(buscar_por_cliente(pedidos, "C001")) == ["PED-001", "PED-004"]
    assert ids(buscar_por_cliente(pedidos, "sofía")) == ["PED-003"]
    assert ids(filtrar_por_estado(pedidos, EstadoPedido.PENDIENTE)) == [
        "PED-001",
        "PED-002",
        "PED-005",
    ]
    assert ids(ordenar_por_fecha(pedidos)) == [
        "PED-002",
        "PED-004",
        "PED-001",
        "PED-005",
        "PED-003",
    ]
    assert ids(ordenar_por_prioridad(pedidos)) == [
        "PED-002",
        "PED-003",
        "PED-001",
        "PED-005",
        "PED-004",
    ]
    # Las consultas no modifican la lista original.
    assert ids(pedidos) == ["PED-001", "PED-002", "PED-003", "PED-004", "PED-005"]
