'use strict';

/**
 * Rutas del despachador.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 *
 *   GET  /api/despachador          { enEjecucion, corrida, cola, eventos, ... }   el navegador lo consulta cada 500 ms
 *   POST /api/despachador/iniciar  { retardoMs, trabajadores } -> 202 | 400 | 409
 *   POST /api/despachador/detener  -> 202
 *
 * No hay conexiones abiertas ni eventos empujados: el navegador pregunta y el servidor responde.
 */

const express = require('express');

function rutasDespachador({ controladorConcurrencia }) {
  const router = express.Router();

  router.get('/despachador', (req, res) => {
    res.json(controladorConcurrencia.estado());
  });

  router.post('/despachador/iniciar', (req, res) => {
    controladorConcurrencia.iniciar(req.body || {});
    res.status(202).json({ enEjecucion: controladorConcurrencia.enEjecucion });
  });

  router.post('/despachador/detener', (req, res) => {
    controladorConcurrencia.detener();
    res.status(202).json({ enEjecucion: controladorConcurrencia.enEjecucion });
  });

  return router;
}

module.exports = { rutasDespachador };
