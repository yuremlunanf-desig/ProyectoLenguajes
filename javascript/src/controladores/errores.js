'use strict';

/**
 * Errores de los controladores. Todos llevan un mensaje apto para mostrarse tal cual al usuario;
 * la capa web los traduce a códigos HTTP (400, 404...) sin tumbar el servidor.
 *
 * Responsable: Ian (Login): infraestructura compartida de la interfaz web.
 */

/** Un dato del formulario (o un parámetro de consulta) falta o no tiene el formato esperado. */
class ErrorFormulario extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorFormulario';
  }
}

/** Un parámetro de la corrida del despachador es inválido. */
class ErrorConcurrencia extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorConcurrencia';
  }
}

/** Se pidió un pedido que no existe. */
class NoEncontradoError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'NoEncontradoError';
  }
}

module.exports = { ErrorFormulario, ErrorConcurrencia, NoEncontradoError };
