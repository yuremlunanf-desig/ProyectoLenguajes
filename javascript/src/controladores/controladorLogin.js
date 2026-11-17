'use strict';

/**
 * Controlador del login.
 *
 * Responsable: Ian (Login).
 */

const { AutenticacionError } = require('../autenticacion');

/** Falta el usuario o la contraseña: no se llega a consultar el archivo de usuarios. */
class CamposIncompletosError extends AutenticacionError {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'CamposIncompletosError';
  }
}

class ControladorLogin {
  constructor(servicio) {
    this.servicio = servicio;
  }

  /** Devuelve { usuario, nombre } o lanza una AutenticacionError con el motivo. */
  iniciarSesion(usuario, contrasena) {
    const faltaUsuario = typeof usuario !== 'string' || usuario.trim() === '';
    const faltaContrasena = typeof contrasena !== 'string' || contrasena === '';
    if (faltaUsuario || faltaContrasena) {
      throw new CamposIncompletosError('Escribe tu usuario y tu contraseña.');
    }
    return this.servicio.autenticar(usuario, contrasena);
  }
}

module.exports = { ControladorLogin, CamposIncompletosError };
