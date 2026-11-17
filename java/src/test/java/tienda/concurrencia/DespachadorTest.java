package tienda.concurrencia;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tienda.datos.AlmacenPedidos;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;

/**
 * Prueba de la concurrencia: el despachador atiende la cola con varios hilos.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 *
 * Ejecutar desde la carpeta java/:  .\mvnw.cmd test
 */
class DespachadorTest {

    private static final Path RUTA_JSON = Path.of("..", "datos", "solicitudes_pequenas.json");

    @Test
    @DisplayName("Despachador: lleva todos los pedidos a ENTREGADO empezando por la prioridad alta")
    void despachadorLlevaTodosLosPedidosAEntregadoEmpezandoPorLaPrioridadAlta() throws IOException {
        AlmacenPedidos almacen = new AlmacenPedidos(RUTA_JSON);
        almacen.cargar();
        Despachador despachador = new Despachador();
        List<EventoDespacho> eventos = Collections.synchronizedList(new ArrayList<>());
        despachador.agregarOyente(eventos::add);

        despachador.iniciar(almacen.pedidos(), 20, 2);
        despachador.esperar(10_000);

        for (Pedido pedido : almacen.pedidos()) {
            assertEquals(EstadoPedido.ENTREGADO, pedido.getEstado());
        }
        String primerPedido = "";
        for (EventoDespacho evento : eventos) {
            if (evento.tipo() == TipoEvento.PEDIDO_INICIADO && primerPedido.isEmpty()) {
                primerPedido = evento.pedidoId();
            }
        }
        assertEquals("PED-002", primerPedido); // el único con prioridad alta y estado pendiente
        assertEquals(TipoEvento.CORRIDA_TERMINADA, eventos.get(eventos.size() - 1).tipo());
        assertFalse(despachador.enEjecucion());
    }
}
