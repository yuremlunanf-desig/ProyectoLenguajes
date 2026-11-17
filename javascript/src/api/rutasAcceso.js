'use strict';

/**
 * Rutas de acceso: login, logout y consulta de la sesión actual.
 *
 * Responsable: Ian (Login).
 *
 *   POST /api/login   { usuario, contrasena }  -> 200 { usuario } + cookie de sesión | 400 | 401
 *   POST /api/logout                           -> 204
 *   GET  /api/sesion                           -> 200 { usuario } | 401
 */

const express = require('express');
const { NOMBRE_COOKIE, identificadorDe, requerirSesion } = require('./sesiones');

function rutasAcceso({ controladorLogin, sesiones }) {
  const router = express.Router();

  router.post('/login', (req, res) => {
    const cuerpo = req.body || {};
    const usuario = controladorLogin.iniciarSesion(cuerpo.usuario, cuerpo.contrasena);
    const id = sesiones.crear(usuario);
    res.cookie(NOMBRE_COOKIE, id, { httpOnly: true, sameSite: 'strict', path: '/' });
    res.json({ usuario });
  });

  router.post('/logout', (req, res) => {
    sesiones.destruir(identificadorDe(req));
    res.clearCookie(NOMBRE_COOKIE, { path: '/' });
    res.status(204).end();
  });

  router.get('/sesion', requerirSesion(sesiones), (req, res) => {
    res.json({ usuario: req.usuario });
  });

  return router;
}

module.exports = { rutasAcceso };
