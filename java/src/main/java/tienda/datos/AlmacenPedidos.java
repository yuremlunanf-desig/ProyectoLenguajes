package tienda.datos;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import tienda.modelo.Pedido;
import tienda.negocio.CalculadoraPedido;
import tienda.negocio.Desglose;
import tienda.negocio.PedidoInvalidoException;

/**
 * Estado de los pedidos que muestra la interfaz gráfica.
 *
 * Responsable: Leonardo (Dashboard).
 *
 * El almacén es el «modelo vivo» del MVC: arranca con los pedidos del JSON de
 * solicitudes y recibe los que se capturan en el formulario. No calcula nada por
 * su cuenta: valida y calcula con CalculadoraPedido y lee con LectorJson, las
 * mismas piezas que usa Main.
 *
 * Se modifica solo desde el hilo de eventos de Swing; los hilos del despachador
 * únicamente cambian el estado (volátil) de cada Pedido.
 */
public final class AlmacenPedidos {

    private final Path ruta;
    private List<Pedido> pedidos = new ArrayList<>();
    private Map<String, Desglose> desgloses = new LinkedHashMap<>();
    private List<String> rechazos = new ArrayList<>();
    private List<String> idsRechazados = new ArrayList<>();

    public AlmacenPedidos(Path rutaSolicitudes) {
        this.ruta = rutaSolicitudes;
    }

    /**
     * Reemplaza el contenido por los pedidos del JSON y devuelve los motivos de rechazo.
     * Si el archivo no se puede leer lanza la excepción y el estado anterior queda intacto.
     */
    public List<String> cargar() throws IOException {
        List<Pedido> leidos = LectorJson.leerPedidos(ruta);
        pedidos = new ArrayList<>();
        desgloses = new LinkedHashMap<>();
        rechazos = new ArrayList<>();
        idsRechazados = new ArrayList<>();
        for (Pedido pedido : leidos) {
            try {
                registrar(pedido);
            } catch (PedidoInvalidoException error) {
                rechazos.add(error.getMessage());
                idsRechazados.add(pedido.getId());
            }
        }
        return List.copyOf(rechazos);
    }

    /** Valida el pedido, calcula sus importes y lo guarda. Lanza PedidoInvalidoException si no cumple. */
    public Desglose registrar(Pedido pedido) {
        if (desgloses.containsKey(pedido.getId())) {
            throw new PedidoInvalidoException("Ya existe un pedido con el id " + pedido.getId() + ".");
        }
        Desglose desglose = CalculadoraPedido.desglose(pedido);
        pedidos.add(pedido);
        desgloses.put(pedido.getId(), desglose);
        return desglose;
    }

    /** Copia de la lista: quien la recibe puede ordenarla o recorrerla sin afectar al almacén. */
    public List<Pedido> pedidos() {
        return List.copyOf(pedidos);
    }

    public List<String> rechazos() {
        return List.copyOf(rechazos);
    }

    public Desglose desglose(String pedidoId) {
        return desgloses.get(pedidoId);
    }

    public List<Desglose> desgloses() {
        List<Desglose> lista = new ArrayList<>();
        for (Pedido pedido : pedidos) {
            lista.add(desgloses.get(pedido.getId()));
        }
        return lista;
    }

    /** PED-006 si el mayor numerado es PED-005. Cuenta también los rechazados, para no reciclar su id. */
    public String siguienteId() {
        int mayor = 0;
        List<String> usados = new ArrayList<>(idsRechazados);
        for (Pedido pedido : pedidos) {
            usados.add(pedido.getId());
        }
        for (String id : usados) {
            if (id.startsWith("PED-") && id.substring(4).matches("\\d+")) {
                mayor = Math.max(mayor, Integer.parseInt(id.substring(4)));
            }
        }
        return String.format("PED-%03d", mayor + 1);
    }
}
