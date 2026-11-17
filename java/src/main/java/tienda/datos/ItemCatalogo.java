package tienda.datos;

import java.math.BigDecimal;
import java.util.Locale;
import tienda.modelo.Producto;

/**
 * Producto del catálogo, sin cantidad. Al agregarlo al carrito se convierte en un
 * {@link Producto} del dominio con la cantidad elegida, así el modelo no cambia.
 *
 * Responsable: Edsson (Formularios).
 */
public record ItemCatalogo(String sku, String nombre, BigDecimal precio) {

    /** Texto para el selector: «TEC-101 · Teclado mecánico ($899.50)». */
    public String etiqueta() {
        return String.format(Locale.US, "%s · %s ($%,.2f)", sku, nombre, precio);
    }

    public Producto aProducto(int cantidad) {
        return new Producto(sku, nombre, precio, cantidad);
    }
}
