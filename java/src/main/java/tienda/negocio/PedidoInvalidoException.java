package tienda.negocio;

/**
 * El pedido no cumple las reglas mínimas para registrarse.
 *
 * Responsable: Leonardo (Negocio y Validaciones).
 */
public class PedidoInvalidoException extends RuntimeException {

    public PedidoInvalidoException(String mensaje) {
        super(mensaje);
    }
}
