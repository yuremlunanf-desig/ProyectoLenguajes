"""Controlador del formulario de captura: carrito y registro de pedidos nuevos.

Responsable: Edsson (Formularios).

Las reglas de negocio no se repiten aquí. Una cantidad <= 0 o un carrito vacío los
rechaza ValidadorPedido (vía CalculadoraPedido) con PedidoInvalidoError; este
controlador solo agrega los errores propios del formulario (campos vacíos, texto
que no es un número) con ErrorFormulario.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from almacen import AlmacenPedidos
from catalogo import ItemCatalogo
from gui import etiquetas
from modelos import Cliente, EstadoPedido, Pedido, Prioridad, TipoCliente, TipoEnvio
from negocio import CalculadoraPedido, Desglose, ValidadorPedido


class ErrorFormulario(ValueError):
    """Un dato del formulario falta o no tiene el formato esperado. El mensaje se muestra tal cual."""


@dataclass(frozen=True)
class LineaCarrito:
    item: ItemCatalogo
    cantidad: int

    @property
    def importe(self) -> Decimal:
        return self.item.precio * self.cantidad


class ControladorFormulario:
    def __init__(self, almacen: AlmacenPedidos, catalogo: list[ItemCatalogo]) -> None:
        self._almacen = almacen
        self._catalogo = {item.etiqueta: item for item in catalogo}
        self._carrito: list[LineaCarrito] = []

    # --- datos para los selectores -------------------------------------------------------

    @property
    def opciones_producto(self) -> list[str]:
        return list(self._catalogo)

    @property
    def carrito(self) -> tuple[LineaCarrito, ...]:
        return tuple(self._carrito)

    # --- carrito -------------------------------------------------------------------------

    def agregar_al_carrito(self, etiqueta_producto: str, cantidad_texto: str) -> LineaCarrito:
        item = self._catalogo.get(etiqueta_producto)
        if item is None:
            raise ErrorFormulario("Elige un producto de la lista.")
        cantidad = self._leer_cantidad(cantidad_texto)
        # Si el producto ya estaba en el carrito, se suma a su línea.
        anterior = next((l for l in self._carrito if l.item.sku == item.sku), None)
        nueva = LineaCarrito(item, cantidad + (anterior.cantidad if anterior else 0))
        self._validar_linea(nueva)
        if anterior is None:
            self._carrito.append(nueva)
        else:
            self._carrito[self._carrito.index(anterior)] = nueva
        return nueva

    def quitar_del_carrito(self, indice: int) -> None:
        if not 0 <= indice < len(self._carrito):
            raise ErrorFormulario("Selecciona la línea del carrito que quieres quitar.")
        del self._carrito[indice]

    def vaciar_carrito(self) -> None:
        self._carrito.clear()

    def vista_previa(self, tipo_cliente: str, envio: str) -> Desglose | None:
        """Importes del carrito actual (None si está vacío), con las mismas reglas que el pedido final."""
        if not self._carrito:
            return None
        pedido = self._armar_pedido(
            "NUEVO", "", "", etiquetas.invertir(etiquetas.TIPOS_CLIENTE)[tipo_cliente],
            etiquetas.invertir(etiquetas.ENVIOS)[envio], Prioridad.MEDIA,
        )
        return CalculadoraPedido.desglose(pedido)

    # --- registro ------------------------------------------------------------------------

    def registrar(
        self, cliente_id: str, cliente_nombre: str, tipo_cliente: str, envio: str, prioridad: str
    ) -> Pedido:
        """Crea el pedido con lo capturado, lo registra y vacía el carrito.

        Lanza ErrorFormulario si falta algún dato y PedidoInvalidoError si el negocio lo rechaza.
        """
        cliente_id, cliente_nombre = cliente_id.strip(), cliente_nombre.strip()
        if not cliente_id:
            raise ErrorFormulario("Escribe el id del cliente (por ejemplo C005).")
        if not cliente_nombre:
            raise ErrorFormulario("Escribe el nombre del cliente.")
        pedido = self._armar_pedido(
            self._almacen.siguiente_id(),
            cliente_id,
            cliente_nombre,
            etiquetas.invertir(etiquetas.TIPOS_CLIENTE)[tipo_cliente],
            etiquetas.invertir(etiquetas.ENVIOS)[envio],
            etiquetas.invertir(etiquetas.PRIORIDADES)[prioridad],
        )
        self._almacen.registrar(pedido)  # PedidoInvalidoError si, por ejemplo, el carrito está vacío
        self._carrito.clear()
        return pedido

    # --- internos ------------------------------------------------------------------------

    @staticmethod
    def _leer_cantidad(texto: str) -> int:
        try:
            return int(texto.strip())
        except ValueError:
            raise ErrorFormulario(
                f"La cantidad «{texto.strip()}» no es un número entero. Escribe, por ejemplo, 2."
            ) from None

    @staticmethod
    def _validar_linea(linea: LineaCarrito) -> None:
        """Pasa la línea por ValidadorPedido para no duplicar la regla de cantidad > 0."""
        ValidadorPedido.validar(
            Pedido(
                id="NUEVO",
                cliente=Cliente("", ""),
                fecha=datetime.now(),
                productos=[linea.item.a_producto(linea.cantidad)],
            )
        )

    def _armar_pedido(
        self,
        pedido_id: str,
        cliente_id: str,
        cliente_nombre: str,
        tipo: TipoCliente,
        envio: TipoEnvio,
        prioridad: Prioridad,
    ) -> Pedido:
        return Pedido(
            id=pedido_id,
            cliente=Cliente(cliente_id, cliente_nombre, tipo),
            fecha=datetime.now().replace(microsecond=0),
            productos=[l.item.a_producto(l.cantidad) for l in self._carrito],
            envio=envio,
            prioridad=prioridad,
            estado=EstadoPedido.PENDIENTE,
        )
