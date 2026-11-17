package tienda.controlador;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import tienda.datos.AlmacenPedidos;
import tienda.funcional.ConsultasPedidos;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;
import tienda.modelo.Producto;
import tienda.negocio.Desglose;

/**
 * Controlador del dashboard: consultas y resumen de los pedidos para la tabla.
 *
 * Responsable: Leonardo (Dashboard).
 *
 * Las consultas reutilizan ConsultasPedidos (streams y lambdas): aquí solo se
 * combinan y se les da formato de texto para la tabla.
 */
public final class ControladorDashboard {

    public static final List<String> COLUMNAS = List.of(
            "ID", "Cliente", "Fecha", "Prioridad", "Envío",
            "Subtotal", "Descuento", "IVA", "Total", "Estado");
    public static final String TODOS = "Todos";
    public static final String ORDEN_FECHA = "Fecha";
    public static final String ORDEN_PRIORIDAD = "Prioridad";
    public static final String ORDEN_ID = "ID";
    public static final List<String> ORDENES = List.of(ORDEN_FECHA, ORDEN_PRIORIDAD, ORDEN_ID);
    public static final List<String> FILTROS_ESTADO = filtrosDeEstado();

    private static final DateTimeFormatter FORMATO_TABLA = DateTimeFormatter.ofPattern("dd/MM HH:mm");
    private static final DateTimeFormatter FORMATO_DETALLE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /** Una fila de la tabla: valores ya formateados, en el orden de COLUMNAS, y el estado para colorearla. */
    public record FilaPedido(String id, EstadoPedido estado, List<String> valores) {
    }

    public record ResumenPedidos(
            int totalPedidos, Map<EstadoPedido, Long> porEstado, BigDecimal totalVendido, int rechazados) {
    }

    private final AlmacenPedidos almacen;

    public ControladorDashboard(AlmacenPedidos almacen) {
        this.almacen = almacen;
    }

    public List<FilaPedido> consultar(String textoCliente, String estado, String orden) {
        List<Pedido> pedidos = almacen.pedidos();
        if (textoCliente != null && !textoCliente.isBlank()) {
            pedidos = ConsultasPedidos.buscarPorCliente(pedidos, textoCliente);
        }
        EstadoPedido filtro = Etiquetas.estadoDesdeTexto(estado);
        if (!TODOS.equals(estado) && filtro != null) {
            pedidos = ConsultasPedidos.filtrarPorEstado(pedidos, filtro);
        }
        if (ORDEN_PRIORIDAD.equals(orden)) {
            pedidos = ConsultasPedidos.ordenarPorPrioridad(pedidos);
        } else if (ORDEN_ID.equals(orden)) {
            List<Pedido> copia = new ArrayList<>(pedidos);
            copia.sort(Comparator.comparing(Pedido::getId));
            pedidos = copia;
        } else {
            pedidos = ConsultasPedidos.ordenarPorFecha(pedidos, false);
        }

        List<FilaPedido> filas = new ArrayList<>();
        for (Pedido pedido : pedidos) {
            filas.add(fila(pedido));
        }
        return filas;
    }

    public ResumenPedidos resumen() {
        List<Pedido> pedidos = almacen.pedidos();
        Map<EstadoPedido, Long> conteo = new EnumMap<>(EstadoPedido.class);
        Map<EstadoPedido, Long> agrupado = ConsultasPedidos.contarPorEstado(pedidos);
        for (EstadoPedido estado : EstadoPedido.values()) {
            conteo.put(estado, agrupado.getOrDefault(estado, 0L));
        }
        return new ResumenPedidos(
                pedidos.size(),
                conteo,
                ConsultasPedidos.sumarImportes(almacen.desgloses(), Desglose::total),
                almacen.rechazos().size());
    }

    public List<String> rechazos() {
        return almacen.rechazos();
    }

    /** Vuelve a los pedidos del JSON de solicitudes. Devuelve los motivos de rechazo. */
    public List<String> recargar() throws IOException {
        return almacen.cargar();
    }

    /** Texto con el desglose completo de un pedido (lo muestra la vista al hacer doble clic). */
    public String detalle(String pedidoId) {
        Pedido pedido = null;
        for (Pedido p : almacen.pedidos()) {
            if (p.getId().equals(pedidoId)) {
                pedido = p;
            }
        }
        if (pedido == null) {
            throw new NoSuchElementException("No existe el pedido " + pedidoId);
        }
        Desglose d = almacen.desglose(pedidoId);
        List<String> lineas = new ArrayList<>();
        lineas.add("Pedido " + pedido.getId() + " · " + Etiquetas.estado(pedido.getEstado()));
        lineas.add("Cliente: " + pedido.getCliente().getNombre()
                + " (" + Etiquetas.tipoCliente(pedido.getCliente().getTipo()) + ")");
        lineas.add("Fecha: " + pedido.getFecha().format(FORMATO_DETALLE));
        lineas.add("");
        lineas.add("Productos:");
        for (Producto p : pedido.getProductos()) {
            lineas.add("  " + p.getCantidad() + " × " + p.getNombre() + " — " + Etiquetas.dinero(p.getPrecio()) + " c/u");
        }
        lineas.add("");
        lineas.add("Subtotal:   " + Etiquetas.dinero(d.subtotal()));
        lineas.add("Descuento: -" + Etiquetas.dinero(d.descuento()));
        lineas.add("IVA (16%):  " + Etiquetas.dinero(d.iva()));
        lineas.add("Envío " + Etiquetas.envio(pedido.getEnvio()).toLowerCase() + ": " + Etiquetas.dinero(d.envio()));
        lineas.add("TOTAL:      " + Etiquetas.dinero(d.total()));
        return String.join("\n", lineas);
    }

    private FilaPedido fila(Pedido pedido) {
        Desglose d = almacen.desglose(pedido.getId());
        return new FilaPedido(pedido.getId(), pedido.getEstado(), List.of(
                pedido.getId(),
                pedido.getCliente().getNombre(),
                pedido.getFecha().format(FORMATO_TABLA),
                Etiquetas.prioridad(pedido.getPrioridad()),
                Etiquetas.envio(pedido.getEnvio()),
                Etiquetas.dinero(d.subtotal()),
                Etiquetas.dinero(d.descuento()),
                Etiquetas.dinero(d.iva()),
                Etiquetas.dinero(d.total()),
                Etiquetas.estado(pedido.getEstado())));
    }

    private static List<String> filtrosDeEstado() {
        List<String> filtros = new ArrayList<>();
        filtros.add(TODOS);
        for (EstadoPedido estado : EstadoPedido.values()) {
            filtros.add(Etiquetas.estado(estado));
        }
        return List.copyOf(filtros);
    }
}
