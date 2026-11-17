'use strict';

/**
 * Reglas de negocio: validaciones y cálculos monetarios de un pedido.
 *
 * Responsable: Leonardo (Negocio y Validaciones).
 *
 * Reglas:
 * - Descuento (no acumulable): 10% si el subtotal es >= $2,000; si no, 5% si
 *   el cliente es frecuente; en otro caso no hay descuento.
 * - IVA: 16% sobre (subtotal - descuento).
 * - Envío: estándar $50, express $120 (no causa IVA).
 * - Total = subtotal - descuento + IVA + envío.
 *
 * Todo el dinero se maneja en centavos enteros. Los porcentajes se calculan
 * con aritmética entera y Math.round, que en importes positivos redondea la
 * mitad hacia arriba (0.5 centavos sube a 1).
 */

const { TipoEnvio } = require('./modelos');

const IVA_PORCENTAJE = 16;
const UMBRAL_DESCUENTO_MONTO_CENTAVOS = 200000;
const DESCUENTO_POR_MONTO_PORCENTAJE = 10;
const DESCUENTO_FRECUENTE_PORCENTAJE = 5;
const COSTO_ENVIO_CENTAVOS = Object.freeze({
  [TipoEnvio.ESTANDAR]: 5000,
  [TipoEnvio.EXPRESS]: 12000,
});

class PedidoInvalidoError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'PedidoInvalidoError';
  }
}

/** Porcentaje de un importe en centavos, redondeado al centavo. */
const porcentaje = (centavos, tasa) => Math.round((centavos * tasa) / 100);

/** Convierte centavos enteros a texto con dos decimales: 229345 -> "2293.45". */
function formatearCentavos(centavos) {
  const signo = centavos < 0 ? '-' : '';
  const absoluto = Math.abs(centavos);
  const pesos = Math.floor(absoluto / 100);
  const resto = String(absoluto % 100).padStart(2, '0');
  return `${signo}${pesos}.${resto}`;
}

/** Validaciones estrictas: lanza PedidoInvalidoError si el pedido no es válido. */
class ValidadorPedido {
  static validar(pedido) {
    if (!Array.isArray(pedido.productos) || pedido.productos.length === 0) {
      throw new PedidoInvalidoError(`El pedido ${pedido.id} no tiene productos.`);
    }
    for (const producto of pedido.productos) {
      const { cantidad } = producto;
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new PedidoInvalidoError(
          `El pedido ${pedido.id} tiene una cantidad inválida (${cantidad}) ` +
            `en el producto ${producto.sku}: debe ser un entero mayor que 0.`
        );
      }
    }
  }
}

/** Cálculos monetarios sobre un Pedido. Todos los importes son centavos enteros. */
class CalculadoraPedido {
  static subtotal(pedido) {
    return pedido.productos.reduce(
      (suma, producto) => suma + producto.precioCentavos * producto.cantidad,
      0
    );
  }

  /** Los descuentos no se acumulan: gana el de monto y, si no aplica, el de frecuente. */
  static porcentajeDescuento(pedido) {
    if (CalculadoraPedido.subtotal(pedido) >= UMBRAL_DESCUENTO_MONTO_CENTAVOS) {
      return DESCUENTO_POR_MONTO_PORCENTAJE;
    }
    if (pedido.cliente.esFrecuente) {
      return DESCUENTO_FRECUENTE_PORCENTAJE;
    }
    return 0;
  }

  static descuento(pedido) {
    return porcentaje(
      CalculadoraPedido.subtotal(pedido),
      CalculadoraPedido.porcentajeDescuento(pedido)
    );
  }

  static iva(pedido) {
    const base = CalculadoraPedido.subtotal(pedido) - CalculadoraPedido.descuento(pedido);
    return porcentaje(base, IVA_PORCENTAJE);
  }

  static envio(pedido) {
    return COSTO_ENVIO_CENTAVOS[pedido.envio];
  }

  static total(pedido) {
    return CalculadoraPedido.desglose(pedido).total;
  }

  /** Valida el pedido y devuelve todos sus importes. */
  static desglose(pedido) {
    ValidadorPedido.validar(pedido);
    const subtotal = CalculadoraPedido.subtotal(pedido);
    const descuento = CalculadoraPedido.descuento(pedido);
    const iva = CalculadoraPedido.iva(pedido);
    const envio = CalculadoraPedido.envio(pedido);
    return Object.freeze({
      subtotal,
      descuento,
      iva,
      envio,
      total: subtotal - descuento + iva + envio,
    });
  }
}

module.exports = {
  IVA_PORCENTAJE,
  UMBRAL_DESCUENTO_MONTO_CENTAVOS,
  DESCUENTO_POR_MONTO_PORCENTAJE,
  DESCUENTO_FRECUENTE_PORCENTAJE,
  COSTO_ENVIO_CENTAVOS,
  PedidoInvalidoError,
  ValidadorPedido,
  CalculadoraPedido,
  formatearCentavos,
};
