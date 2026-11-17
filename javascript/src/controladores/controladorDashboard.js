'use strict';

/**
 * Controlador del dashboard: consultas y resumen de los pedidos para la tabla.
 *
 * Responsable: Leonardo (Dashboard).
 *
 * Las consultas reutilizan funcional.js (filter / sort / reduce): aquí solo se combinan y se
 * les da formato de texto para la tabla.
 */

const { EstadoPedido } = require('../modelos');
const {
  buscarPorCliente,
  contarPorEstado,
  filtrarPorEstado,
  ordenarPorFecha,
  ordenarPorPrioridad,
  sumarImportes,
} = require('../funcional');
const { ErrorFormulario, NoEncontradoError } = require('./errores');
const { ESTADOS, PRIORIDADES, TIPOS_CLIENTE, ENVIOS, dinero } = require('./etiquetas');

const COLUMNAS = Object.freeze([
  'ID',
  'Cliente',
  'Fecha',
  'Prioridad',
  'Envío',
  'Subtotal',
  'Descuento',
  'IVA',
  'Total',
  'Estado',
]);
const TODOS = 'TODOS';
const ORDENES = Object.freeze({ FECHA: 'Fecha', PRIORIDAD: 'Prioridad', ID: 'ID' });

const dos = (numero) => String(numero).padStart(2, '0');
const fechaCorta = (f) => `${dos(f.getDate())}/${dos(f.getMonth() + 1)} ${dos(f.getHours())}:${dos(f.getMinutes())}`;
const fechaLarga = (f) => `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()} ${fechaCorta(f).slice(6)}`;

class ControladorDashboard {
  constructor(almacen) {
    this.almacen = almacen;
  }

  /** Filas de la tabla ya filtradas y ordenadas. Lanza ErrorFormulario si un parámetro no es válido. */
  consultar({ cliente = '', estado = TODOS, orden = 'FECHA' } = {}) {
    if (estado !== TODOS && !Object.keys(EstadoPedido).includes(estado)) {
      throw new ErrorFormulario(`El estado «${estado}» no es válido.`);
    }
    if (!Object.keys(ORDENES).includes(orden)) {
      throw new ErrorFormulario(`El orden «${orden}» no es válido.`);
    }
    let pedidos = this.almacen.pedidos;
    if (String(cliente).trim() !== '') {
      pedidos = buscarPorCliente(pedidos, cliente);
    }
    if (estado !== TODOS) {
      pedidos = filtrarPorEstado(pedidos, estado);
    }
    if (orden === 'PRIORIDAD') {
      pedidos = ordenarPorPrioridad(pedidos);
    } else if (orden === 'ID') {
      pedidos = [...pedidos].sort((a, b) => a.id.localeCompare(b.id));
    } else {
      pedidos = ordenarPorFecha(pedidos);
    }
    const filas = [];
    for (const pedido of pedidos) {
      filas.push(this.fila(pedido));
    }
    return filas;
  }

  resumen() {
    const pedidos = this.almacen.pedidos;
    const conteo = contarPorEstado(pedidos); // solo trae los estados que sí aparecen
    const porEstado = {};
    for (const estado of Object.keys(EstadoPedido)) {
      porEstado[estado] = conteo[estado] || 0;
    }
    return {
      totalPedidos: pedidos.length,
      porEstado,
      totalVendido: dinero(sumarImportes(this.almacen.desgloses(), (d) => d.total)),
      rechazados: this.almacen.rechazos.length,
    };
  }

  rechazos() {
    return this.almacen.rechazos;
  }

  /** Vuelve a los pedidos del JSON de solicitudes. Devuelve los motivos de rechazo. */
  recargar() {
    return this.almacen.cargar();
  }

  /** Texto con el desglose completo de un pedido (se muestra al hacer doble clic en la fila). */
  detalle(pedidoId) {
    const pedido = this.almacen.pedidos.find((p) => p.id === pedidoId);
    if (!pedido) {
      throw new NoEncontradoError(`No existe el pedido ${pedidoId}.`);
    }
    const d = this.almacen.desglose(pedidoId);
    return [
      `Pedido ${pedido.id} · ${ESTADOS[pedido.estado]}`,
      `Cliente: ${pedido.cliente.nombre} (${TIPOS_CLIENTE[pedido.cliente.tipo]})`,
      `Fecha: ${fechaLarga(pedido.fecha)}`,
      '',
      'Productos:',
      ...pedido.productos.map((p) => `  ${p.cantidad} × ${p.nombre} — ${dinero(p.precioCentavos)} c/u`),
      '',
      `Subtotal:   ${dinero(d.subtotal)}`,
      `Descuento: -${dinero(d.descuento)}`,
      `IVA (16%):  ${dinero(d.iva)}`,
      `Envío ${ENVIOS[pedido.envio].toLowerCase()}: ${dinero(d.envio)}`,
      `TOTAL:      ${dinero(d.total)}`,
    ].join('\n');
  }

  /** Una fila de la tabla: los textos ya formateados, en el orden de COLUMNAS. */
  fila(pedido) {
    const d = this.almacen.desglose(pedido.id);
    return {
      id: pedido.id,
      estado: pedido.estado,
      valores: [
        pedido.id,
        pedido.cliente.nombre,
        fechaCorta(pedido.fecha),
        PRIORIDADES[pedido.prioridad],
        ENVIOS[pedido.envio],
        dinero(d.subtotal),
        dinero(d.descuento),
        dinero(d.iva),
        dinero(d.total),
        ESTADOS[pedido.estado],
      ],
    };
  }
}

module.exports = { ControladorDashboard, COLUMNAS, TODOS, ORDENES };
