package tienda.vista;

import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.util.function.Consumer;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSeparator;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.SwingConstants;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import tienda.controlador.ControladorFormulario;
import tienda.controlador.ErrorFormularioException;
import tienda.controlador.Etiquetas;
import tienda.modelo.Pedido;
import tienda.modelo.Prioridad;
import tienda.modelo.TipoCliente;
import tienda.modelo.TipoEnvio;
import tienda.negocio.Desglose;
import tienda.negocio.PedidoInvalidoException;

/**
 * Formulario de captura de pedidos: datos del cliente, carrito y registro.
 *
 * Responsable: Edsson (Formularios).
 *
 * Cada acción que puede fallar se envuelve en try/catch y el error se muestra con JOptionPane en
 * lugar de llegar a la consola:
 *   - ErrorFormularioException     -> aviso (datos faltantes o con mal formato).
 *   - PedidoInvalidoException      -> error (la regla de negocio rechazó el pedido).
 */
public final class PanelFormulario extends JPanel {

    private final ControladorFormulario controlador;
    private final Consumer<Pedido> alRegistrar;

    private final JTextField clienteId = new JTextField(8);
    private final JTextField clienteNombre = new JTextField();
    private final JTextField cantidad = new JTextField("1", 5);
    // Los selectores muestran textos en español; la posición elegida corresponde a la del enumerado.
    private final JComboBox<String> tipo = new JComboBox<>(Etiquetas.tiposCliente());
    private final JComboBox<String> prioridad = new JComboBox<>(Etiquetas.prioridades());
    private final JComboBox<String> envio = new JComboBox<>(Etiquetas.envios());
    private final JComboBox<String> producto;
    private final DefaultTableModel modeloCarrito = new DefaultTableModel(
            new Object[] {"Producto", "Cant.", "Importe"}, 0) {
        @Override
        public boolean isCellEditable(int fila, int columna) {
            return false;
        }
    };
    private final JTable tablaCarrito = new JTable(modeloCarrito);
    private final JLabel subtotal = new JLabel("—");
    private final JLabel descuento = new JLabel("—");
    private final JLabel iva = new JLabel("—");
    private final JLabel costoEnvio = new JLabel("—");
    private final JLabel total = new JLabel("—");

