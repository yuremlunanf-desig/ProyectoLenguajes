'use strict';

/**
 * Despachador de la cola de pedidos: procesa en segundo plano y guarda lo que va pasando.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 *
 * El despachador no avisa al navegador: va anotando su estado (la cola, los eventos) y el navegador lo
 * consulta cada 500 ms con GET /api/despachador. Así la tabla se actualiza sola, sin conexiones abiertas.
 *
 * El avance de cada pedido es el de concurrencia.avanzarPedido. Aquí solo se agrega lo que la interfaz
 * necesita: orden por prioridad, un máximo de pedidos a la vez («trabajadores»), registro de eventos y
 * cancelación. En Node no hay hilos de usuario: los «trabajadores» son funciones asíncronas que toman
 * pedidos de la cola; las esperas de todos los pedidos en curso se traslapan.
 */

const { performance } = require('node:perf_hooks');
const { avanzarPedido, estadosPendientes } = require('./concurrencia');
const { ordenarPorPrioridad } = require('./funcional');

/** No se pudo iniciar la corrida (ya hay una en curso o no hay nada que procesar). */
class DespachadorError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'DespachadorError';
  }
}

const TipoEvento = Object.freeze({
  CORRIDA_INICIADA: 'CORRIDA_INICIADA',
  PEDIDO_INICIADO: 'PEDIDO_INICIADO',
  TRANSICION: 'TRANSICION',
  PEDIDO_TERMINADO: 'PEDIDO_TERMINADO',
  CORRIDA_TERMINADA: 'CORRIDA_TERMINADA',
  CORRIDA_DETENIDA: 'CORRIDA_DETENIDA',
  ERROR: 'ERROR',
});

class Despachador {
  constructor() {
    this.enEjecucion = false;
    this.corrida = 0; // número de corrida; el navegador lo usa para saber cuándo empezó una nueva
    this.cola = []; // una fila por pedido: { orden, id, prioridad, estado, trabajador, activa }
    this.eventos = []; // lo que fue pasando en la corrida, en orden
    this.transicionesTotales = 0;
    this.inicio = 0; // cuándo empezó (milisegundos desde 1970)
    this.pendientes = []; // pedidos que aún no toma ningún trabajador
    this.cancelador = null; // para cancelar las esperas cuando se pulsa Detener
    this.huboError = null; // texto del error si algún trabajador falló
    this.fin = Promise.resolve();
  }

  /** Pedidos que aún tienen estados por recorrer, el de mayor prioridad primero. */
  static colaDe(pedidos) {
    const pendientes = [];
    for (const pedido of pedidos) {
      if (estadosPendientes(pedido.estado).length > 0) {
        pendientes.push(pedido);
      }
    }
    return ordenarPorPrioridad(pendientes);
  }

  /** Arranca una corrida en segundo plano y devuelve la cola que va a procesar. */
  iniciar(pedidos, retardoMs, trabajadores) {
    const cola = Despachador.colaDe(pedidos);
    if (cola.length === 0) {
      throw new DespachadorError('No hay pedidos pendientes por procesar.');
    }
    if (this.enEjecucion) {
      throw new DespachadorError('El despachador ya está procesando la cola.');
    }

    this.enEjecucion = true;
    this.corrida += 1;
    this.eventos = [];
    this.inicio = Date.now();
    this.pendientes = [...cola];
    this.cancelador = new AbortController();
    this.huboError = null;
    this.transicionesTotales = 0;
    this.cola = [];
    for (const pedido of cola) {
      this.transicionesTotales += estadosPendientes(pedido.estado).length;
      this.cola.push({
        orden: this.cola.length + 1,
        id: pedido.id,
        prioridad: pedido.prioridad,
        estado: pedido.estado,
        trabajador: 0,
        activa: false,
      });
    }
    // correr() nunca rechaza: atrapa sus propios errores y los anota como eventos.
    this.fin = this.correr(cola.length, retardoMs, Math.max(1, trabajadores));
    return cola;
  }

  /** Cancela la corrida en curso. Los pedidos quedan en el estado que ya alcanzaron. */
  detener() {
    if (this.cancelador) {
      this.cancelador.abort();
    }
  }

