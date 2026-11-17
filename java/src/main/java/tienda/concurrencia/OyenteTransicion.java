package tienda.concurrencia;

import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;

/**
 * Observador de los cambios de estado (patrón Observer).
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 *
 * Se invoca desde el hilo de trabajo justo después de cada transición. Quien lo
 * implemente es responsable de pasar al hilo que corresponda: la interfaz gráfica
 * lo hace con SwingUtilities.invokeLater.
 */
@FunctionalInterface
public interface OyenteTransicion {

    void alCambiarEstado(Pedido pedido, EstadoPedido anterior, EstadoPedido nuevo);
}
