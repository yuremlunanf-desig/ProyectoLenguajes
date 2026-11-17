'use strict';

/**
 * Formato de importes para mostrar al usuario.
 *
 * Responsable: Ian (Login): infraestructura compartida de la interfaz web.
 */

const { formatearCentavos } = require('./negocio');

/** Importe en centavos como dinero para mostrar: 229345 -> "$2,293.45". */
function dinero(centavos) {
  const [pesos, resto] = formatearCentavos(centavos).split('.');
  return `$${pesos.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${resto}`;
}

module.exports = { dinero };
