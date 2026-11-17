package tienda.concurrencia;

import java.util.List;
import tienda.modelo.EstadoPedido;

/**
 * Resultado de llevar un pedido por su flujo de estados.
 *
 * Responsable: Edsson (Concurrencia y Main).
 */
public record ResultadoProcesamiento(
        String pedidoId,
        EstadoPedido estadoInicial,
        EstadoPedido estadoFinal,
        List<String> transiciones,
        double duracionMs) {
}
