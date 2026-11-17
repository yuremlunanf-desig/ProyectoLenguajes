'use strict';

/**
 * Control de acceso: valida usuario y contraseña contra datos/usuarios.json.
 *
 * Responsable: Ian (Login).
 *
 * Versión sencilla para estudiar: usuarios.json guarda las contraseñas en texto plano y aquí se
 * comparan tal cual. Es solo para este proyecto académico: en un sistema real nunca se guarda la
 * contraseña así, se guarda un hash.
 */

const fs = require('node:fs/promises');

/** No se puede entrar, o el archivo de usuarios no se puede leer. El mensaje se muestra tal cual. */
class AutenticacionError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'AutenticacionError';
  }
}

class ServicioAutenticacion {
  constructor(usuarios) {
    this.usuarios = usuarios;
  }

  /** Lee usuarios.json. Si no existe o está mal escrito lanza AutenticacionError. */
  static async desdeJson(ruta) {
    let datos;
    try {
      datos = JSON.parse(await fs.readFile(ruta, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AutenticacionError(`No se encontró el archivo de usuarios: ${ruta}`);
      }
      throw new AutenticacionError(`El archivo de usuarios ${ruta} tiene un formato inválido.`);
    }
    if (!Array.isArray(datos.usuarios)) {
      throw new AutenticacionError(`El archivo de usuarios ${ruta} tiene un formato inválido.`);
    }
    return new ServicioAutenticacion(datos.usuarios);
  }

  /** Devuelve { usuario, nombre } si coinciden el nombre y la contraseña; si no, lanza AutenticacionError. */
  autenticar(usuario, contrasena) {
    for (const registro of this.usuarios) {
      if (registro.usuario === usuario.trim() && registro.password === contrasena) {
        return { usuario: registro.usuario, nombre: registro.nombre || registro.usuario };
      }
    }
    throw new AutenticacionError('Usuario o contraseña incorrectos.');
  }
}

module.exports = { AutenticacionError, ServicioAutenticacion };
