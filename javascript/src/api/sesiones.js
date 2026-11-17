'use strict';

/**
 * Sesiones en memoria y los guardias que protegen la API y las páginas.
 *
 * Responsable: Ian (Login).
 *
 * Al iniciar sesión se genera un identificador aleatorio y se entrega en una cookie HttpOnly (el
 * JavaScript de la página no puede leerla). Las sesiones viven en memoria: se pierden al reiniciar
 * el servidor.
 */

const crypto = require('node:crypto');

const NOMBRE_COOKIE = 'sid';

class Sesiones {
  constructor() {
    this.usuarios = new Map(); // identificador de sesión -> { usuario, nombre }
  }

  /** Crea la sesión de un usuario y devuelve su identificador. */
  crear(usuario) {
    const id = crypto.randomBytes(32).toString('hex');
    this.usuarios.set(id, usuario);
    return id;
  }

  /** El usuario de la sesión, o undefined si no existe. */
  obtener(id) {
    return this.usuarios.get(id);
  }

  destruir(id) {
    this.usuarios.delete(id);
  }
}

/** Valor de una cookie de la petición (sin depender de cookie-parser). */
function leerCookie(req, nombre) {
  const cookies = (req.headers.cookie || '').split(';');
  for (const cookie of cookies) {
    const [clave, valor] = cookie.trim().split('=');
    if (clave === nombre) {
      return valor;
    }
  }
  return null;
}

function identificadorDe(req) {
  return leerCookie(req, NOMBRE_COOKIE);
}

/** Guardia de la API: sin sesión válida responde 401 en JSON. */
function requerirSesion(sesiones) {
  return (req, res, next) => {
    const usuario = sesiones.obtener(identificadorDe(req));
    if (!usuario) {
      res.status(401).json({ error: { tipo: 'autenticacion', mensaje: 'Inicia sesión para continuar.' } });
      return;
    }
    req.usuario = usuario;
    next();
  };
}

/** Guardia de las páginas: sin sesión válida redirige al login. */
function requerirSesionPagina(sesiones) {
  return (req, res, next) => {
    const usuario = sesiones.obtener(identificadorDe(req));
    if (!usuario) {
      res.redirect('/');
      return;
    }
    req.usuario = usuario;
    next();
  };
}

module.exports = { Sesiones, NOMBRE_COOKIE, identificadorDe, requerirSesion, requerirSesionPagina };
