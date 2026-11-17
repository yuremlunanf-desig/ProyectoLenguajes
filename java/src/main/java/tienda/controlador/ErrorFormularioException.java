package tienda.controlador;

/**
 * Un dato del formulario falta o no tiene el formato esperado. El mensaje se muestra tal cual.
 *
 * Responsable: Edsson (Formularios).
 */
public class ErrorFormularioException extends RuntimeException {

    public ErrorFormularioException(String mensaje) {
        super(mensaje);
    }
}
