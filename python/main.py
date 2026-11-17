"""Punto de entrada: registra pedidos, consulta, cambia estados y exporta métricas.

Responsable: Edsson (Concurrencia y Main).

Uso (desde la carpeta python/):
    python main.py [ruta_del_json]

Genera python/resultados_metricas.json con los tiempos y totales de la corrida.
"""
from __future__ import annotations

import asyncio
import json
import platform
import sys
import time
from datetime import datetime
from pathlib import Path

from concurrencia import RETARDO_TRANSICION_MS, procesar_concurrente, procesar_secuencial
from funcional import (
    buscar_por_cliente,
    contar_por_estado,
    filtrar_por_estado,
    ids,
    ordenar_por_fecha,
    ordenar_por_prioridad,
    sumar_importes,
)
from lector_json import leer_pedidos
from modelos import EstadoPedido, Pedido
from negocio import CalculadoraPedido, Desglose, PedidoInvalidoError

CARPETA = Path(__file__).resolve().parent
ENTRADA_POR_DEFECTO = CARPETA.parent / "datos" / "solicitudes_pequenas.json"
SALIDA = CARPETA / "resultados_metricas.json"
CLIENTE_DE_EJEMPLO = "C001"


def ms_desde(inicio: float) -> float:
    return round((time.perf_counter() - inicio) * 1000, 3)


def registrar(
    pedidos: list[Pedido],
) -> tuple[list[Pedido], dict[str, Desglose], list[dict[str, str]]]:
    """Valida y calcula cada pedido. Devuelve (registrados, desgloses, rechazos)."""
    registrados: list[Pedido] = []
    desgloses: dict[str, Desglose] = {}
    rechazos: list[dict[str, str]] = []
    for pedido in pedidos:
        try:
            desgloses[pedido.id] = CalculadoraPedido.desglose(pedido)
            registrados.append(pedido)
        except PedidoInvalidoError as error:
            rechazos.append({"id": pedido.id, "motivo": str(error)})
    return registrados, desgloses, rechazos


async def ejecutar(ruta_entrada: Path) -> dict:
    """Corre el flujo completo y devuelve las métricas de la corrida."""
    inicio_total = time.perf_counter()

    inicio = time.perf_counter()
    leidos = leer_pedidos(ruta_entrada)
    ms_lectura = ms_desde(inicio)

    inicio = time.perf_counter()
    registrados, desgloses, rechazos = registrar(leidos)
    ms_registro = ms_desde(inicio)

    inicio = time.perf_counter()
    consultas = {
        "cliente": CLIENTE_DE_EJEMPLO,
        "pedidos_del_cliente": ids(buscar_por_cliente(registrados, CLIENTE_DE_EJEMPLO)),
        "pendientes": ids(filtrar_por_estado(registrados, EstadoPedido.PENDIENTE)),
        "orden_por_fecha": ids(ordenar_por_fecha(registrados)),
        "orden_por_prioridad": ids(ordenar_por_prioridad(registrados)),
    }
    ms_consultas = ms_desde(inicio)

    estados_iniciales = {p.id: p.estado for p in registrados}
    conteo_inicial = contar_por_estado(registrados)

    # Línea base: los mismos cambios de estado, un pedido tras otro.
    inicio = time.perf_counter()
    await procesar_secuencial(registrados)
    ms_secuencial = ms_desde(inicio)

    # Se restauran los estados para repetir la simulación de forma concurrente.
    for pedido in registrados:
        pedido.cambiar_estado(estados_iniciales[pedido.id])

    inicio = time.perf_counter()
    resultados = await procesar_concurrente(registrados)
    ms_concurrente = ms_desde(inicio)

    importes = list(desgloses.values())
    return {
        "lenguaje": "Python",
        "runtime": f"Python {platform.python_version()}",
        "modelo_concurrencia": "asyncio (corrutinas con asyncio.gather)",
        "fecha_ejecucion": datetime.now().isoformat(timespec="seconds"),
        "archivo_entrada": ruta_entrada.name,
        "pedidos": {
            "leidos": len(leidos),
            "registrados": len(registrados),
            "rechazados": len(rechazos),
        },
        "rechazos": rechazos,
        "retardo_por_transicion_ms": RETARDO_TRANSICION_MS,
        "tiempos_ms": {
            "lectura_json": ms_lectura,
            "validacion_y_calculo": ms_registro,
            "consultas_funcionales": ms_consultas,
            "cambio_estados_secuencial": ms_secuencial,
            "cambio_estados_concurrente": ms_concurrente,
            "total": ms_desde(inicio_total),
        },
        "aceleracion_concurrencia": (
            round(ms_secuencial / ms_concurrente, 2) if ms_concurrente else None
        ),
        "ventas": {
            "subtotal": str(sumar_importes(importes, lambda d: d.subtotal)),
            "descuentos": str(sumar_importes(importes, lambda d: d.descuento)),
            "iva": str(sumar_importes(importes, lambda d: d.iva)),
            "envio": str(sumar_importes(importes, lambda d: d.envio)),
            "total": str(sumar_importes(importes, lambda d: d.total)),
        },
        "consultas": consultas,
        "estados_iniciales": conteo_inicial,
        "estados_finales": contar_por_estado(registrados),
        "detalle_pedidos": [
            {
                "id": pedido.id,
                "cliente": pedido.cliente.nombre,
                "prioridad": pedido.prioridad.name,
                "tipo_envio": pedido.envio.name,
                "subtotal": str(desgloses[pedido.id].subtotal),
                "descuento": str(desgloses[pedido.id].descuento),
                "iva": str(desgloses[pedido.id].iva),
                "envio": str(desgloses[pedido.id].envio),
                "total": str(desgloses[pedido.id].total),
                "estado_inicial": resultado.estado_inicial.name,
                "estado_final": resultado.estado_final.name,
                "transiciones": list(resultado.transiciones),
                "duracion_ms": round(resultado.duracion_ms, 3),
            }
            for pedido, resultado in zip(registrados, resultados)
        ],
    }


