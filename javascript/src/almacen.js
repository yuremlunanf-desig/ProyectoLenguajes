'use strict';

/**
 * Estado de los pedidos que muestra la interfaz web.
 *
 * Responsable: Leonardo (Dashboard).
 *
 * El almacén es el «modelo vivo» del MVC: arranca con los pedidos del JSON de solicitudes y recibe los
 * que se capturan en el formulario. No calcula nada por su cuenta: valida y calcula con
 * CalculadoraPedido y lee con leerPedidos, las mismas piezas que usa index.js.
 */

const { leerPedidos } = require('./lectorJson');
const { CalculadoraPedido, PedidoInvalidoError } = require('./negocio');

class AlmacenPedidos {
  constructor(rutaSolicitudes) {
    this.ruta = rutaSolicitudes;
    this._pedidos = [];
    this._desgloses = new Map(); // id del pedido -> importes calculados
    this._rechazos = [];
    this._idsRechazados = [];
  }

  /**
   * Reemplaza el contenido por los pedidos del JSON y devuelve los motivos de rechazo.
   * Si el archivo no se puede leer lanza el error y el estado anterior queda intacto.
   */
  async cargar() {
    const leidos = await leerPedidos(this.ruta);
    this._pedidos = [];
    this._desgloses = new Map();
    this._rechazos = [];
    this._idsRechazados = [];
    for (const pedido of leidos) {
      try {
        this.registrar(pedido);
      } catch (error) {
        if (!(error instanceof PedidoInvalidoError)) {
          throw error;
        }
        this._rechazos.push(error.message);
        this._idsRechazados.push(pedido.id);
      }
    }
    return [...this._rechazos];
  }

  /** Valida el pedido, calcula sus importes y lo guarda. Lanza PedidoInvalidoError si no cumple. */
  registrar(pedido) {
    if (this._desgloses.has(pedido.id)) {
      throw new PedidoInvalidoError(`Ya existe un pedido con el id ${pedido.id}.`);
    }
    const desglose = CalculadoraPedido.desglose(pedido);
    this._pedidos.push(pedido);
    this._desgloses.set(pedido.id, desglose);
    return desglose;
  }

  /** Copia de la lista: quien la recibe puede ordenarla o recorrerla sin afectar al almacén. */
  get pedidos() {
    return [...this._pedidos];
  }

  get rechazos() {
    return [...this._rechazos];
  }

  desglose(pedidoId) {
    return this._desgloses.get(pedidoId);
  }

  desgloses() {
    const lista = [];
    for (const pedido of this._pedidos) {
      lista.push(this._desgloses.get(pedido.id));
    }
    return lista;
  }

  /** PED-006 si el mayor numerado es PED-005. Cuenta también los rechazados, para no reciclar su id. */
  siguienteId() {
    const usados = this._idsRechazados.concat(this._pedidos.map((p) => p.id));
    let mayor = 0;
    for (const id of usados) {
      const coincidencia = /^PED-(\d+)$/.exec(id);
      if (coincidencia) {
        mayor = Math.max(mayor, Number(coincidencia[1]));
      }
    }
    return `PED-${String(mayor + 1).padStart(3, '0')}`;
  }
}

module.exports = { AlmacenPedidos };
