"""Estado de los pedidos que muestra la interfaz gráfica.

Responsable: Leonardo (Dashboard).

El almacén es el «modelo vivo» del MVC: arranca con los pedidos del JSON de
solicitudes y recibe los que se capturan en el formulario. No calcula nada por
su cuenta: valida y calcula con CalculadoraPedido y lee con leer_pedidos, que
son las mismas piezas que usa main.py.
"""
from __future__ import annotations

from pathlib import Path

from lector_json import leer_pedidos
from modelos import Pedido
from negocio import CalculadoraPedido, Desglose, PedidoInvalidoError


class AlmacenPedidos:
    def __init__(self, ruta_solicitudes: str | Path) -> None:
        self._ruta = Path(ruta_solicitudes)
        self._pedidos: list[Pedido] = []
        self._desgloses: dict[str, Desglose] = {}
        self._rechazos: list[str] = []
        self._ids_rechazados: list[str] = []

    def cargar(self) -> list[str]:
        """Reemplaza el contenido por los pedidos del JSON y devuelve los motivos de rechazo.

        Si el archivo no se puede leer lanza FileNotFoundError, ValueError o KeyError
        y el estado anterior queda intacto.
        """
        leidos = leer_pedidos(self._ruta)
        self._pedidos, self._desgloses = [], {}
        self._rechazos, self._ids_rechazados = [], []
        for pedido in leidos:
            try:
                self.registrar(pedido)
            except PedidoInvalidoError as error:
                self._rechazos.append(str(error))
                self._ids_rechazados.append(pedido.id)
        return list(self._rechazos)

    def registrar(self, pedido: Pedido) -> Desglose:
        """Valida el pedido, calcula sus importes y lo guarda. Lanza PedidoInvalidoError si no cumple."""
        if pedido.id in self._desgloses:
            raise PedidoInvalidoError(f"Ya existe un pedido con el id {pedido.id}.")
        desglose = CalculadoraPedido.desglose(pedido)
        self._pedidos.append(pedido)
        self._desgloses[pedido.id] = desglose
        return desglose

    @property
    def pedidos(self) -> list[Pedido]:
        """Copia de la lista: quien la recibe puede ordenarla o recorrerla sin afectar al almacén."""
        return list(self._pedidos)

    @property
    def rechazos(self) -> list[str]:
        return list(self._rechazos)

    def desglose(self, pedido_id: str) -> Desglose:
        return self._desgloses[pedido_id]

    def desgloses(self) -> list[Desglose]:
        return [self._desgloses[p.id] for p in self._pedidos]

    def siguiente_id(self) -> str:
        """PED-006 si el mayor numerado es PED-005. Cuenta también los rechazados, para no reciclar su id."""
        usados = [p.id for p in self._pedidos] + self._ids_rechazados
        numeros = [
            int(id_.split("-", 1)[1])
            for id_ in usados
            if id_.startswith("PED-") and id_.split("-", 1)[1].isdigit()
        ]
        return f"PED-{max(numeros, default=0) + 1:03d}"
