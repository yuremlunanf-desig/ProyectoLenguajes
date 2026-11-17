package tienda.vista;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.ActionEvent;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.io.IOException;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.swing.AbstractAction;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSplitPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.KeyStroke;
import javax.swing.ListSelectionModel;
import javax.swing.Timer;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import tienda.controlador.ControladorConcurrencia;
import tienda.controlador.ControladorDashboard;
import tienda.controlador.ControladorDashboard.ResumenPedidos;
import tienda.controlador.ControladorFormulario;
import tienda.controlador.Etiquetas;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;
import tienda.seguridad.Usuario;

/**
 * Pantalla principal: indicadores, tabla de pedidos (JTable) y los paneles de formulario y concurrencia.
 *
 * Responsable: Leonardo (Dashboard).
 *
 * Esta vista arma el layout y conecta las demás: cuando el formulario registra un pedido o el
 * despachador cambia un estado, la tabla y los indicadores se repintan.
 */
public final class VistaDashboard extends JPanel {

    private static final int[] ANCHOS = {70, 150, 90, 88, 80, 90, 90, 80, 95, 95};
    private static final Set<Integer> COLUMNAS_A_DERECHA = Set.of(5, 6, 7, 8);
    private static final List<EstadoPedido> ESTADOS_EN_TARJETAS = List.of(
            EstadoPedido.PENDIENTE, EstadoPedido.EN_PROCESO, EstadoPedido.ENVIADO, EstadoPedido.ENTREGADO);

    private final ControladorDashboard controlador;
    private final ControladorConcurrencia concurrencia;

    private final ModeloTablaPedidos modeloTabla = new ModeloTablaPedidos();
    private final JTable tabla = new JTable(modeloTabla);
    private final JTextField campoBuscar = new JTextField(16);
    private final JComboBox<String> filtroEstado = new JComboBox<>(
            ControladorDashboard.FILTROS_ESTADO.toArray(String[]::new));
    private final JComboBox<String> orden = new JComboBox<>(ControladorDashboard.ORDENES.toArray(String[]::new));
    private final JLabel mensaje = new JLabel("Listo.");
    private final JLabel tarjetaPedidos = new JLabel("0");
    private final JLabel tarjetaVendido = new JLabel("$0.00");
    private final Map<EstadoPedido, JLabel> tarjetasPorEstado = new EnumMap<>(EstadoPedido.class);
    private final PanelConcurrencia panelConcurrencia;
    private final Timer avisoDeRechazos;

    public VistaDashboard(Usuario usuario, ControladorDashboard controlador, ControladorFormulario formulario,
                          ControladorConcurrencia concurrencia, Runnable alCerrarSesion) {
        super(new BorderLayout(12, 10));
        this.controlador = controlador;
        this.concurrencia = concurrencia;
        setBorder(BorderFactory.createEmptyBorder(12, 12, 10, 12));
        setBackground(Estilos.FONDO);

        add(encabezado(usuario, alCerrarSesion), BorderLayout.NORTH);
        add(new PanelFormulario(formulario, this::pedidoRegistrado), BorderLayout.WEST);

        panelConcurrencia = new PanelConcurrencia(concurrencia, this::refrescar, mensaje::setText);
        JPanel derecha = new JPanel(new BorderLayout(0, 8));
        derecha.setOpaque(false);
        JPanel superior = new JPanel(new BorderLayout(0, 10));
        superior.setOpaque(false);
        superior.add(tarjetas(), BorderLayout.NORTH);
        superior.add(filtros(), BorderLayout.SOUTH);
        derecha.add(superior, BorderLayout.NORTH);
        JSplitPane division = new JSplitPane(JSplitPane.VERTICAL_SPLIT, panelTabla(), panelConcurrencia);
        division.setResizeWeight(0.45);
        division.setBorder(null);
        division.setContinuousLayout(true);
        derecha.add(division, BorderLayout.CENTER);
        add(derecha, BorderLayout.CENTER);

        mensaje.setForeground(Estilos.TEXTO_SUAVE);
        mensaje.setName("mensaje");
        add(mensaje, BorderLayout.SOUTH);

        refrescar();
        avisoDeRechazos = new Timer(250, e -> avisarRechazos());
        avisoDeRechazos.setRepeats(false);
        avisoDeRechazos.start();
    }

    // --- construcción ---------------------------------------------------------------------

