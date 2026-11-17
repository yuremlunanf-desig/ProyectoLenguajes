package tienda.modelo;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Pedido de la tienda. Solo guarda datos: los cálculos y las validaciones
 * viven en el paquete tienda.negocio.
 *
 * Responsable: Ian (Modelos y Datos).
 */
public class Pedido {

    private final String id;
    private final Cliente cliente;
    private final LocalDateTime fecha;
    private final List<Producto> productos;
    private final TipoEnvio envio;
    private final Prioridad prioridad;

    // volatile: el estado lo cambian hilos de trabajo y lo lee el hilo principal.
    private volatile EstadoPedido estado;

    public Pedido(String id, Cliente cliente, LocalDateTime fecha, List<Producto> productos,
                  TipoEnvio envio, Prioridad prioridad, EstadoPedido estado) {
        this.id = id;
        this.cliente = cliente;
        this.fecha = fecha;
        this.productos = List.copyOf(productos);
        this.envio = envio;
        this.prioridad = prioridad;
        this.estado = estado;
    }

    public String getId() {
        return id;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public List<Producto> getProductos() {
        return productos;
    }

    public TipoEnvio getEnvio() {
        return envio;
    }

    public Prioridad getPrioridad() {
        return prioridad;
    }

    public EstadoPedido getEstado() {
        return estado;
    }

    public void cambiarEstado(EstadoPedido nuevo) {
        this.estado = nuevo;
    }

    @Override
    public String toString() {
        return id + " [" + estado + ", " + prioridad + ", " + fecha + "] " + cliente.getNombre();
    }
}
