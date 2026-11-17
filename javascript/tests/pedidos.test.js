'use strict';

/**
 * Pruebas automatizadas con Jest (5 casos).
 *
 * Responsable: Yurem (Funcional y Testing).
 *
 * Ejecutar desde la carpeta javascript/:  npm test
 */

const path = require('node:path');
const { Cliente, EstadoPedido, Pedido, Producto, TipoCliente, TipoEnvio } = require('../src/modelos');
const { leerPedidos } = require('../src/lectorJson');
const { CalculadoraPedido, PedidoInvalidoError, ValidadorPedido } = require('../src/negocio');
const {
  buscarPorCliente,
  filtrarPorEstado,
  ids,
  ordenarPorFecha,
  ordenarPorPrioridad,
} = require('../src/funcional');

const RUTA_JSON = path.join(__dirname, '..', '..', 'datos', 'solicitudes_pequenas.json');

/** Arma un pedido de prueba a partir de pares [precioCentavos, cantidad]. */
function crearPedido(lineas, tipo = TipoCliente.REGULAR, envio = TipoEnvio.ESTANDAR) {
  return new Pedido({
    id: 'PRUEBA-1',
    cliente: new Cliente({ id: 'C999', nombre: 'Cliente de prueba', tipo }),
    fecha: new Date('2026-11-01T10:00:00'),
    productos: lineas.map(
      ([precioCentavos, cantidad], i) =>
        new Producto({ sku: `SKU-${i + 1}`, nombre: `Producto ${i + 1}`, precioCentavos, cantidad })
    ),
    envio,
  });
}

test('descuento del 10% por monto, con IVA y envío estándar', () => {
  const pedido = crearPedido([[89950, 2], [34990, 1]]);

  expect(CalculadoraPedido.desglose(pedido)).toEqual({
    subtotal: 214890,
    descuento: 21489,
    iva: 30944,
    envio: 5000,
    total: 229345,
  });
});

test('descuento frecuente del 5% y no acumulable con el de monto', () => {
  const chico = CalculadoraPedido.desglose(
    crearPedido([[61533, 1], [8999, 3]], TipoCliente.FRECUENTE, TipoEnvio.EXPRESS)
  );
  // 5% de 885.30 = 44.265: la mitad sube y queda en 44.27.
  expect(chico.descuento).toBe(4427);
  expect(chico.total).toBe(109559);

  const grande = CalculadoraPedido.desglose(
    crearPedido([[329900, 1], [45050, 1]], TipoCliente.FRECUENTE, TipoEnvio.EXPRESS)
  );
  // Solo el 10% por monto, no 10% + 5%.
  expect(grande.descuento).toBe(37495);
  expect(grande.total).toBe(403448);
});

test('cantidad cero o negativa lanza excepción', () => {
  for (const cantidad of [0, -3]) {
    const pedido = crearPedido([[10000, 1], [5000, cantidad]]);

    expect(() => ValidadorPedido.validar(pedido)).toThrow(PedidoInvalidoError);
    expect(() => ValidadorPedido.validar(pedido)).toThrow('cantidad inválida');
    expect(() => CalculadoraPedido.desglose(pedido)).toThrow(PedidoInvalidoError);
  }
});

test('pedido sin productos lanza excepción', () => {
  const pedido = crearPedido([]);

  expect(() => ValidadorPedido.validar(pedido)).toThrow(PedidoInvalidoError);
  expect(() => ValidadorPedido.validar(pedido)).toThrow('no tiene productos');
  expect(() => CalculadoraPedido.desglose(pedido)).toThrow(PedidoInvalidoError);
});

test('consultas funcionales sobre el JSON de prueba', async () => {
  const pedidos = await leerPedidos(RUTA_JSON);

  expect(pedidos).toHaveLength(5);
  expect(ids(buscarPorCliente(pedidos, 'C001'))).toEqual(['PED-001', 'PED-004']);
  expect(ids(buscarPorCliente(pedidos, 'sofía'))).toEqual(['PED-003']);
  expect(ids(filtrarPorEstado(pedidos, EstadoPedido.PENDIENTE))).toEqual([
    'PED-001',
    'PED-002',
    'PED-005',
  ]);
  expect(ids(ordenarPorFecha(pedidos))).toEqual([
    'PED-002',
    'PED-004',
    'PED-001',
    'PED-005',
    'PED-003',
  ]);
  expect(ids(ordenarPorPrioridad(pedidos))).toEqual([
    'PED-002',
    'PED-003',
    'PED-001',
    'PED-005',
    'PED-004',
  ]);
  // Las consultas no modifican el arreglo original.
  expect(ids(pedidos)).toEqual(['PED-001', 'PED-002', 'PED-003', 'PED-004', 'PED-005']);
});
