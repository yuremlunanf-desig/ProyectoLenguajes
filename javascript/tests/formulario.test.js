'use strict';

/**
 * Prueba del formulario de pedidos (vista previa del carrito y registro).
 *
 * Responsable: Edsson (Formularios).
 *
 * Ejecutar desde la carpeta javascript/:  npm test
 */

const path = require('node:path');
const { AlmacenPedidos } = require('../src/almacen');
const { leerCatalogo } = require('../src/catalogo');
const { PedidoInvalidoError } = require('../src/negocio');
const { ControladorFormulario } = require('../src/controladores/controladorFormulario');
const { ErrorFormulario } = require('../src/controladores/errores');

const DATOS = path.join(__dirname, '..', '..', 'datos');

test('formulario: valida la captura y registra un pedido nuevo', async () => {
  const almacen = new AlmacenPedidos(path.join(DATOS, 'solicitudes_pequenas.json'));
  await almacen.cargar();
  const formulario = new ControladorFormulario(almacen, await leerCatalogo(path.join(DATOS, 'catalogo.json')));
  expect(almacen.pedidos).toHaveLength(4); // el quinto pedido del archivo se rechaza (cantidad 0)

  const base = { tipoCliente: 'REGULAR', envio: 'ESTANDAR' };
  // Una cantidad que no es número, y una cantidad 0 (la rechaza la regla de negocio).
  expect(() => formulario.vistaPrevia({ ...base, lineas: [{ sku: 'TEC-101', cantidad: 'abc' }] })).toThrow(ErrorFormulario);
  expect(() => formulario.vistaPrevia({ ...base, lineas: [{ sku: 'TEC-101', cantidad: 0 }] })).toThrow(PedidoInvalidoError);

  const pedido = formulario.registrar({
    cliente: { id: 'C005', nombre: 'Marta Ruiz', tipo: 'REGULAR' },
    envio: 'ESTANDAR',
    prioridad: 'MEDIA',
    // El mismo producto en dos líneas se suma: 2 teclados.
    lineas: [{ sku: 'TEC-101', cantidad: 1 }, { sku: 'TEC-101', cantidad: 1 }],
  });

  // 2 × 899.50 = 1,799.00 (sin descuento) + IVA 287.84 + envío estándar 50.00
  expect(pedido.id).toBe('PED-006');
  expect(almacen.desglose('PED-006').total).toBe(213684); // en centavos
  expect(almacen.pedidos).toHaveLength(5);
});
