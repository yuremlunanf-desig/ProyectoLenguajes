package tienda.negocio;

import java.math.BigDecimal;

/**
 * Importes de un pedido, ya redondeados a centavos.
 *
 * Responsable: Leonardo (Negocio y Validaciones).
 */
public record Desglose(
        BigDecimal subtotal,
        BigDecimal descuento,
        BigDecimal iva,
        BigDecimal envio,
        BigDecimal total) {
}
