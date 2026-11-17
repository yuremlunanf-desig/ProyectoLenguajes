"""Prueba del formulario de pedidos (carrito y registro).

Responsable: Edsson (Formularios).

Ejecutar desde la carpeta python/:  python -m pytest -v
"""
from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pytest

from almacen import AlmacenPedidos
from catalogo import leer_catalogo
from gui.controlador_formulario import ControladorFormulario, ErrorFormulario
from negocio import PedidoInvalidoError

DATOS = Path(__file__).resolve().parent.parent / "datos"
TECLADO = "TEC-101 · Teclado mecánico ($899.50)"


def test_formulario_valida_la_captura_y_registra_un_pedido_nuevo():
    almacen = AlmacenPedidos(DATOS / "solicitudes_pequenas.json")
    almacen.cargar()
    formulario = ControladorFormulario(almacen, leer_catalogo(DATOS / "catalogo.json"))
    assert len(almacen.pedidos) == 4  # el quinto pedido del archivo se rechaza (cantidad 0)

    with pytest.raises(ErrorFormulario):  # una cantidad que no es número
        formulario.agregar_al_carrito(TECLADO, "abc")
    with pytest.raises(PedidoInvalidoError):  # cantidad 0: la rechaza la regla de negocio
        formulario.agregar_al_carrito(TECLADO, "0")

    formulario.agregar_al_carrito(TECLADO, "1")
    formulario.agregar_al_carrito(TECLADO, "1")  # el mismo producto se suma: 2 teclados
    pedido = formulario.registrar("C005", "Marta Ruiz", "Regular", "Estándar", "Media")

    # 2 × 899.50 = 1,799.00 (sin descuento) + IVA 287.84 + envío estándar 50.00
    assert pedido.id == "PED-006"
    assert almacen.desglose("PED-006").total == Decimal("2136.84")
    assert len(almacen.pedidos) == 5
