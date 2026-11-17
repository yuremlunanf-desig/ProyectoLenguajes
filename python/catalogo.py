"""Catálogo de productos que se ofrece en el formulario de pedidos.

Responsable: Edsson (Formularios).

Lee datos/catalogo.json. Un ItemCatalogo es un producto sin cantidad; al
agregarlo al carrito se convierte en un Producto del dominio con la cantidad
elegida, así modelos.py no cambia.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path

from modelos import Producto


class CatalogoError(Exception):
    """catalogo.json no existe o tiene un formato inválido."""


@dataclass(frozen=True)
class ItemCatalogo:
    sku: str
    nombre: str
    precio: Decimal

    @property
    def etiqueta(self) -> str:
        """Texto para el selector: «TEC-101 · Teclado mecánico ($899.50)»."""
        return f"{self.sku} · {self.nombre} (${self.precio:,.2f})"

    def a_producto(self, cantidad: int) -> Producto:
        return Producto(sku=self.sku, nombre=self.nombre, precio=self.precio, cantidad=cantidad)


def leer_catalogo(ruta: str | Path) -> list[ItemCatalogo]:
    try:
        with open(ruta, encoding="utf-8") as archivo:
            # parse_float=Decimal: el precio se lee del texto sin pasar por float.
            datos = json.load(archivo, parse_float=Decimal)
        return [
            ItemCatalogo(sku=p["sku"], nombre=p["nombre"], precio=Decimal(str(p["precio"])))
            for p in datos["productos"]
        ]
    except FileNotFoundError as error:
        raise CatalogoError(f"No se encontró el catálogo de productos: {ruta}") from error
    except (OSError, ValueError, KeyError, TypeError, ArithmeticError) as error:
        raise CatalogoError(f"El catálogo {ruta} tiene un formato inválido ({error}).") from error
