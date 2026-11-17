package tienda.vista;

import java.awt.Color;
import java.awt.Component;
import java.awt.Font;
import java.util.Set;
import javax.swing.BorderFactory;
import javax.swing.JLabel;
import javax.swing.JTable;
import javax.swing.table.DefaultTableCellRenderer;
import tienda.modelo.EstadoPedido;

/**
 * Pinta cada fila de una tabla con los colores de su estado (el modelo de la tabla debe ser un ModeloConEstado).
 *
 * Responsable: Leonardo (Dashboard).
 */
final class RenderizadorEstado extends DefaultTableCellRenderer {

    private final Set<Integer> columnasADerecha;

    RenderizadorEstado(Set<Integer> columnasADerecha) {
        this.columnasADerecha = columnasADerecha;
    }

    @Override
    public Component getTableCellRendererComponent(
            JTable tabla, Object valor, boolean seleccionada, boolean enfoque, int fila, int columna) {
        super.getTableCellRendererComponent(tabla, valor, seleccionada, false, fila, columna);
        setBorder(BorderFactory.createEmptyBorder(0, 8, 0, 8));
        if (columnasADerecha.contains(columna)) {
            setHorizontalAlignment(JLabel.RIGHT);
        } else {
            setHorizontalAlignment(JLabel.LEFT);
        }

        Font normal = tabla.getFont();
        setFont(normal);
        if (seleccionada) {
            setBackground(Estilos.PRIMARIO);
            setForeground(Color.WHITE);
        } else {
            ModeloConEstado modelo = (ModeloConEstado) tabla.getModel();
            EstadoPedido estado = modelo.estadoDe(fila);
            setBackground(Estilos.fondoDeEstado(estado));
            setForeground(Estilos.textoDeEstado(estado));
            if (modelo.destacada(fila)) {
                setFont(normal.deriveFont(Font.BOLD));
            }
        }
        return this;
    }
}