def imprimir_reporte(metricas: dict) -> None:
    pedidos = metricas["pedidos"]
    tiempos = metricas["tiempos_ms"]
    consultas = metricas["consultas"]

    print(f"=== Automatización de pedidos ({metricas['runtime']}) ===")
    print(
        f"Pedidos leídos: {pedidos['leidos']} | registrados: {pedidos['registrados']} "
        f"| rechazados: {pedidos['rechazados']}"
    )
    for rechazo in metricas["rechazos"]:
        print(f"  [RECHAZADO] {rechazo['motivo']}")

    print()
    print(
        f"{'ID':<9}{'Cliente':<18}{'Subtotal':>10}{'Descuento':>11}{'IVA':>10}"
        f"{'Envío':>9}{'Total':>11}  Estado"
    )
    for fila in metricas["detalle_pedidos"]:
        print(
            f"{fila['id']:<9}{fila['cliente']:<18}{fila['subtotal']:>10}{fila['descuento']:>11}"
            f"{fila['iva']:>10}{fila['envio']:>9}{fila['total']:>11}"
            f"  {fila['estado_inicial']} -> {fila['estado_final']}"
        )
    print(f"Total vendido: ${metricas['ventas']['total']}")

    print()
    print("Consultas (estilo funcional):")
    print(f"  Pedidos del cliente {consultas['cliente']}: {', '.join(consultas['pedidos_del_cliente'])}")
    print(f"  Pendientes:          {', '.join(consultas['pendientes'])}")
    print(f"  Orden por fecha:     {', '.join(consultas['orden_por_fecha'])}")
    print(f"  Orden por prioridad: {', '.join(consultas['orden_por_prioridad'])}")

    print()
    print(f"Cambio de estados ({metricas['retardo_por_transicion_ms']} ms por transición):")
    print(f"  Secuencial:  {tiempos['cambio_estados_secuencial']} ms")
    print(
        f"  Concurrente: {tiempos['cambio_estados_concurrente']} ms "
        f"(aceleración x{metricas['aceleracion_concurrencia']})"
    )
    print(f"Tiempo total: {tiempos['total']} ms")
    print(f"Métricas exportadas en: {SALIDA}")


def main() -> None:
    ruta_entrada = Path(sys.argv[1]) if len(sys.argv) > 1 else ENTRADA_POR_DEFECTO
    metricas = asyncio.run(ejecutar(ruta_entrada))
    SALIDA.write_text(
        json.dumps(metricas, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    imprimir_reporte(metricas)


if __name__ == "__main__":
    main()
