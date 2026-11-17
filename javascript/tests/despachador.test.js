'use strict';

/**
 * Prueba de la concurrencia: el despachador atiende la cola con varios trabajadores.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 *
 * Ejecutar desde la carpeta javascript/:  npm test
 */

const path = require('node:path');
const { AlmacenPedidos } = require('../src/almacen');
const { Despachador, TipoEvento } = require('../src/despachador');
const { EstadoPedido } = require('../src/modelos');

const RUTA_JSON = path.join(__dirname, '..', '..', 'datos', 'solicitudes_pequenas.json');

test('despachador: lleva todos los pedidos a ENTREGADO empezando por la prioridad alta', async () => {
  const almacen = new AlmacenPedidos(RUTA_JSON);
  await almacen.cargar();
  const despachador = new Despachador();

  despachador.iniciar(almacen.pedidos, 20, 2);
  await despachador.esperar();
  const estado = despachador.estado();

  for (const pedido of almacen.pedidos) {
    expect(pedido.estado).toBe(EstadoPedido.ENTREGADO);
  }
  const iniciados = estado.eventos.filter((e) => e.tipo === TipoEvento.PEDIDO_INICIADO);
  expect(iniciados[0].pedidoId).toBe('PED-002'); // el único con prioridad alta y estado pendiente
  expect(estado.eventos[estado.eventos.length - 1].tipo).toBe(TipoEvento.CORRIDA_TERMINADA);
  expect(estado.enEjecucion).toBe(false);
});
