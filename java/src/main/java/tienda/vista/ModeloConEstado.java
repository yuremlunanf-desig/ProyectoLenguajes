package tienda.vista;

import tienda.modelo.EstadoPedido;

/**
 * Modelo de tabla cuyas filas se colorean según el estado del pedido.
 *
 * Responsable: Leonardo (Dashboard).
 */
interface ModeloConEstado {

    EstadoPedido estadoDe(int fila);

    /** true si la fila se resalta en negritas (por ejemplo, el pedido que un trabajador está atendiendo). */
    boolean destacada(int fila);
}
