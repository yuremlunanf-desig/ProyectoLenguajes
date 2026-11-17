package tienda.controlador;

/**
 * Un parámetro de la corrida es inválido o no se puede iniciar. El mensaje se muestra tal cual.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 */
public class ErrorConcurrenciaException extends RuntimeException {

    public ErrorConcurrenciaException(String mensaje) {
        super(mensaje);
    }
}
