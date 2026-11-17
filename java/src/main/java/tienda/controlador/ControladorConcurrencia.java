package tienda.controlador;

import java.util.List;
import java.util.function.Consumer;
import tienda.concurrencia.Despachador;
import tienda.concurrencia.DespachadorException;
import tienda.concurrencia.EventoDespacho;
import tienda.datos.AlmacenPedidos;
import tienda.modelo.Pedido;

/**
 * Controlador del panel de concurrencia: valida los parámetros y conecta la vista con el despachador.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 */
public final class ControladorConcurrencia {

    public static final int RETARDO_MIN_MS = 50;
    public static final int RETARDO_MAX_MS = 5000;
    public static final int RETARDO_POR_DEFECTO_MS = 1000;
    public static final int TRABAJADORES_MIN = 1;
    public static final int TRABAJADORES_MAX = 8;
    public static final int TRABAJADORES_POR_DEFECTO = 2;

    private final AlmacenPedidos almacen;
    private final Despachador despachador;

    public ControladorConcurrencia(AlmacenPedidos almacen) {
        this(almacen, new Despachador());
    }

    public ControladorConcurrencia(AlmacenPedidos almacen, Despachador despachador) {
        this.almacen = almacen;
        this.despachador = despachador;
    }

    public boolean enEjecucion() {
        return despachador.enEjecucion();
    }

    /** La cola tal como la procesaría el despachador ahora mismo (prioridad primero). */
    public List<Pedido> colaActual() {
        return Despachador.colaDe(almacen.pedidos());
    }

    /** Registra un observador de eventos. Se invoca desde hilos de trabajo: la vista debe pasar al hilo de Swing. */
    public void agregarOyente(Consumer<EventoDespacho> oyente) {
        despachador.agregarOyente(oyente);
    }

    public List<Pedido> iniciar(String retardoTexto, String trabajadoresTexto) {
        int retardo = entero(retardoTexto, "El retardo", RETARDO_MIN_MS, RETARDO_MAX_MS, "ms");
        int trabajadores = entero(trabajadoresTexto, "La cantidad de trabajadores", TRABAJADORES_MIN, TRABAJADORES_MAX, "");
        try {
            return despachador.iniciar(almacen.pedidos(), retardo, trabajadores);
        } catch (DespachadorException error) {
            throw new ErrorConcurrenciaException(error.getMessage());
        }
    }

    public void detener() {
        despachador.detener();
    }

    /** Se llama al cerrar la ventana: cancela la corrida y espera un instante a que termine. */
    public void cerrar() {
        despachador.detener();
        despachador.esperar(2000);
    }

    private static int entero(String texto, String nombre, int minimo, int maximo, String unidad) {
        int valor;
        try {
            valor = Integer.parseInt(texto == null ? "" : texto.strip());
        } catch (NumberFormatException error) {
            throw new ErrorConcurrenciaException(nombre + " debe ser un número entero.");
        }
        if (valor < minimo || valor > maximo) {
            String sufijo = unidad.isEmpty() ? "" : " " + unidad;
            throw new ErrorConcurrenciaException(nombre + " debe estar entre " + minimo + " y " + maximo + sufijo + ".");
        }
        return valor;
    }
}