    public PanelFormulario(ControladorFormulario controlador, Consumer<Pedido> alRegistrar) {
        super(new GridBagLayout());
        this.controlador = controlador;
        this.alRegistrar = alRegistrar;
        setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createTitledBorder("Nuevo pedido"), BorderFactory.createEmptyBorder(4, 8, 8, 8)));
        setPreferredSize(new Dimension(410, 0));

        tipo.setSelectedIndex(TipoCliente.REGULAR.ordinal());
        prioridad.setSelectedIndex(Prioridad.MEDIA.ordinal());
        envio.setSelectedIndex(TipoEnvio.ESTANDAR.ordinal());
        producto = new JComboBox<>(controlador.opcionesProducto().toArray(new String[0]));
        producto.setSelectedIndex(-1); // sin selección: obliga a elegir un producto
        tipo.addActionListener(e -> actualizarImportes());
        envio.addActionListener(e -> actualizarImportes());

        // Nombres para identificar los componentes (útiles al depurar la ventana).
        clienteId.setName("clienteId");
        clienteNombre.setName("clienteNombre");
        cantidad.setName("cantidad");
        producto.setName("producto");
        tablaCarrito.setName("carrito");

        Insets m = new Insets(0, 0, 0, 0);
        int fila = 0;
        add(new JLabel("ID cliente"), Estilos.celda(0, fila, 1, 0, 0, GridBagConstraints.NONE, m));
        add(new JLabel("Nombre"), Estilos.celda(1, fila++, 2, 1, 0, GridBagConstraints.NONE, new Insets(0, 8, 0, 0)));
        add(clienteId, Estilos.celda(0, fila, 1, 0, 0, GridBagConstraints.HORIZONTAL, m));
        add(clienteNombre,
                Estilos.celda(1, fila++, 2, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(0, 8, 0, 0)));

        add(new JLabel("Tipo de cliente"), Estilos.celda(0, fila, 1, 1, 0, GridBagConstraints.NONE, new Insets(8, 0, 0, 0)));
        add(new JLabel("Prioridad"), Estilos.celda(1, fila, 1, 1, 0, GridBagConstraints.NONE, new Insets(8, 6, 0, 0)));
        add(new JLabel("Envío"), Estilos.celda(2, fila++, 1, 1, 0, GridBagConstraints.NONE, new Insets(8, 6, 0, 0)));
        add(tipo, Estilos.celda(0, fila, 1, 1, 0, GridBagConstraints.HORIZONTAL, m));
        add(prioridad, Estilos.celda(1, fila, 1, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(0, 6, 0, 0)));
        add(envio, Estilos.celda(2, fila++, 1, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(0, 6, 0, 0)));

        add(new JSeparator(), Estilos.celda(0, fila++, 3, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(10, 0, 10, 0)));

        add(new JLabel("Producto"), Estilos.celda(0, fila++, 3, 1, 0, GridBagConstraints.NONE, m));
        add(producto, Estilos.celda(0, fila++, 3, 1, 0, GridBagConstraints.HORIZONTAL, m));

        JPanel filaCantidad = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        filaCantidad.setOpaque(false);
        JButton agregar = new JButton("Agregar al carrito");
        agregar.setName("agregar");
        agregar.addActionListener(e -> agregar());
        cantidad.addActionListener(e -> agregar());
        filaCantidad.add(new JLabel("Cantidad"));
        filaCantidad.add(Box.createHorizontalStrut(8));
        filaCantidad.add(cantidad);
        filaCantidad.add(Box.createHorizontalStrut(12));
        filaCantidad.add(agregar);
        add(filaCantidad, Estilos.celda(0, fila++, 3, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(8, 0, 0, 0)));

        configurarTablaCarrito();
        JScrollPane desplazamiento = new JScrollPane(tablaCarrito);
        desplazamiento.setBorder(BorderFactory.createLineBorder(Estilos.BORDE));
        desplazamiento.getViewport().setBackground(Estilos.SUPERFICIE);
        add(desplazamiento, Estilos.celda(0, fila++, 3, 1, 1, GridBagConstraints.BOTH, new Insets(10, 0, 4, 0)));

        JPanel botones = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        botones.setOpaque(false);
        JButton quitar = new JButton("Quitar línea");
        quitar.setName("quitar");
        quitar.addActionListener(e -> quitar());
        JButton vaciar = new JButton("Vaciar carrito");
        vaciar.setName("vaciar");
        vaciar.addActionListener(e -> vaciar());
        botones.add(quitar);
        botones.add(Box.createHorizontalStrut(6));
        botones.add(vaciar);
        add(botones, Estilos.celda(0, fila++, 3, 1, 0, GridBagConstraints.HORIZONTAL, m));

        JPanel totales = new JPanel(new GridBagLayout());
        totales.setOpaque(false);
        agregarFilaDeImporte(totales, 0, "Subtotal", subtotal, false);
        agregarFilaDeImporte(totales, 1, "Descuento", descuento, false);
        agregarFilaDeImporte(totales, 2, "IVA", iva, false);
        agregarFilaDeImporte(totales, 3, "Envío", costoEnvio, false);
        agregarFilaDeImporte(totales, 4, "Total", total, true);
        add(totales, Estilos.celda(0, fila++, 3, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(10, 0, 0, 0)));

        JButton registrar = Estilos.botonPrimario("Registrar pedido");
        registrar.setName("registrar");
        registrar.addActionListener(e -> registrar());
        add(registrar, Estilos.celda(0, fila, 3, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(12, 0, 0, 0)));
    }

    /** Una fila de la zona de importes: el nombre a la izquierda y el valor a la derecha. */
    private static void agregarFilaDeImporte(JPanel panel, int fila, String nombre, JLabel valor, boolean esTotal) {
        int estilo = Font.PLAIN;
        float tamano = 13f;
        if (esTotal) {
            estilo = Font.BOLD;
            tamano = 15f;
        }
        valor.setFont(Estilos.fuente(estilo, tamano));
        valor.setHorizontalAlignment(SwingConstants.RIGHT);
        valor.setName("importe" + nombre);
        Insets sinMargen = new Insets(0, 0, 0, 0);
        panel.add(Estilos.etiqueta(nombre, estilo, tamano, Estilos.TEXTO),
                Estilos.celda(0, fila, 1, 0, 0, GridBagConstraints.NONE, sinMargen));
        panel.add(valor, Estilos.celda(1, fila, 1, 1, 0, GridBagConstraints.HORIZONTAL, sinMargen));
    }

    private void configurarTablaCarrito() {
        tablaCarrito.setRowHeight(24);
        tablaCarrito.setShowGrid(false);
        tablaCarrito.setIntercellSpacing(new Dimension(0, 0));
        tablaCarrito.setFillsViewportHeight(true);
        tablaCarrito.getTableHeader().setReorderingAllowed(false);
        tablaCarrito.getColumnModel().getColumn(0).setPreferredWidth(200);
        tablaCarrito.getColumnModel().getColumn(1).setPreferredWidth(45);
        tablaCarrito.getColumnModel().getColumn(2).setPreferredWidth(90);
        DefaultTableCellRenderer centro = new DefaultTableCellRenderer();
        centro.setHorizontalAlignment(SwingConstants.CENTER);
        DefaultTableCellRenderer derecha = new DefaultTableCellRenderer();
        derecha.setHorizontalAlignment(SwingConstants.RIGHT);
        tablaCarrito.getColumnModel().getColumn(1).setCellRenderer(centro);
        tablaCarrito.getColumnModel().getColumn(2).setCellRenderer(derecha);
    }

    // --- acciones ------------------------------------------------------------------------

    private void agregar() {
        try {
            controlador.agregarAlCarrito((String) producto.getSelectedItem(), cantidad.getText());
        } catch (ErrorFormularioException error) {
            mostrarAviso(error.getMessage());
            cantidad.requestFocusInWindow();
            return;
        } catch (PedidoInvalidoException error) {
            mostrarError(error.getMessage());
            cantidad.requestFocusInWindow();
            return;
        }
        cantidad.setText("1");
        refrescarCarrito();
    }

    private void quitar() {
        try {
            controlador.quitarDelCarrito(tablaCarrito.getSelectedRow());
        } catch (ErrorFormularioException error) {
            mostrarAviso(error.getMessage());
            return;
        }
        refrescarCarrito();
    }

    private void vaciar() {
        controlador.vaciarCarrito();
        refrescarCarrito();
    }

    private void registrar() {
        Pedido pedido;
        try {
            pedido = controlador.registrar(clienteId.getText(), clienteNombre.getText(),
                    TipoCliente.values()[tipo.getSelectedIndex()],
                    TipoEnvio.values()[envio.getSelectedIndex()],
                    Prioridad.values()[prioridad.getSelectedIndex()]);
        } catch (ErrorFormularioException error) {
            mostrarAviso(error.getMessage());
            return;
        } catch (PedidoInvalidoException error) {
            mostrarError(error.getMessage());
            return;
        }
        clienteId.setText("");
        clienteNombre.setText("");
        refrescarCarrito();
        clienteId.requestFocusInWindow();
        alRegistrar.accept(pedido);
    }

    // --- soporte -------------------------------------------------------------------------

    /** Aviso: un dato mal capturado que el usuario corrige. */
    private void mostrarAviso(String mensaje) {
        JOptionPane.showMessageDialog(this, mensaje, "Revisa el formulario", JOptionPane.WARNING_MESSAGE);
    }

    /** Error: la regla de negocio rechazó el pedido. */
    private void mostrarError(String mensaje) {
        JOptionPane.showMessageDialog(this, mensaje, "Pedido inválido", JOptionPane.ERROR_MESSAGE);
    }

    private void refrescarCarrito() {
        modeloCarrito.setRowCount(0);
        for (ControladorFormulario.LineaCarrito linea : controlador.carrito()) {
            modeloCarrito.addRow(new Object[] {
                    linea.item().nombre(), linea.cantidad(), Etiquetas.dinero(linea.importe())});
        }
        actualizarImportes();
    }

    private void actualizarImportes() {
        Desglose desglose = controlador.vistaPrevia(
                TipoCliente.values()[tipo.getSelectedIndex()], TipoEnvio.values()[envio.getSelectedIndex()]);
        if (desglose == null) {
            subtotal.setText("—");
            descuento.setText("—");
            iva.setText("—");
            costoEnvio.setText("—");
            total.setText("—");
        } else {
            subtotal.setText(Etiquetas.dinero(desglose.subtotal()));
            descuento.setText("-" + Etiquetas.dinero(desglose.descuento()));
            iva.setText(Etiquetas.dinero(desglose.iva()));
            costoEnvio.setText(Etiquetas.dinero(desglose.envio()));
            total.setText(Etiquetas.dinero(desglose.total()));
        }
    }
}
