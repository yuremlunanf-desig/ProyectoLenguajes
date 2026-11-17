'use strict';

/**
 * Cambio de estado de los pedidos de forma asíncrona con promesas.
 *
 * Responsable: Edsson (Concurrencia y Main).
 *
 * Cada pedido avanza por el flujo PENDIENTE -> EN_PROCESO -> ENVIADO -> ENTREGADO.
 * Cada transición tarda un tiempo simulado (almacén, paquetería). En modo
 * concurrente las esperas de todos los pedidos se traslapan con Promise.all;
 * en modo secuencial se atiende un pedido tras otro y sirve como línea base.
 */

const { performance } = require('node:perf_hooks');
const { EstadoPedido } = require('./modelos');

const FLUJO_ESTADOS = Object.freeze([
  EstadoPedido.PENDIENTE,
  EstadoPedido.EN_PROCESO,
  EstadoPedido.ENVIADO,
  EstadoPedido.ENTREGADO,
]);
const RETARDO_TRANSICION_MS = 100;

function errorDeCancelacion() {
  const error = new Error('Se canceló el cambio de estado.');
  error.name = 'AbortError';
  return error;
}

/** Espera ms milisegundos. Si se pasa una señal (AbortSignal) y se cancela, la promesa rechaza con un AbortError. */
function esperar(ms, senal) {
  return new Promise((resolver, rechazar) => {
    if (senal && senal.aborted) {
      rechazar(errorDeCancelacion());
      return;
    }

    function alCancelar() {
      clearTimeout(temporizador);
      rechazar(errorDeCancelacion());
    }
    const temporizador = setTimeout(() => {
      if (senal) {
        senal.removeEventListener('abort', alCancelar);
      }
      resolver();
    }, ms);
    if (senal) {
      senal.addEventListener('abort', alCancelar);
    }
  });
}

/** Estados que le faltan recorrer a un pedido (vacío si ya terminó o se canceló). */
function estadosPendientes(estado) {
  const posicion = FLUJO_ESTADOS.indexOf(estado);
  return posicion === -1 ? [] : FLUJO_ESTADOS.slice(posicion + 1);
}

/**
 * Lleva un pedido hasta ENTREGADO, esperando retardoMs en cada transición.
 *
 * opciones (todas opcionales; sin ellas la función se comporta igual que antes):
 * - alCambiarEstado(pedido, estadoAnterior, estadoNuevo): se invoca justo después de cada
 *   transición. El despachador de la interfaz lo usa para anotar lo que va pasando.
 * - senal: un AbortSignal para cancelar la espera; la promesa rechaza con un AbortError.
 */
async function avanzarPedido(pedido, retardoMs = RETARDO_TRANSICION_MS, opciones = {}) {
  const inicio = performance.now();
  const estadoInicial = pedido.estado;
  const transiciones = [];
  for (const siguiente of estadosPendientes(estadoInicial)) {
    await esperar(retardoMs, opciones.senal);
    const anterior = pedido.estado;
    transiciones.push(`${anterior}->${siguiente}`);
    pedido.cambiarEstado(siguiente);
    if (opciones.alCambiarEstado) {
      opciones.alCambiarEstado(pedido, anterior, siguiente);
    }
  }
  return {
    pedidoId: pedido.id,
    estadoInicial,
    estadoFinal: pedido.estado,
    transiciones,
    duracionMs: performance.now() - inicio,
  };
}

/** Avanza todos los pedidos a la vez. Los resultados salen en el orden de entrada. */
const procesarConcurrente = (pedidos, retardoMs = RETARDO_TRANSICION_MS) =>
  Promise.all(pedidos.map((pedido) => avanzarPedido(pedido, retardoMs)));

/** Avanza los pedidos uno por uno (línea base para medir la aceleración). */
async function procesarSecuencial(pedidos, retardoMs = RETARDO_TRANSICION_MS) {
  const resultados = [];
  for (const pedido of pedidos) {
    resultados.push(await avanzarPedido(pedido, retardoMs));
  }
  return resultados;
}

module.exports = {
  FLUJO_ESTADOS,
  RETARDO_TRANSICION_MS,
  estadosPendientes,
  avanzarPedido,
  procesarConcurrente,
  procesarSecuencial,
};
