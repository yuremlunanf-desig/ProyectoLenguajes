package tienda.vista;

import java.util.ArrayList;
import java.util.List;
import javax.swing.table.AbstractTableModel;
import tienda.controlador.ControladorDashboard;
import tienda.controlador.ControladorDashboard.FilaPedido;
import tienda.modelo.EstadoPedido;

/**
 * Modelo de la tabla principal de pedidos (JTable). Las filas ya vienen formateadas del controlador.
 *
 * Responsable: Leonardo (Dashboard).
 */
final class ModeloTablaPedidos extends AbstractTableModel implements ModeloConEstado {

    private List<FilaPedido> filas = new ArrayList<>();

    void establecer(List<FilaPedido> nuevas) {
        filas = new ArrayList<>(nuevas);
        fireTableDataChanged();
    }

    String idDe(int fila) {
        return filas.get(fila).id();
    }

    int filaDe(String pedidoId) {
        for (int i = 0; i < filas.size(); i++) {
            if (filas.get(i).id().equals(pedidoId)) {
                return i;
            }
        }
        return -1;
    }

    @Override
    public EstadoPedido estadoDe(int fila) {
        return filas.get(fila).estado();
    }

    @Override
    public boolean destacada(int fila) {
        return false; // en esta tabla ninguna fila va en negritas
    }

    @Override
    public int getRowCount() {
        return filas.size();
    }

    @Override
    public int getColumnCount() {
        return ControladorDashboard.COLUMNAS.size();
    }

    @Override
    public String getColumnName(int columna) {
        return ControladorDashboard.COLUMNAS.get(columna);
    }

    @Override
    public Object getValueAt(int fila, int columna) {
        return filas.get(fila).valores().get(columna);
    }
}
