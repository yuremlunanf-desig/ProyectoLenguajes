package tienda.concurrencia;

/**
 * Tipos de aviso que emite el despachador.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 */
public enum TipoEvento {
    CORRIDA_INICIADA,
    PEDIDO_INICIADO,
    TRANSICION,
    PEDIDO_TERMINADO,
    CORRIDA_TERMINADA,
    CORRIDA_DETENIDA,
    ERROR
}
