'use strict';

/**
 * Lectura y parseo del JSON de solicitudes a objetos del dominio.
 *
 * Responsable: Ian (Modelos y Datos).
 *
 * El lector no valida reglas de negocio: entrega los pedidos tal como vienen
 * en el archivo y deja la validación a negocio.js.
 */

const fs = require('node:fs/promises');
const {
  Cliente,
  EstadoPedido,
  Pedido,
  Prioridad,
  Producto,
  TipoCliente,
  TipoEnvio,
} = require('./modelos');

/** Lee el archivo JSON (de forma asíncrona) y devuelve la lista de pedidos. */
async function leerPedidos(ruta) {
  const texto = await fs.readFile(ruta, 'utf8');
  const datos = JSON.parse(texto);
  return (datos.pedidos ?? []).map(aPedido);
}

/** Convierte un precio en pesos (1299.90) a centavos enteros (129990). */
function aCentavos(pesos) {
  const numero = Number(pesos);
  if (!Number.isFinite(numero)) {
    throw new TypeError(`Precio no numérico: ${pesos}`);
  }
  return Math.round(numero * 100);
}

function aPedido(d) {
  return new Pedido({
    id: d.id,
    cliente: aCliente(d.cliente),
    fecha: new Date(d.fecha),
    productos: (d.productos ?? []).map(aProducto),
    envio: opcion(TipoEnvio, d.envio ?? 'ESTANDAR', 'envio'),
    prioridad: opcion(Prioridad, d.prioridad ?? 'MEDIA', 'prioridad'),
    estado: opcion(EstadoPedido, d.estado ?? 'PENDIENTE', 'estado'),
  });
}

function aCliente(d) {
  return new Cliente({
    id: d.id,
    nombre: d.nombre,
    tipo: opcion(TipoCliente, d.tipo ?? 'REGULAR', 'tipo de cliente'),
  });
}

function aProducto(d) {
  return new Producto({
    sku: d.sku,
    nombre: d.nombre,
    precioCentavos: aCentavos(d.precio),
    cantidad: d.cantidad,
  });
}

/** Devuelve el valor del catálogo o falla si el JSON trae uno desconocido. */
function opcion(catalogo, valor, campo) {
  const clave = String(valor).toUpperCase();
  if (!Object.hasOwn(catalogo, clave)) {
    throw new TypeError(`Valor desconocido para ${campo}: ${valor}`);
  }
  return catalogo[clave];
}

module.exports = { leerPedidos, aCentavos };
