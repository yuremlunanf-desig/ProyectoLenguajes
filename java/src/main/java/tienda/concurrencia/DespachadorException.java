package tienda.concurrencia;

/**
 * No se pudo iniciar la corrida (ya hay una en curso o no hay nada que procesar).
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 */
public class DespachadorException extends RuntimeException {

    public DespachadorException(String mensaje) {
        super(mensaje);
    }
}
