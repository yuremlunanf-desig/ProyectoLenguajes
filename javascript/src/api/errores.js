'use strict';

/**
 * Traduce los errores del dominio a respuestas HTTP. Un error de captura del usuario nunca
 * tumba el servidor ni deja una traza en la consola: responde con un JSON legible.
 *
 * Responsable: Ian (Login): infraestructura compartida de la interfaz web.
 *
 * Forma de la respuesta: { error: { tipo, mensaje } }. El navegador decide el estilo de la alerta
 * según el tipo: 'formulario' y 'conflicto' son avisos; 'negocio', 'autenticacion' y 'datos', errores.
 *
 * La clasificación es por el nombre de la clase del error (cada clase fija su `name`), de modo que este
 * archivo no depende de los módulos de cada integrante y puede integrarse antes que ellos.
 */

const POR_NOMBRE = new Map([
  ['CamposIncompletosError', { status: 400, tipo: 'formulario' }],
  ['AutenticacionError', { status: 401, tipo: 'autenticacion' }],
  ['CatalogoError', { status: 500, tipo: 'datos' }],
  ['ErrorFormulario', { status: 400, tipo: 'formulario' }],
  ['ErrorConcurrencia', { status: 400, tipo: 'formulario' }],
  ['PedidoInvalidoError', { status: 422, tipo: 'negocio' }], // la regla de negocio de la fase 1 rechazó el pedido
  ['DespachadorError', { status: 409, tipo: 'conflicto' }],
  ['NoEncontradoError', { status: 404, tipo: 'noEncontrado' }],
]);

/** { status, tipo, mensaje? } de un error conocido, o null si es un defecto inesperado. */
function clasificar(error) {
  if (error.type === 'entity.parse.failed') {
    return { status: 400, tipo: 'formulario', mensaje: 'El cuerpo de la petición no es un JSON válido.' };
  }
  if (error.type === 'entity.too.large') {
    return { status: 413, tipo: 'formulario', mensaje: 'La petición es demasiado grande.' };
  }
  const conocido = POR_NOMBRE.get(error.name);
  if (conocido) {
    return conocido;
  }
  return null;
}

/** Middleware final de Express. */
function manejadorDeErrores(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }
  const conocido = clasificar(error);
  if (conocido) {
    const mensaje = conocido.mensaje || error.message;
    res.status(conocido.status).json({ error: { tipo: conocido.tipo, mensaje } });
    return;
  }
  // Un defecto de la aplicación (no un error del usuario): queda en la consola y el cliente recibe un mensaje genérico.
  console.error(`Error inesperado en ${req.method} ${req.originalUrl}:`, error);
  res.status(500).json({
    error: { tipo: 'interno', mensaje: 'Ocurrió un error inesperado en el servidor. Intenta de nuevo.' },
  });
}

/** Respuesta 404 en JSON para rutas /api que no existen. */
function apiNoEncontrada(req, res) {
  res.status(404).json({ error: { tipo: 'noEncontrado', mensaje: `No existe ${req.method} ${req.originalUrl}.` } });
}

module.exports = { clasificar, manejadorDeErrores, apiNoEncontrada };
