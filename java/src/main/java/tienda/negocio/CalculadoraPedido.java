package tienda.negocio;

import java.math.BigDecimal;
import java.math.RoundingMode;
import tienda.modelo.Pedido;
import tienda.modelo.TipoEnvio;

/**
 * Cálculos monetarios sobre un Pedido.
 *
 * Responsable: Leonardo (Negocio y Validaciones).
 *
 * Reglas:
 * - Descuento (no acumulable): 10% si el subtotal es >= $2,000; si no, 5% si
 *   el cliente es frecuente; en otro caso no hay descuento.
 * - IVA: 16% sobre (subtotal - descuento).
 * - Envío: estándar $50, express $120 (no causa IVA).
 * - Total = subtotal - descuento + IVA + envío.
 *
 * Todo el dinero se maneja con BigDecimal y se redondea a centavos con
 * RoundingMode.HALF_UP (0.005 sube a 0.01).
 */
public final class CalculadoraPedido {

    public static final BigDecimal TASA_IVA = new BigDecimal("0.16");
    public static final BigDecimal UMBRAL_DESCUENTO_MONTO = new BigDecimal("2000.00");
    public static final BigDecimal DESCUENTO_POR_MONTO = new BigDecimal("0.10");
    public static final BigDecimal DESCUENTO_FRECUENTE = new BigDecimal("0.05");
    public static final BigDecimal ENVIO_ESTANDAR = new BigDecimal("50.00");
    public static final BigDecimal ENVIO_EXPRESS = new BigDecimal("120.00");

    private CalculadoraPedido() {
    }

    /** Redondea a dos decimales con la regla comercial (mitad hacia arriba). */
    public static BigDecimal redondear(BigDecimal monto) {
        return monto.setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal subtotal(Pedido pedido) {
        BigDecimal suma = pedido.getProductos().stream()
                .map(producto -> producto.getPrecio().multiply(BigDecimal.valueOf(producto.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return redondear(suma);
    }

    /** Los descuentos no se acumulan: gana el de monto y, si no aplica, el de frecuente. */
    public static BigDecimal tasaDescuento(Pedido pedido) {
        if (subtotal(pedido).compareTo(UMBRAL_DESCUENTO_MONTO) >= 0) {
            return DESCUENTO_POR_MONTO;
        }
        if (pedido.getCliente().esFrecuente()) {
            return DESCUENTO_FRECUENTE;
        }
        return BigDecimal.ZERO;
    }

    public static BigDecimal descuento(Pedido pedido) {
        return redondear(subtotal(pedido).multiply(tasaDescuento(pedido)));
    }

    public static BigDecimal iva(Pedido pedido) {
        BigDecimal base = subtotal(pedido).subtract(descuento(pedido));
        return redondear(base.multiply(TASA_IVA));
    }

    public static BigDecimal envio(Pedido pedido) {
        return pedido.getEnvio() == TipoEnvio.EXPRESS ? ENVIO_EXPRESS : ENVIO_ESTANDAR;
    }

    public static BigDecimal total(Pedido pedido) {
        return desglose(pedido).total();
    }

    /** Valida el pedido y devuelve todos sus importes. */
    public static Desglose desglose(Pedido pedido) {
        ValidadorPedido.validar(pedido);
        BigDecimal subtotal = subtotal(pedido);
        BigDecimal descuento = descuento(pedido);
        BigDecimal iva = iva(pedido);
        BigDecimal envio = envio(pedido);
        BigDecimal total = subtotal.subtract(descuento).add(iva).add(envio);
        return new Desglose(subtotal, descuento, iva, envio, total);
    }
}
