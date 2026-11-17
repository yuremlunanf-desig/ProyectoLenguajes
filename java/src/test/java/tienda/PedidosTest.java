package tienda;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tienda.datos.LectorJson;
import tienda.funcional.ConsultasPedidos;
import tienda.modelo.Cliente;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;
import tienda.modelo.Prioridad;
import tienda.modelo.Producto;
import tienda.modelo.TipoCliente;
import tienda.modelo.TipoEnvio;
import tienda.negocio.CalculadoraPedido;
import tienda.negocio.Desglose;
import tienda.negocio.PedidoInvalidoException;
import tienda.negocio.ValidadorPedido;

/**
 * Pruebas automatizadas con JUnit 5 (5 casos).
 *
 * Responsable: Yurem (Funcional y Testing).
 *
 * Ejecutar desde la carpeta java/:  mvn test
 */
class PedidosTest {

    private static final Path RUTA_JSON = Path.of("..", "datos", "solicitudes_pequenas.json");

    private static Producto producto(String precio, int cantidad) {
        return new Producto("SKU-" + precio, "Producto de prueba", new BigDecimal(precio), cantidad);
    }

    private static Pedido crearPedido(TipoCliente tipo, TipoEnvio envio, Producto... productos) {
        return new Pedido(
                "PRUEBA-1",
                new Cliente("C999", "Cliente de prueba", tipo),
                LocalDateTime.of(2026, 11, 1, 10, 0),
                List.of(productos),
                envio,
                Prioridad.MEDIA,
                EstadoPedido.PENDIENTE);
    }

    @Test
    @DisplayName("Descuento del 10% por monto, con IVA y envío estándar")
    void descuentoDel10PorMontoConIvaYEnvioEstandar() {
        Pedido pedido = crearPedido(TipoCliente.REGULAR, TipoEnvio.ESTANDAR,
                producto("899.50", 2), producto("349.90", 1));

        Desglose esperado = new Desglose(
                new BigDecimal("2148.90"),
                new BigDecimal("214.89"),
                new BigDecimal("309.44"),
                new BigDecimal("50.00"),
                new BigDecimal("2293.45"));
        assertEquals(esperado, CalculadoraPedido.desglose(pedido));
    }

    @Test
    @DisplayName("Descuento frecuente del 5% y no acumulable con el de monto")
    void descuentoFrecuenteDel5YNoAcumulable() {
        Desglose chico = CalculadoraPedido.desglose(crearPedido(
                TipoCliente.FRECUENTE, TipoEnvio.EXPRESS, producto("615.33", 1), producto("89.99", 3)));
        // 5% de 885.30 = 44.265: con HALF_UP sube a 44.27.
        assertEquals(new BigDecimal("44.27"), chico.descuento());
        assertEquals(new BigDecimal("1095.59"), chico.total());

        Desglose grande = CalculadoraPedido.desglose(crearPedido(
                TipoCliente.FRECUENTE, TipoEnvio.EXPRESS, producto("3299.00", 1), producto("450.50", 1)));
        // Solo el 10% por monto, no 10% + 5%.
        assertEquals(new BigDecimal("374.95"), grande.descuento());
        assertEquals(new BigDecimal("4034.48"), grande.total());
    }

    @Test
    @DisplayName("Cantidad cero o negativa lanza excepción")
    void cantidadCeroONegativaLanzaExcepcion() {
        for (int cantidad : new int[] {0, -3}) {
            Pedido pedido = crearPedido(TipoCliente.REGULAR, TipoEnvio.ESTANDAR,
                    producto("100.00", 1), producto("50.00", cantidad));

            PedidoInvalidoException error = assertThrows(
                    PedidoInvalidoException.class, () -> ValidadorPedido.validar(pedido));
            assertTrue(error.getMessage().contains("cantidad inválida"));
            assertThrows(PedidoInvalidoException.class, () -> CalculadoraPedido.desglose(pedido));
        }
    }

    @Test
    @DisplayName("Pedido sin productos lanza excepción")
    void pedidoSinProductosLanzaExcepcion() {
        Pedido pedido = crearPedido(TipoCliente.REGULAR, TipoEnvio.ESTANDAR);

        PedidoInvalidoException error = assertThrows(
                PedidoInvalidoException.class, () -> ValidadorPedido.validar(pedido));
        assertTrue(error.getMessage().contains("no tiene productos"));
        assertThrows(PedidoInvalidoException.class, () -> CalculadoraPedido.desglose(pedido));
    }

    @Test
    @DisplayName("Consultas funcionales sobre el JSON de prueba")
    void consultasFuncionalesSobreElJsonDePrueba() throws IOException {
        List<Pedido> pedidos = LectorJson.leerPedidos(RUTA_JSON);

        assertEquals(5, pedidos.size());
        assertEquals(List.of("PED-001", "PED-004"),
                ConsultasPedidos.ids(ConsultasPedidos.buscarPorCliente(pedidos, "C001")));
        assertEquals(List.of("PED-003"),
                ConsultasPedidos.ids(ConsultasPedidos.buscarPorCliente(pedidos, "sofía")));
        assertEquals(List.of("PED-001", "PED-002", "PED-005"),
                ConsultasPedidos.ids(ConsultasPedidos.filtrarPorEstado(pedidos, EstadoPedido.PENDIENTE)));
        assertEquals(List.of("PED-002", "PED-004", "PED-001", "PED-005", "PED-003"),
                ConsultasPedidos.ids(ConsultasPedidos.ordenarPorFecha(pedidos, false)));
        assertEquals(List.of("PED-002", "PED-003", "PED-001", "PED-005", "PED-004"),
                ConsultasPedidos.ids(ConsultasPedidos.ordenarPorPrioridad(pedidos)));
        // Las consultas no modifican la lista original.
        assertEquals(List.of("PED-001", "PED-002", "PED-003", "PED-004", "PED-005"),
                ConsultasPedidos.ids(pedidos));
    }
}
