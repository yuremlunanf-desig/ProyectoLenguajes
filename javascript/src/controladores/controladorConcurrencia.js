'use strict';

/**
 * Controlador del panel de concurrencia: valida los parámetros y conecta la web con el despachador.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 */

const { Despachador, DespachadorError } = require('../despachador');
const { ErrorConcurrencia } = require('./errores');

const RETARDO = { minimo: 50, maximo: 5000, porDefecto: 1000 };
const TRABAJADORES = { minimo: 1, maximo: 8, porDefecto: 2 };

/** Convierte el texto (o número) en un entero dentro de los límites, o lanza ErrorConcurrencia. */
function leerEntero(valor, nombre, limites, unidad) {
  const texto = String(valor === undefined || valor === null ? '' : valor).trim();
  if (!/^[+-]?\d+$/.test(texto)) {
    throw new ErrorConcurrencia(`${nombre} debe ser un número entero.`);
  }
  const numero = Number(texto);
  if (numero < limites.minimo || numero > limites.maximo) {
    throw new ErrorConcurrencia(`${nombre} debe estar entre ${limites.minimo} y ${limites.maximo}${unidad}.`);
  }
  return numero;
}

class ControladorConcurrencia {
  constructor(almacen, despachador = new Despachador()) {
    this.almacen = almacen;
    this.despachador = despachador;
  }

  get enEjecucion() {
    return this.despachador.enEjecucion;
  }

  /** Arranca una corrida. Lanza ErrorConcurrencia si un parámetro es inválido o no se puede iniciar. */
  iniciar({ retardoMs, trabajadores } = {}) {
    const retardo = leerEntero(retardoMs, 'El retardo', RETARDO, ' ms');
    const cantidad = leerEntero(trabajadores, 'La cantidad de trabajadores', TRABAJADORES, '');
    try {
      this.despachador.iniciar(this.almacen.pedidos, retardo, cantidad);
    } catch (error) {
      if (error instanceof DespachadorError) {
        throw new ErrorConcurrencia(error.message);
      }
      throw error;
    }
  }

  detener() {
    this.despachador.detener();
  }

  /** Estado de la corrida actual (el que consulta el navegador) y los límites de los parámetros. */
  estado() {
    return { ...this.despachador.estado(), limites: { retardoMs: RETARDO, trabajadores: TRABAJADORES } };
  }

  /** Cancela la corrida y espera a que termine (se usa al apagar el servidor). */
  async cerrar() {
    this.despachador.detener();
    await this.despachador.esperar();
  }
}

module.exports = { ControladorConcurrencia, RETARDO, TRABAJADORES };