  /** Promesa que se cumple cuando termina la corrida actual (la usan las pruebas y el cierre del servidor). */
  esperar() {
    return this.fin;
  }

  /** Todo lo que el navegador necesita para pintar el panel. */
  estado() {
    return {
      enEjecucion: this.enEjecucion,
      corrida: this.corrida,
      cola: this.cola,
      eventos: this.eventos,
      transicionesTotales: this.transicionesTotales,
      inicio: this.inicio,
    };
  }

  // --- la corrida ---------------------------------------------------------------------

  async correr(total, retardoMs, trabajadores) {
    this.anotar(TipoEvento.CORRIDA_INICIADA, { detalle: String(total) });

    const trabajos = [];
    const cantidad = Math.min(trabajadores, total);
    for (let numero = 1; numero <= cantidad; numero++) {
      trabajos.push(this.trabajar(numero, retardoMs));
    }
    await Promise.all(trabajos);

    // Se libera antes de anotar el final: el navegador ya puede pedir otra corrida.
    this.enEjecucion = false;
    const terminados = this.eventos.filter((e) => e.tipo === TipoEvento.PEDIDO_TERMINADO).length;
    if (this.huboError) {
      this.anotar(TipoEvento.ERROR, { detalle: this.huboError });
    } else if (this.cancelador.signal.aborted) {
      this.anotar(TipoEvento.CORRIDA_DETENIDA, { detalle: `${terminados} de ${total}` });
    } else {
      const tiempoMs = Date.now() - this.inicio;
      const secuencialEstimadoMs = this.transicionesTotales * retardoMs;
      let aceleracion = null;
      if (tiempoMs > 0) {
        aceleracion = Math.round((secuencialEstimadoMs / tiempoMs) * 100) / 100;
      }
      this.anotar(TipoEvento.CORRIDA_TERMINADA, {
        resumen: { procesados: terminados, tiempoMs, secuencialEstimadoMs, aceleracion },
      });
    }
  }

  /** Un trabajador toma pedidos de la cola, uno tras otro, hasta que no quede ninguno. */
  async trabajar(numero, retardoMs) {
    while (this.pendientes.length > 0 && !this.cancelador.signal.aborted) {
      const pedido = this.pendientes.shift();
      try {
        await this.atender(pedido, numero, retardoMs);
      } catch (error) {
        // Detener cancela la espera con un AbortError: es normal. Cualquier otra cosa es un error de verdad.
        if (error.name !== 'AbortError') {
          this.huboError = `${error.name}: ${error.message}`;
        }
        return;
      }
    }
  }

  async atender(pedido, trabajador, retardoMs) {
    const fila = this.cola.find((f) => f.id === pedido.id);
    fila.trabajador = trabajador;
    fila.activa = true;
    this.anotar(TipoEvento.PEDIDO_INICIADO, { pedidoId: pedido.id, trabajador });

    // avanzarPedido llama a esta función cada vez que el pedido cambia de estado.
    const alCambiarEstado = (p, anterior, nuevo) => {
      fila.estado = nuevo;
      this.anotar(TipoEvento.TRANSICION, { pedidoId: p.id, trabajador, estadoAnterior: anterior, estadoNuevo: nuevo });
    };
    await avanzarPedido(pedido, retardoMs, { alCambiarEstado, senal: this.cancelador.signal });

    fila.trabajador = 0;
    fila.activa = false;
    this.anotar(TipoEvento.PEDIDO_TERMINADO, { pedidoId: pedido.id, trabajador });
  }

  /** Agrega un evento a la lista de la corrida. */
  anotar(tipo, datos) {
    this.eventos.push({
      tipo,
      pedidoId: datos.pedidoId || '',
      trabajador: datos.trabajador || 0,
      estadoAnterior: datos.estadoAnterior || null,
      estadoNuevo: datos.estadoNuevo || null,
      detalle: datos.detalle || '',
      marcaMs: Date.now() - this.inicio,
      resumen: datos.resumen || null,
    });
  }
}

module.exports = { Despachador, DespachadorError, TipoEvento };
