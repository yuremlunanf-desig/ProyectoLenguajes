package tienda.controlador;

import tienda.seguridad.AutenticacionException;

/**
 * Falta el usuario o la contraseña: no se llega a consultar el archivo de usuarios.
 *
 * Responsable: Ian (Login).
 */
public class CamposIncompletosException extends AutenticacionException {

    public CamposIncompletosException(String mensaje) {
        super(mensaje);
    }
}
