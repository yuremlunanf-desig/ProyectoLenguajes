package tienda.seguridad;

/**
 * No se puede entrar, o el archivo de usuarios no se puede leer. El mensaje se muestra tal cual.
 *
 * Responsable: Ian (Login).
 */
public class AutenticacionException extends RuntimeException {

    public AutenticacionException(String mensaje) {
        super(mensaje);
    }
}
