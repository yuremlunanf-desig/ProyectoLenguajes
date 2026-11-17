package tienda.controlador;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import tienda.datos.AlmacenPedidos;
import tienda.datos.ItemCatalogo;
import tienda.modelo.Cliente;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;
import tienda.modelo.Prioridad;
import tienda.modelo.Producto;
import tienda.modelo.TipoCliente;
import tienda.modelo.TipoEnvio;
import tienda.negocio.CalculadoraPedido;
import tienda.negocio.Desglose;
import tienda.negocio.ValidadorPedido;

/**
 * Controlador del formulario de captura: carrito y registro de pedidos nuevos.
 *
 * Responsable: Edsson (Formularios).
 *
 * Las reglas de negocio no se repiten aquí. Una cantidad <= 0 o un carrito vacío los rechaza
 * ValidadorPedido (vía CalculadoraPedido) con PedidoInvalidoException; este controlador solo agrega
 * los errores propios del formulario (campos vacíos, texto que no es un número) con
 * ErrorFormularioException.
 */
public final class ControladorFormulario {

    public record LineaCarrito(ItemCatalogo item, int cantidad) {
        public BigDecimal importe() {
            return item.precio().multiply(BigDecimal.valueOf(cantidad));
        }
    }

    private final AlmacenPedidos almacen;
    private final List<ItemCatalogo> catalogo;
    private final List<LineaCarrito> carrito = new ArrayList<>();

    public ControladorFormulario(AlmacenPedidos almacen, List<ItemCatalogo> catalogo) {
        this.almacen = almacen;
        this.catalogo = catalogo;
    }

    /** Textos del selector de productos. */
    public List<String> opcionesProducto() {
        List<String> opciones = new ArrayList<>();
        for (ItemCatalogo item : catalogo) {
            opciones.add(item.etiqueta());
        }
        return opciones;
    }

    public List<LineaCarrito> carrito() {
        return List.copyOf(carrito);
    }

    // --- carrito -------------------------------------------------------------------------

    /** Agrega un producto (o suma a su línea si ya estaba). Lanza ErrorFormularioException o PedidoInvalidoException. */
    public void agregarAlCarrito(String etiquetaProducto, String cantidadTexto) {
        ItemCatalogo item = buscarProducto(etiquetaProducto);
        if (item == null) {
            throw new ErrorFormularioException("Elige un producto de la lista.");
        }
        int cantidad = leerCantidad(cantidadTexto);

        // Si el producto ya estaba en el carrito, se suma a su línea.
        int posicion = posicionEnCarrito(item);
        long total = cantidad;
        if (posicion >= 0) {
            total = total + carrito.get(posicion).cantidad();
        }
        if (total > Integer.MAX_VALUE) {
            throw new ErrorFormularioException("La cantidad total de este producto es demasiado grande.");
        }

        LineaCarrito nueva = new LineaCarrito(item, (int) total);
        validarLinea(nueva);
        if (posicion >= 0) {
            carrito.set(posicion, nueva);
        } else {
            carrito.add(nueva);
        }
    }

    public void quitarDelCarrito(int indice) {
        if (indice < 0 || indice >= carrito.size()) {
            throw new ErrorFormularioException("Selecciona la línea del carrito que quieres quitar.");
        }
        carrito.remove(indice);
    }

    public void vaciarCarrito() {
        carrito.clear();
    }

    /** Importes del carrito actual con las mismas reglas que el pedido final (null si el carrito está vacío). */
    public Desglose vistaPrevia(TipoCliente tipo, TipoEnvio envio) {
        if (carrito.isEmpty()) {
            return null;
        }
        Pedido borrador = armarPedido("NUEVO", "", "", tipo, envio, Prioridad.MEDIA);
        return CalculadoraPedido.desglose(borrador);
    }

    // --- registro ------------------------------------------------------------------------

    /**
     * Crea el pedido con lo capturado, lo registra y vacía el carrito.
     * Lanza ErrorFormularioException si falta algún dato y PedidoInvalidoException si el negocio lo rechaza.
     */
    public Pedido registrar(String clienteId, String clienteNombre, TipoCliente tipo, TipoEnvio envio,
                            Prioridad prioridad) {
        String id = clienteId.strip();
        String nombre = clienteNombre.strip();
        if (id.isEmpty()) {
            throw new ErrorFormularioException("Escribe el id del cliente (por ejemplo C005).");
        }
        if (nombre.isEmpty()) {
            throw new ErrorFormularioException("Escribe el nombre del cliente.");
        }
        Pedido pedido = armarPedido(almacen.siguienteId(), id, nombre, tipo, envio, prioridad);
        almacen.registrar(pedido); // PedidoInvalidoException si, por ejemplo, el carrito está vacío
        carrito.clear();
        return pedido;
    }

    // --- internos ------------------------------------------------------------------------

    private ItemCatalogo buscarProducto(String etiqueta) {
        for (ItemCatalogo item : catalogo) {
            if (item.etiqueta().equals(etiqueta)) {
                return item;
            }
        }
        return null;
    }

    private int posicionEnCarrito(ItemCatalogo item) {
        for (int i = 0; i < carrito.size(); i++) {
            if (carrito.get(i).item().sku().equals(item.sku())) {
                return i;
            }
        }
        return -1;
    }

    private static int leerCantidad(String texto) {
        String limpio = texto.strip();
        try {
            return Integer.parseInt(limpio);
        } catch (NumberFormatException error) {
            if (limpio.matches("[+-]?\\d+")) {
                throw new ErrorFormularioException("La cantidad «" + limpio + "» es demasiado grande.");
            }
            throw new ErrorFormularioException(
                    "La cantidad «" + limpio + "» no es un número entero. Escribe, por ejemplo, 2.");
        }
    }

    /** Pasa la línea por ValidadorPedido para no repetir la regla de cantidad > 0. */
    private static void validarLinea(LineaCarrito linea) {
        List<Producto> productos = List.of(linea.item().aProducto(linea.cantidad()));
        Pedido prueba = new Pedido("NUEVO", new Cliente("", "", TipoCliente.REGULAR), LocalDateTime.now(),
                productos, TipoEnvio.ESTANDAR, Prioridad.MEDIA, EstadoPedido.PENDIENTE);
        ValidadorPedido.validar(prueba);
    }

    private Pedido armarPedido(String pedidoId, String clienteId, String clienteNombre, TipoCliente tipo,
                               TipoEnvio envio, Prioridad prioridad) {
        List<Producto> productos = new ArrayList<>();
        for (LineaCarrito linea : carrito) {
            productos.add(linea.item().aProducto(linea.cantidad()));
        }
        return new Pedido(
                pedidoId,
                new Cliente(clienteId, clienteNombre, tipo),
                LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS),
                productos,
                envio,
                prioridad,
                EstadoPedido.PENDIENTE);
    }
}
