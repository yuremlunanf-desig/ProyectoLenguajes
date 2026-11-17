'use strict';

/**
 * Consultas sobre colecciones de pedidos en estilo funcional.
 *
 * Responsable: Yurem (Funcional y Testing).
 *
 * Son funciones puras construidas con filter, map, sort, reduce y funciones
 * flecha: no modifican el arreglo que reciben, siempre devuelven uno nuevo.
 */

const { NIVEL_PRIORIDAD } = require('./modelos');
const { CalculadoraPedido } = require('./negocio');

/** Pedidos cuyo cliente coincide por id exacto o por parte del nombre. */
const buscarPorCliente = (pedidos, criterio) => {
  const texto = String(criterio ?? '').trim().toLowerCase();
  if (texto === '') {
    return [];
  }
  return pedidos.filter(
    (p) => p.cliente.id.toLowerCase() === texto || p.cliente.nombre.toLowerCase().includes(texto)
  );
};

const filtrarPorEstado = (pedidos, estado) => pedidos.filter((p) => p.estado === estado);

const ordenarPorFecha = (pedidos, descendente = false) =>
  [...pedidos].sort((a, b) => (descendente ? b.fecha - a.fecha : a.fecha - b.fecha));

/** Primero la prioridad más alta; a igual prioridad, el pedido más antiguo. */
const ordenarPorPrioridad = (pedidos) =>
  [...pedidos].sort(
    (a, b) => NIVEL_PRIORIDAD[a.prioridad] - NIVEL_PRIORIDAD[b.prioridad] || a.fecha - b.fecha
  );

const ids = (pedidos) => pedidos.map((p) => p.id);

const contarPorEstado = (pedidos) =>
  pedidos.reduce((conteo, p) => ({ ...conteo, [p.estado]: (conteo[p.estado] ?? 0) + 1 }), {});

/** Suma un importe de cada desglose, por ejemplo: (d) => d.iva. */
const sumarImportes = (desgloses, selector) =>
  desgloses.reduce((acumulado, d) => acumulado + selector(d), 0);

const totalVendido = (pedidos) =>
  sumarImportes(
    pedidos.map((p) => CalculadoraPedido.desglose(p)),
    (d) => d.total
  );

module.exports = {
  buscarPorCliente,
  filtrarPorEstado,
  ordenarPorFecha,
  ordenarPorPrioridad,
  ids,
  contarPorEstado,
  sumarImportes,
  totalVendido,
};
