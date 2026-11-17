package tienda.datos;

/**
 * catalogo.json no existe o tiene un formato inválido.
 *
 * Responsable: Edsson (Formularios).
 */
public class CatalogoException extends RuntimeException {

    public CatalogoException(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }
}
