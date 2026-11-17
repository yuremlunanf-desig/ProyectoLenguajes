package tienda.controlador;

import tienda.seguridad.AutenticacionException;
import tienda.seguridad.ServicioAutenticacion;
import tienda.seguridad.Usuario;

/**
 * Controlador del login.
 *
 * Responsable: Ian (Login).
 */
public final class ControladorLogin {

    private final ServicioAutenticacion servicio;

    public ControladorLogin(ServicioAutenticacion servicio) {
        this.servicio = servicio;
    }

    /** Devuelve el usuario autenticado o lanza una AutenticacionException con el motivo. */
    public Usuario iniciarSesion(String usuario, String contrasena) throws AutenticacionException {
        if (usuario == null || usuario.isBlank() || contrasena == null || contrasena.isEmpty()) {
            throw new CamposIncompletosException("Escribe tu usuario y tu contraseña.");
        }
        return servicio.autenticar(usuario, contrasena);
    }
}
