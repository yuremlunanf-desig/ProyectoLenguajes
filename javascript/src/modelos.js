'use strict';

/**
 * Modelos de dominio de la tienda: Producto, Cliente y Pedido.
 *
 * Responsable: Ian (Modelos y Datos).
 *
 * Estas clases solo guardan datos. Los cálculos y las validaciones viven en
 * negocio.js. El dinero se guarda en centavos enteros (precioCentavos) para
 * no depender del punto flotante.
 */

const TipoCliente = Object.freeze({ REGULAR: 'REGULAR', FRECUENTE: 'FRECUENTE' });

const TipoEnvio = Object.freeze({ ESTANDAR: 'ESTANDAR', EXPRESS: 'EXPRESS' });

const EstadoPedido = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  ENVIADO: 'ENVIADO',
  ENTREGADO: 'ENTREGADO',
  CANCELADO: 'CANCELADO',
});

const Prioridad = Object.freeze({ ALTA: 'ALTA', MEDIA: 'MEDIA', BAJA: 'BAJA' });

/** Orden de atención de cada prioridad: 1 se atiende primero. */
const NIVEL_PRIORIDAD = Object.freeze({ ALTA: 1, MEDIA: 2, BAJA: 3 });

class Producto {
  constructor({ sku, nombre, precioCentavos, cantidad }) {
    this.sku = sku;
    this.nombre = nombre;
    this.precioCentavos = precioCentavos;
    this.cantidad = cantidad;
    Object.freeze(this);
  }
}

class Cliente {
  constructor({ id, nombre, tipo = TipoCliente.REGULAR }) {
    this.id = id;
    this.nombre = nombre;
    this.tipo = tipo;
    Object.freeze(this);
  }

  get esFrecuente() {
    return this.tipo === TipoCliente.FRECUENTE;
  }
}

class Pedido {
  constructor({
    id,
    cliente,
    fecha,
    productos = [],
    envio = TipoEnvio.ESTANDAR,
    prioridad = Prioridad.MEDIA,
    estado = EstadoPedido.PENDIENTE,
  }) {
    this.id = id;
    this.cliente = cliente;
    this.fecha = fecha;
    this.productos = Object.freeze([...productos]);
    this.envio = envio;
    this.prioridad = prioridad;
    this.estado = estado;
  }

  cambiarEstado(nuevo) {
    this.estado = nuevo;
  }
}

module.exports = {
  TipoCliente,
  TipoEnvio,
  EstadoPedido,
  Prioridad,
  NIVEL_PRIORIDAD,
  Producto,
  Cliente,
  Pedido,
};
