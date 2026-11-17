'use strict';

/**
 * Textos que se muestran al usuario para cada valor de los enumerados del dominio.
 *
 * Responsable: Ian (Login): infraestructura compartida de la GUI.
 */

const { EstadoPedido, Prioridad, TipoCliente, TipoEnvio } = require('../modelos');
const { COSTO_ENVIO_CENTAVOS } = require('../negocio');
const { FLUJO_ESTADOS } = require('../concurrencia');
const { dinero } = require('../formato');

const ESTADOS = Object.freeze({
  [EstadoPedido.PENDIENTE]: 'Pendiente',
  [EstadoPedido.EN_PROCESO]: 'En proceso',
  [EstadoPedido.ENVIADO]: 'Enviado',
  [EstadoPedido.ENTREGADO]: 'Entregado',
  [EstadoPedido.CANCELADO]: 'Cancelado',
});
const PRIORIDADES = Object.freeze({
  [Prioridad.ALTA]: 'Alta',
  [Prioridad.MEDIA]: 'Media',
  [Prioridad.BAJA]: 'Baja',
});
const TIPOS_CLIENTE = Object.freeze({
  [TipoCliente.REGULAR]: 'Regular',
  [TipoCliente.FRECUENTE]: 'Frecuente',
});
const ENVIOS = Object.freeze({
  [TipoEnvio.ESTANDAR]: 'Estándar',
  [TipoEnvio.EXPRESS]: 'Express',
});

/** «Estándar ($50)». El costo sale de negocio.js para no duplicar la regla. */
const envioConCosto = (envio) =>
  `${ENVIOS[envio]} (${dinero(COSTO_ENVIO_CENTAVOS[envio]).replace(/\.00$/, '')})`;

/** De un objeto { CLAVE: 'Texto' } a una lista [{ valor, etiqueta }] para los selectores. */
const comoOpciones = (etiquetas) =>
  Object.entries(etiquetas).map(([valor, etiqueta]) => ({ valor, etiqueta }));

/** Todo lo que la interfaz necesita para armar sus selectores y barras de progreso. */
const opciones = () => ({
  tiposCliente: comoOpciones(TIPOS_CLIENTE),
  prioridades: comoOpciones(PRIORIDADES),
  envios: Object.values(TipoEnvio).map((valor) => ({ valor, etiqueta: envioConCosto(valor) })),
  estados: comoOpciones(ESTADOS),
  flujoEstados: [...FLUJO_ESTADOS],
});

module.exports = {
  ESTADOS,
  PRIORIDADES,
  TIPOS_CLIENTE,
  ENVIOS,
  dinero,
  envioConCosto,
  opciones,
};
