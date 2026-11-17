'use strict';

/**
 * Ruta de datos del dashboard comparativo (la página vive en la carpeta dashboard/ del proyecto).
 *
 * Responsable: Edsson (métricas).
 *
 *   GET /dashboard/api/metricas   { generado, lenguajes: [{ lenguaje, metricas, aviso, loc }] }
 *
 * Los resultados_metricas.json y el código viven fuera del navegador. Por eso los lee el servidor y se
 * los entrega a la página en una sola respuesta del mismo origen (así no hay problemas de CORS).
 */

const express = require('express');
const { leerProyecto } = require('../metricasProyecto');

function rutasDashboard({ carpetaProyecto }) {
  const router = express.Router();

  router.get('/api/metricas', async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store'); // siempre los resultados más recientes
      res.json(await leerProyecto(carpetaProyecto));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { rutasDashboard };
