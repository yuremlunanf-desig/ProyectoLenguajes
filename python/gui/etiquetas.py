"""Textos que se muestran al usuario para cada valor de los enumerados del dominio."""
from __future__ import annotations

from modelos import EstadoPedido, Prioridad, TipoCliente, TipoEnvio
from negocio import COSTO_ENVIO

ESTADOS = {
    EstadoPedido.PENDIENTE: "Pendiente",
    EstadoPedido.EN_PROCESO: "En proceso",
    EstadoPedido.ENVIADO: "Enviado",
    EstadoPedido.ENTREGADO: "Entregado",
    EstadoPedido.CANCELADO: "Cancelado",
}
PRIORIDADES = {Prioridad.ALTA: "Alta", Prioridad.MEDIA: "Media", Prioridad.BAJA: "Baja"}
TIPOS_CLIENTE = {TipoCliente.REGULAR: "Regular", TipoCliente.FRECUENTE: "Frecuente"}
ENVIOS = {TipoEnvio.ESTANDAR: "Estándar", TipoEnvio.EXPRESS: "Express"}
# El costo sale de negocio.COSTO_ENVIO para que no se duplique la regla.
ENVIOS_CON_COSTO = {
    envio: f"{nombre} (${COSTO_ENVIO[envio]:,.0f})" for envio, nombre in ENVIOS.items()
}


def invertir(etiquetas: dict) -> dict:
    """De «texto que ve el usuario» al valor del enumerado."""
    return {texto: valor for valor, texto in etiquetas.items()}


def dinero(importe) -> str:
    return f"${importe:,.2f}"
