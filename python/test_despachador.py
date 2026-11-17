"""Prueba de la concurrencia: el despachador atiende la cola con varios trabajadores.

Responsable: Yurem (Concurrencia en la interfaz).

Ejecutar desde la carpeta python/:  python -m pytest -v
"""
from __future__ import annotations

from pathlib import Path

from almacen import AlmacenPedidos
from despachador import Despachador, TipoEvento
from modelos import EstadoPedido

RUTA_JSON = Path(__file__).resolve().parent.parent / "datos" / "solicitudes_pequenas.json"


def test_despachador_lleva_todos_los_pedidos_a_entregado_empezando_por_la_prioridad_alta():
    almacen = AlmacenPedidos(RUTA_JSON)
    almacen.cargar()
    despachador = Despachador()

    despachador.iniciar(almacen.pedidos, retardo_ms=20, trabajadores=2)
    despachador.esperar(timeout=10)
    eventos = despachador.eventos_pendientes()

    for pedido in almacen.pedidos:
        assert pedido.estado is EstadoPedido.ENTREGADO
    iniciados = [e.pedido_id for e in eventos if e.tipo is TipoEvento.PEDIDO_INICIADO]
    assert iniciados[0] == "PED-002"  # el único con prioridad alta y estado pendiente
    assert eventos[-1].tipo is TipoEvento.CORRIDA_TERMINADA
    assert not despachador.en_ejecucion
