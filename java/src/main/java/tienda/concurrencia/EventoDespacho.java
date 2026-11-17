package tienda.concurrencia;

import tienda.modelo.EstadoPedido;

/**
 * Aviso que el despachador entrega a sus observadores (se emite desde hilos de trabajo).
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 *
 * @param trabajador número del trabajador (1..N) que atiende el pedido; 0 si no aplica
 * @param marcaMs    milisegundos desde que arrancó la corrida
 */
public record EventoDespacho(
        TipoEvento tipo,
        String pedidoId,
        int trabajador,
        EstadoPedido estadoAnterior,
        EstadoPedido estadoNuevo,
        String detalle,
        double marcaMs,
        ResumenCorrida resumen) {
}
