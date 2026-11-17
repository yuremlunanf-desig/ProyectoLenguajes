'use strict';

/**
 * Rutas del formulario de captura: catálogo, vista previa del carrito y registro de pedidos.
 *
 * Responsable: Edsson (Formularios).
 *
 *   GET  /api/catalogo                      productos del formulario
 *   POST /api/pedidos/vista-previa          { tipoCliente, envio, lineas } -> { lineas, desglose }
 *   POST /api/pedidos                       { cliente, envio, prioridad, lineas } -> 201 { id, mensaje }
 */

const express = require('express');

function rutasFormulario({ controladorFormulario }) {
  const router = express.Router();

  router.get('/catalogo', (req, res) => {
    res.json({ productos: controladorFormulario.productos() });
  });

  router.post('/pedidos/vista-previa', (req, res) => {
    res.json(controladorFormulario.vistaPrevia(req.body));
  });

  router.post('/pedidos', (req, res) => {
    const pedido = controladorFormulario.registrar(req.body);
    res.status(201).json({
      id: pedido.id,
      mensaje: `Pedido ${pedido.id} registrado para ${pedido.cliente.nombre}.`,
    });
  });

  return router;
}

module.exports = { rutasFormulario };
