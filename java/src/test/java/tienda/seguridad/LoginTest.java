package tienda.seguridad;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tienda.controlador.CamposIncompletosException;
import tienda.controlador.ControladorLogin;

/**
 * Prueba del login (ServicioAutenticacion y ControladorLogin).
 *
 * Responsable: Ian (Login).
 *
 * Ejecutar desde la carpeta java/:  .\mvnw.cmd test
 */
class LoginTest {

    private static final Path RUTA_USUARIOS = Path.of("..", "datos", "usuarios.json");

    @Test
    @DisplayName("Login: acepta al usuario válido y rechaza los demás casos")
    void loginAceptaAlUsuarioValidoYRechazaLosDemasCasos() {
        ServicioAutenticacion servicio = new ServicioAutenticacion(RUTA_USUARIOS);

        assertEquals("Administrador", servicio.autenticar("admin", "1234").nombre());
        assertThrows(AutenticacionException.class, () -> servicio.autenticar("admin", "contraseña-mala"));
        assertThrows(AutenticacionException.class, () -> servicio.autenticar("nadie", "1234"));

        ControladorLogin controlador = new ControladorLogin(servicio);
        assertThrows(CamposIncompletosException.class, () -> controlador.iniciarSesion("", "")); // campos vacíos
    }
}
