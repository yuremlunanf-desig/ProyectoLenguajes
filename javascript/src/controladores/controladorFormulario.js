'use strict';

/**
 * Controlador del formulario de captura: vista previa del carrito y registro de pedidos nuevos.
 *
 * Responsable: Edsson (Formularios).
 *
 * Las reglas de negocio no se repiten aquí. Una cantidad <= 0 o un carrito vacío los rechaza
 * ValidadorPedido (vía CalculadoraPedido) con PedidoInvalidoError; este controlador solo agrega los
 * errores propios del formulario (campos vacíos, texto que no es un número) con ErrorFormulario.
 *
 * El carrito vive en el navegador: cada llamada recibe las líneas completas ({ sku, cantidad }), así
 * el servidor no guarda un carrito por usuario.
 */

const { Cliente, EstadoPedido, Pedido, Prioridad, TipoCliente, TipoEnvio } = require('../modelos');
const { CalculadoraPedido } = require('../negocio');
const { ErrorFormulario } = require('./errores');
const { dinero } = require('./etiquetas');

/** Comprueba que `valor` sea una de las claves del enumerado (por ejemplo 'REGULAR') y la devuelve. */
function leerOpcion(enumerado, valor, nombre) {
  if (!Object.keys(enumerado).includes(valor)) {
    throw new ErrorFormulario(`El valor «${valor}» no es válido para ${nombre}.`);
  }
  return enumerado[valor];
}

/** Acepta un entero o un texto con un entero. Lo demás es un error de formulario. */
function leerCantidad(valor) {
  const texto = String(valor === undefined || valor === null ? '' : valor).trim();
  if (!/^[+-]?\d+$/.test(texto)) {
    throw new ErrorFormulario(`La cantidad «${texto}» no es un número entero. Escribe, por ejemplo, 2.`);
  }
  const cantidad = Number(texto);
  if (!Number.isSafeInteger(cantidad)) {
    throw new ErrorFormulario(`La cantidad «${texto}» es demasiado grande.`);
  }
  return cantidad;
}

class ControladorFormulario {
  constructor(almacen, catalogo) {
    this.almacen = almacen;
    this.catalogo = catalogo; // lista de ItemCatalogo
  }

  /** Productos para el selector. */
  productos() {
    const lista = [];
    for (const item of this.catalogo) {
      lista.push({ sku: item.sku, nombre: item.nombre, precio: dinero(item.precioCentavos), etiqueta: item.etiqueta });
    }
    return lista;
  }

  /**
   * Carrito normalizado (las líneas del mismo producto se suman, cada una con su importe) y los importes
   * totales, con las mismas reglas que el pedido final. El desglose es null si el carrito está vacío.
   * Sirve también para validar una línea antes de agregarla: lanza PedidoInvalidoError si no cumple.
   */
  vistaPrevia(datos) {
    const { tipoCliente, envio, lineas } = datos || {};
    const tipo = leerOpcion(TipoCliente, tipoCliente, 'el tipo de cliente');
    const tipoEnvio = leerOpcion(TipoEnvio, envio, 'el envío');
    const productos = this.productosDe(lineas);
    if (productos.length === 0) {
      return { lineas: [], desglose: null };
    }

    const borrador = this.armarPedido('NUEVO', { id: '', nombre: '', tipo }, tipoEnvio, Prioridad.MEDIA, productos);
    const d = CalculadoraPedido.desglose(borrador);
    const lineasConImporte = [];
    for (const p of productos) {
      lineasConImporte.push({
        sku: p.sku,
        nombre: p.nombre,
        cantidad: p.cantidad,
        importe: dinero(p.precioCentavos * p.cantidad),
      });
    }
    return {
      lineas: lineasConImporte,
      desglose: {
        subtotal: dinero(d.subtotal),
        descuento: dinero(d.descuento),
        iva: dinero(d.iva),
        envio: dinero(d.envio),
        total: dinero(d.total),
      },
    };
  }

  /**
   * Crea el pedido con lo capturado y lo registra.
   * Lanza ErrorFormulario si falta algún dato y PedidoInvalidoError si el negocio lo rechaza.
   */
  registrar(datos) {
    const { cliente, envio, prioridad, lineas } = datos || {};
    const datosCliente = cliente || {};
    const id = String(datosCliente.id || '').trim();
    const nombre = String(datosCliente.nombre || '').trim();
    if (id === '') {
      throw new ErrorFormulario('Escribe el id del cliente (por ejemplo C005).');
    }
    if (nombre === '') {
      throw new ErrorFormulario('Escribe el nombre del cliente.');
    }
    const tipo = leerOpcion(TipoCliente, datosCliente.tipo, 'el tipo de cliente');
    const tipoEnvio = leerOpcion(TipoEnvio, envio, 'el envío');
    const prioridadPedido = leerOpcion(Prioridad, prioridad, 'la prioridad');
    const productos = this.productosDe(lineas);

    const pedido = this.armarPedido(this.almacen.siguienteId(), { id, nombre, tipo }, tipoEnvio, prioridadPedido, productos);
    this.almacen.registrar(pedido); // PedidoInvalidoError si, por ejemplo, el carrito está vacío
    return pedido;
  }

  // --- internos -----------------------------------------------------------------------

  buscarProducto(sku) {
    for (const item of this.catalogo) {
      if (item.sku === sku) {
        return item;
      }
    }
    return null;
  }

  /** Valida las líneas, suma las del mismo producto y las convierte en productos del dominio. */
  productosDe(lineas) {
    if (!Array.isArray(lineas)) {
      throw new ErrorFormulario('El carrito debe ser una lista de líneas.');
    }
    const cantidades = new Map(); // sku -> cantidad total
    for (const linea of lineas) {
      const item = this.buscarProducto(linea && linea.sku);
      if (item === null) {
        throw new ErrorFormulario('Elige un producto de la lista.');
      }
      const anterior = cantidades.get(item.sku) || 0;
      const suma = anterior + leerCantidad(linea.cantidad);
      if (!Number.isSafeInteger(suma)) {
        throw new ErrorFormulario('La cantidad total de este producto es demasiado grande.');
      }
      cantidades.set(item.sku, suma);
    }

    const productos = [];
    let subtotal = 0;
    for (const [sku, cantidad] of cantidades) {
      const producto = this.buscarProducto(sku).aProducto(cantidad);
      productos.push(producto);
      subtotal += producto.precioCentavos * producto.cantidad;
    }
    // Los importes son enteros de JavaScript: se rechaza lo que pierda precisión en los cálculos.
    if (!Number.isSafeInteger(subtotal * 100)) {
      throw new ErrorFormulario('El importe del pedido es demasiado grande.');
    }
    return productos;
  }

  armarPedido(id, datosCliente, envio, prioridad, productos) {
    return new Pedido({
      id,
      cliente: new Cliente({ id: datosCliente.id, nombre: datosCliente.nombre, tipo: datosCliente.tipo }),
      fecha: new Date(Math.floor(Date.now() / 1000) * 1000),
      productos,
      envio,
      prioridad,
      estado: EstadoPedido.PENDIENTE,
    });
  }
}

module.exports = { ControladorFormulario };
