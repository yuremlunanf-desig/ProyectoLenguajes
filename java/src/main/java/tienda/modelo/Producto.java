package tienda.modelo;

import java.math.BigDecimal;

/**
 * Línea de un pedido: un artículo, su precio unitario y la cantidad pedida.
 *
 * Responsable: Ian (Modelos y Datos).
 */
public final class Producto {

    private final String sku;
    private final String nombre;
    private final BigDecimal precio;
    private final int cantidad;

    public Producto(String sku, String nombre, BigDecimal precio, int cantidad) {
        this.sku = sku;
        this.nombre = nombre;
        this.precio = precio;
        this.cantidad = cantidad;
    }

    public String getSku() {
        return sku;
    }

    public String getNombre() {
        return nombre;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public int getCantidad() {
        return cantidad;
    }

    @Override
    public String toString() {
        return cantidad + " x " + nombre + " ($" + precio + ")";
    }
}
