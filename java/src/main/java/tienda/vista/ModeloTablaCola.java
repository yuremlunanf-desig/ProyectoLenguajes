package tienda.vista;

import java.util.ArrayList;
import java.util.List;
import javax.swing.table.AbstractTableModel;
import tienda.concurrencia.ProcesadorEstados;
import tienda.controlador.Etiquetas;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;

/**
 * Modelo de la tabla de la cola del despachador: qué pedido atiende cada trabajador y cuánto lleva.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 */
final class ModeloTablaCola extends AbstractTableModel implements ModeloConEstado {

    static final int COLUMNA_PROGRESO = 4;
    private static final String[] COLUMNAS = {"#", "Pedido", "Prioridad", "Trabajador", "Progreso", "Estado"};

    /** Una fila de la cola; se modifica solo desde el hilo de eventos de Swing. */
    static final class Fila {
        final int posicion;
        final String pedidoId;
        final String prioridad;
        String trabajador = "en espera";
        EstadoPedido estado;
        boolean activa;

        Fila(int posicion, Pedido pedido) {
            this.posicion = posicion;
            this.pedidoId = pedido.getId();
            this.prioridad = Etiquetas.prioridad(pedido.getPrioridad());
            this.estado = pedido.getEstado();
        }

        /** Porcentaje del flujo PENDIENTE -> ENTREGADO que ya recorrió. */
        int progreso() {
            int avance = ProcesadorEstados.FLUJO_ESTADOS.indexOf(estado);
            if (avance < 0) {
                return 0;
            }
            return avance * 100 / (ProcesadorEstados.FLUJO_ESTADOS.size() - 1);
        }
    }

    private final List<Fila> filas = new ArrayList<>();

    void reiniciar(List<Pedido> cola) {
        filas.clear();
        for (int i = 0; i < cola.size(); i++) {
            filas.add(new Fila(i + 1, cola.get(i)));
        }
        fireTableDataChanged();
    }

    /** La fila del pedido, o null si no está en la cola. Después de cambiarla se llama a filaCambio. */
    Fila buscar(String pedidoId) {
        for (Fila fila : filas) {
            if (fila.pedidoId.equals(pedidoId)) {
                return fila;
            }
        }
        return null;
    }

    /** Avisa a la tabla que esa fila cambió para que se repinte. */
    void filaCambio(Fila fila) {
        int indice = filas.indexOf(fila);
        fireTableRowsUpdated(indice, indice);
    }

    @Override
    public EstadoPedido estadoDe(int fila) {
        return filas.get(fila).estado;
    }

    @Override
    public boolean destacada(int fila) {
        return filas.get(fila).activa;
    }

    @Override
    public int getRowCount() {
        return filas.size();
    }

    @Override
    public int getColumnCount() {
        return COLUMNAS.length;
    }

    @Override
    public String getColumnName(int columna) {
        return COLUMNAS[columna];
    }

    @Override
    public Object getValueAt(int fila, int columna) {
        Fila f = filas.get(fila);
        switch (columna) {
            case 0:
                return f.posicion;
            case 1:
                return f.pedidoId;
            case 2:
                return f.prioridad;
            case 3:
                return f.trabajador;
            case COLUMNA_PROGRESO:
                return f.progreso();
            default:
                return Etiquetas.estado(f.estado);
        }
    }
}
