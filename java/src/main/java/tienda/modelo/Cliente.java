package tienda.modelo;

/**
 * Cliente que realiza un pedido.
 *
 * Responsable: Ian (Modelos y Datos).
 */
public final class Cliente {

    private final String id;
    private final String nombre;
    private final TipoCliente tipo;

    public Cliente(String id, String nombre, TipoCliente tipo) {
        this.id = id;
        this.nombre = nombre;
        this.tipo = tipo;
    }

    public String getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public TipoCliente getTipo() {
        return tipo;
    }

    public boolean esFrecuente() {
        return tipo == TipoCliente.FRECUENTE;
    }

    @Override
    public String toString() {
        return nombre + " (" + id + ", " + tipo + ")";
    }
}
