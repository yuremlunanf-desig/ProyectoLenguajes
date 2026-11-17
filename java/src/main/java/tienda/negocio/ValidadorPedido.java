package tienda.negocio;

import tienda.modelo.Pedido;

/**
 * Validaciones estrictas: lanza PedidoInvalidoException si el pedido no es válido.
 *
 * Responsable: Leonardo (Negocio y Validaciones).
 */
public final class ValidadorPedido {

    private ValidadorPedido() {
    }

    public static void validar(Pedido pedido) {
        if (pedido.getProductos().isEmpty()) {
            throw new PedidoInvalidoException("El pedido " + pedido.getId() + " no tiene productos.");
        }
        pedido.getProductos().stream()
                .filter(producto -> producto.getCantidad() <= 0)
                .findFirst()
                .ifPresent(producto -> {
                    throw new PedidoInvalidoException(
                            "El pedido " + pedido.getId() + " tiene una cantidad inválida ("
                                    + producto.getCantidad() + ") en el producto " + producto.getSku()
                                    + ": debe ser un entero mayor que 0.");
                });
    }
}