    private JPanel encabezado(Usuario usuario, Runnable alCerrarSesion) {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);
        panel.add(Estilos.etiqueta("Pedidos de la tienda", Font.BOLD, 22f, Estilos.TEXTO), BorderLayout.WEST);
        JPanel derecha = new JPanel(new FlowLayout(FlowLayout.RIGHT, 12, 0));
        derecha.setOpaque(false);
        derecha.add(Estilos.etiqueta(usuario.nombre() + " (" + usuario.usuario() + ")", Font.PLAIN, 13f,
                Estilos.TEXTO_SUAVE));
        JButton cerrarSesion = new JButton("Cerrar sesión");
        cerrarSesion.setName("cerrarSesion");
        cerrarSesion.addActionListener(e -> alCerrarSesion.run());
        derecha.add(cerrarSesion);
        panel.add(derecha, BorderLayout.EAST);
        return panel;
    }

    private JPanel tarjetas() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setOpaque(false);
        int columna = 0;
        panel.add(tarjeta("Pedidos", tarjetaPedidos, Estilos.TEXTO),
                Estilos.celda(columna++, 0, 1, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(0, 0, 0, 8)));
        for (EstadoPedido estado : ESTADOS_EN_TARJETAS) {
            JLabel valor = new JLabel("0");
            tarjetasPorEstado.put(estado, valor);
            panel.add(tarjeta(Etiquetas.estado(estado), valor, Estilos.textoDeEstado(estado)),
                    Estilos.celda(columna++, 0, 1, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(0, 0, 0, 8)));
        }
        panel.add(tarjeta("Total vendido", tarjetaVendido, Estilos.EXITO),
                Estilos.celda(columna, 0, 1, 2, 0, GridBagConstraints.HORIZONTAL, new Insets(0, 0, 0, 0)));
        return panel;
    }

    private static JPanel tarjeta(String titulo, JLabel valor, Color color) {
        JPanel tarjeta = Estilos.tarjeta();
        tarjeta.setLayout(new BorderLayout());
        valor.setFont(Estilos.fuente(Font.BOLD, 20f));
        valor.setForeground(color);
        tarjeta.add(valor, BorderLayout.CENTER);
        tarjeta.add(Estilos.etiqueta(titulo, Font.PLAIN, 13f, Estilos.TEXTO_SUAVE), BorderLayout.SOUTH);
        return tarjeta;
    }

    private JPanel filtros() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setOpaque(false);
        JPanel izquierda = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        izquierda.setOpaque(false);
        campoBuscar.setName("buscar");
        filtroEstado.setName("filtroEstado");
        orden.setName("orden");
        campoBuscar.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                refrescar();
            }

            @Override
            public void removeUpdate(DocumentEvent e) {
                refrescar();
            }

            @Override
            public void changedUpdate(DocumentEvent e) {
                refrescar();
            }
        });
        filtroEstado.addActionListener(e -> refrescar());
        orden.addActionListener(e -> refrescar());
        JButton limpiar = new JButton("Limpiar");
        limpiar.setName("limpiar");
        limpiar.addActionListener(e -> limpiarFiltros());
        izquierda.add(new JLabel("Buscar cliente"));
        izquierda.add(Box.createHorizontalStrut(6));
        izquierda.add(campoBuscar);
        izquierda.add(Box.createHorizontalStrut(14));
        izquierda.add(new JLabel("Estado"));
        izquierda.add(Box.createHorizontalStrut(6));
        izquierda.add(filtroEstado);
        izquierda.add(Box.createHorizontalStrut(14));
        izquierda.add(new JLabel("Ordenar por"));
        izquierda.add(Box.createHorizontalStrut(6));
        izquierda.add(orden);
        izquierda.add(Box.createHorizontalStrut(14));
        izquierda.add(limpiar);
        panel.add(izquierda, BorderLayout.WEST);
        JButton restablecer = new JButton("Restablecer datos");
        restablecer.setName("restablecer");
        restablecer.addActionListener(e -> restablecer());
        panel.add(restablecer, BorderLayout.EAST);
        return panel;
    }

    private JScrollPane panelTabla() {
        tabla.setName("pedidos");
        tabla.setRowHeight(26);
        tabla.setShowGrid(false);
        tabla.setIntercellSpacing(new Dimension(0, 0));
        tabla.setFillsViewportHeight(true);
        tabla.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        tabla.getTableHeader().setReorderingAllowed(false);
        RenderizadorEstado renderizador = new RenderizadorEstado(COLUMNAS_A_DERECHA);
        for (int i = 0; i < ANCHOS.length; i++) {
            tabla.getColumnModel().getColumn(i).setPreferredWidth(ANCHOS[i]);
            tabla.getColumnModel().getColumn(i).setCellRenderer(renderizador);
        }
        tabla.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() == 2) {
                    mostrarDetalle();
                }
            }
        });
        tabla.getInputMap(WHEN_FOCUSED).put(KeyStroke.getKeyStroke("ENTER"), "detalle");
        tabla.getActionMap().put("detalle", new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                mostrarDetalle();
            }
        });
        JScrollPane desplazamiento = new JScrollPane(tabla);
        desplazamiento.setBorder(BorderFactory.createLineBorder(Estilos.BORDE));
        desplazamiento.getViewport().setBackground(Estilos.SUPERFICIE);
        desplazamiento.setPreferredSize(new Dimension(700, 230));
        return desplazamiento;
    }

    // --- actualización --------------------------------------------------------------------

    /** Vuelve a consultar el modelo y repinta la tabla y los indicadores (conserva la selección). */
    public void refrescar() {
        int seleccionada = tabla.getSelectedRow();
        String idSeleccionado = seleccionada >= 0 ? modeloTabla.idDe(seleccionada) : null;
        modeloTabla.establecer(controlador.consultar(
                campoBuscar.getText(), (String) filtroEstado.getSelectedItem(), (String) orden.getSelectedItem()));
        if (idSeleccionado != null) {
            int fila = modeloTabla.filaDe(idSeleccionado);
            if (fila >= 0) {
                tabla.setRowSelectionInterval(fila, fila);
            }
        }
        ResumenPedidos resumen = controlador.resumen();
        tarjetaPedidos.setText(String.valueOf(resumen.totalPedidos()));
        for (EstadoPedido estado : ESTADOS_EN_TARJETAS) {
            tarjetasPorEstado.get(estado).setText(String.valueOf(resumen.porEstado().get(estado)));
        }
        tarjetaVendido.setText(Etiquetas.dinero(resumen.totalVendido()));
    }

    private void pedidoRegistrado(Pedido pedido) {
        refrescar();
        String texto = "Pedido " + pedido.getId() + " registrado para " + pedido.getCliente().getNombre() + ".";
        int fila = modeloTabla.filaDe(pedido.getId());
        if (fila >= 0) {
            tabla.setRowSelectionInterval(fila, fila);
            tabla.scrollRectToVisible(tabla.getCellRect(fila, 0, true));
        } else {
            // Los filtros activos lo ocultan: se avisa en lugar de dejar al usuario sin entender.
            texto += " (No se ve en la tabla por los filtros activos.)";
        }
        mensaje.setText(texto);
    }

    private void limpiarFiltros() {
        campoBuscar.setText("");
        filtroEstado.setSelectedItem(ControladorDashboard.TODOS);
        orden.setSelectedItem(ControladorDashboard.ORDEN_FECHA);
        refrescar();
    }

    private void restablecer() {
        if (concurrencia.enEjecucion()) {
            JOptionPane.showMessageDialog(this, "Detén el despachador antes de restablecer los datos.",
                    "Despachador en curso", JOptionPane.WARNING_MESSAGE);
            return;
        }
        int respuesta = JOptionPane.showConfirmDialog(this,
                "Se descartarán los pedidos capturados y los cambios de estado, y se volverá a cargar "
                        + "solicitudes_pequenas.json.\n\n¿Continuar?",
                "Restablecer datos", JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE);
        if (respuesta != JOptionPane.YES_OPTION) {
            return;
        }
        try {
            controlador.recargar();
        } catch (IOException | RuntimeException error) {
            JOptionPane.showMessageDialog(this, error.getClass().getSimpleName() + ": " + error.getMessage(),
                    "No se pudieron cargar los datos", JOptionPane.ERROR_MESSAGE);
            return;
        }
        refrescar();
        mensaje.setText("Datos restablecidos desde solicitudes_pequenas.json.");
        avisarRechazos();
    }

    private void mostrarDetalle() {
        int fila = tabla.getSelectedRow();
        if (fila >= 0) {
            String id = modeloTabla.idDe(fila);
            JOptionPane.showMessageDialog(this, controlador.detalle(id), "Detalle de " + id,
                    JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private void avisarRechazos() {
        List<String> rechazos = controlador.rechazos();
        if (rechazos.isEmpty()) {
            return;
        }
        String mensaje = "Al cargar las solicitudes se rechazaron " + rechazos.size()
                + " pedido(s) por no cumplir las reglas de negocio:\n";
        for (String motivo : rechazos) {
            mensaje += "\n• " + motivo;
        }
        JOptionPane.showMessageDialog(this, mensaje, "Pedidos rechazados", JOptionPane.WARNING_MESSAGE);
    }

    public boolean procesando() {
        return concurrencia.enEjecucion();
    }

    /** Detiene el despachador y los temporizadores antes de descartar la pantalla. */
    public void cerrar() {
        avisoDeRechazos.stop();
        panelConcurrencia.liberar();
        concurrencia.cerrar();
    }
}
