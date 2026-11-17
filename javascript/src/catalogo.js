'use strict';

/**
 * Catálogo de productos que se ofrece en el formulario de pedidos.
 *
 * Responsable: Edsson (Formularios).
 *
 * Lee datos/catalogo.json. Un ItemCatalogo es un producto sin cantidad; al agregarlo al
 * carrito se convierte en un Producto del dominio con la cantidad elegida, así modelos.js
 * no cambia.
 */

const fs = require('node:fs/promises');
const { Producto } = require('./modelos');
const { aCentavos } = require('./lectorJson');
const { dinero } = require('./formato');

/** catalogo.json no existe o tiene un formato inválido. */
class CatalogoError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'CatalogoError';
  }
}

class ItemCatalogo {
  constructor({ sku, nombre, precioCentavos }) {
    this.sku = sku;
    this.nombre = nombre;
    this.precioCentavos = precioCentavos;
    Object.freeze(this);
  }

  /** Texto para el selector: «TEC-101 · Teclado mecánico ($899.50)». */
  get etiqueta() {
    return `${this.sku} · ${this.nombre} (${dinero(this.precioCentavos)})`;
  }

  aProducto(cantidad) {
    return new Producto({
      sku: this.sku,
      nombre: this.nombre,
      precioCentavos: this.precioCentavos,
      cantidad,
    });
  }
}

/** Lee el catálogo. Lanza CatalogoError (con mensaje legible) si no se puede. */
async function leerCatalogo(ruta) {
  let datos;
  try {
    datos = JSON.parse(await fs.readFile(ruta, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new CatalogoError(`No se encontró el catálogo de productos: ${ruta}`);
    }
    throw new CatalogoError(`El catálogo ${ruta} tiene un formato inválido (${error.message}).`);
  }
  if (!datos || !Array.isArray(datos.productos)) {
    throw new CatalogoError(`El catálogo ${ruta} tiene un formato inválido (falta la lista «productos»).`);
  }
  const items = [];
  for (const p of datos.productos) {
    try {
      if (typeof p.sku !== 'string' || typeof p.nombre !== 'string') {
        throw new TypeError('cada producto necesita «sku» y «nombre»');
      }
      items.push(new ItemCatalogo({ sku: p.sku, nombre: p.nombre, precioCentavos: aCentavos(p.precio) }));
    } catch (error) {
      throw new CatalogoError(`El catálogo ${ruta} tiene un formato inválido (${error.message}).`);
    }
  }
  return items;
}

module.exports = { CatalogoError, ItemCatalogo, leerCatalogo };
