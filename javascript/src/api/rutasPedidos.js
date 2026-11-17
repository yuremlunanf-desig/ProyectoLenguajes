'use strict';

/**
 * Rutas del dashboard: opciones de los selectores, tabla de pedidos, detalle y restablecer datos.
 *
 * Responsable: Leonardo (Dashboard).
 *
 *   GET  /api/opciones                      selectores y flujo de estados (sin duplicar reglas en el navegador)
 *   GET  /api/pedidos?cliente=&estado=&orden=   { columnas, filas, resumen, rechazos }
 *   GET  /api/pedidos/:id/detalle           { texto }
 *   POST /api/datos/restablecer             vuelve a solicitudes_pequenas.json
 */

const express = require('express');
const { COLUMNAS, ORDENES } = require('../controladores/controladorDashboard');
const { opciones } = require('../controladores/etiquetas');
const { ErrorConcurrencia } = require('../controladores/errores');

/**
 * `hayTrabajoEnCurso` es una función que dice si el despachador está procesando; así esta ruta no
 * depende del módulo de concurrencia (lo conecta servidor.js).
 */
function rutasPedidos({ controladorDashboard, hayTrabajoEnCurso = () => false }) {
  const router = express.Router();

  router.get('/opciones', (req, res) => {
    res.json({
      ...opciones(),
      ordenes: Object.entries(ORDENES).map(([valor, etiqueta]) => ({ valor, etiqueta })),
    });
  });

  router.get('/pedidos', (req, res) => {
    const { cliente, estado, orden } = req.query;
    res.json({
      columnas: COLUMNAS,
      filas: controladorDashboard.consultar({ cliente, estado, orden }),
      resumen: controladorDashboard.resumen(),
      rechazos: controladorDashboard.rechazos(),
    });
  });

  router.get('/pedidos/:id/detalle', (req, res) => {
    res.json({ texto: controladorDashboard.detalle(req.params.id) });
  });

  router.post('/datos/restablecer', async (req, res) => {
    if (hayTrabajoEnCurso()) {
      throw new ErrorConcurrencia('Detén el despachador antes de restablecer los datos.');
    }
    const rechazos = await controladorDashboard.recargar();
    res.json({ rechazos });
  });

  return router;
}

module.exports = { rutasPedidos };
