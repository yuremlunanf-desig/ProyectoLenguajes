'use strict';

/**
 * Prueba del login (autenticacion.js y ControladorLogin).
 *
 * Responsable: Ian (Login).
 *
 * Ejecutar desde la carpeta javascript/:  npm test
 */

const path = require('node:path');
const { AutenticacionError, ServicioAutenticacion } = require('../src/autenticacion');
const { CamposIncompletosError, ControladorLogin } = require('../src/controladores/controladorLogin');

const RUTA_USUARIOS = path.join(__dirname, '..', '..', 'datos', 'usuarios.json');

test('login: acepta al usuario válido y rechaza los demás casos', async () => {
  const servicio = await ServicioAutenticacion.desdeJson(RUTA_USUARIOS);

  expect(servicio.autenticar('admin', '1234').nombre).toBe('Administrador');
  expect(() => servicio.autenticar('admin', 'contraseña-mala')).toThrow(AutenticacionError);
  expect(() => servicio.autenticar('admin', 'contraseña-mala')).toThrow('incorrectos');
  expect(() => servicio.autenticar('nadie', '1234')).toThrow('incorrectos');

  const controlador = new ControladorLogin(servicio);
  expect(() => controlador.iniciarSesion('', '')).toThrow(CamposIncompletosError); // campos vacíos
});
