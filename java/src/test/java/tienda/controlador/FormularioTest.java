package tienda.controlador;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tienda.datos.AlmacenPedidos;
import tienda.datos.Catalogo;
import tienda.modelo.Pedido;
import tienda.modelo.Prioridad;
import tienda.modelo.TipoCliente;
import tienda.modelo.TipoEnvio;
import tienda.negocio.PedidoInvalidoException;

/**
 * Prueba del formulario de pedidos (carrito y registro).
 *
 * Responsable: Edsson (Formularios).
 *
 * Ejecutar desde la carpeta java/:  .\mvnw.cmd test
 */
class FormularioTest {

    private static final Path DATOS = Path.of("..", "datos");
    private static final String TECLADO = "TEC-101 · Teclado mecánico ($899.50)";

    @Test
    @DisplayName("Formulario: valida la captura y registra un pedido nuevo")
    void formularioValidaLaCapturaYRegistraUnPedidoNuevo() throws IOException {
        AlmacenPedidos almacen = new AlmacenPedidos(DATOS.resolve("solicitudes_pequenas.json"));
        almacen.cargar();
        ControladorFormulario formulario =
                new ControladorFormulario(almacen, Catalogo.leer(DATOS.resolve("catalogo.json")));
        assertEquals(4, almacen.pedidos().size()); // el quinto pedido del archivo se rechaza (cantidad 0)

        // Una cantidad que no es número, y una cantidad 0 (la rechaza la regla de negocio).
        assertThrows(ErrorFormularioException.class, () -> formulario.agregarAlCarrito(TECLADO, "abc"));
        assertThrows(PedidoInvalidoException.class, () -> formulario.agregarAlCarrito(TECLADO, "0"));

        formulario.agregarAlCarrito(TECLADO, "1");
        formulario.agregarAlCarrito(TECLADO, "1"); // el mismo producto se suma: 2 teclados
        Pedido pedido = formulario.registrar("C005", "Marta Ruiz", TipoCliente.REGULAR, TipoEnvio.ESTANDAR,
                Prioridad.MEDIA);

        // 2 × 899.50 = 1,799.00 (sin descuento) + IVA 287.84 + envío estándar 50.00
        assertEquals("PED-006", pedido.getId());
        assertEquals(new BigDecimal("2136.84"), almacen.desglose("PED-006").total());
        assertEquals(5, almacen.pedidos().size());
    }
}
