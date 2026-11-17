package tienda.vista;

import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.function.Consumer;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JProgressBar;
import javax.swing.JScrollPane;
import javax.swing.JSpinner;
import javax.swing.JTable;
import javax.swing.JTextPane;
import javax.swing.SpinnerNumberModel;
import javax.swing.SwingUtilities;
import javax.swing.Timer;
import javax.swing.table.TableCellRenderer;
import javax.swing.text.BadLocationException;
import javax.swing.text.SimpleAttributeSet;
import javax.swing.text.StyleConstants;
import javax.swing.text.StyledDocument;
import tienda.concurrencia.EventoDespacho;
import tienda.concurrencia.ProcesadorEstados;
import tienda.concurrencia.ResumenCorrida;
import tienda.controlador.ControladorConcurrencia;
import tienda.controlador.ErrorConcurrenciaException;
import tienda.controlador.Etiquetas;
import tienda.modelo.Pedido;

/**
 * Panel de concurrencia: muestra en tiempo real cómo el despachador procesa la cola.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 *
 * El despachador trabaja en hilos del ExecutorService y avisa cada cambio desde esos hilos. Swing no
 * es seguro entre hilos, así que el oyente registrado aquí NO toca ningún componente: solo pasa el
 * evento al hilo de eventos con SwingUtilities.invokeLater, y es ahí donde se actualizan la tabla de
 * la cola, la barra de avance y el registro.
 */
public final class PanelConcurrencia extends JPanel {

    private static final int INTERVALO_RELOJ_MS = 100;

    private final ControladorConcurrencia controlador;
    private final Runnable alCambiar;
    private final Consumer<String> alInformar;

    private final JSpinner retardo = new JSpinner(new SpinnerNumberModel(
            ControladorConcurrencia.RETARDO_POR_DEFECTO_MS, ControladorConcurrencia.RETARDO_MIN_MS,
            ControladorConcurrencia.RETARDO_MAX_MS, 50));
    private final JSpinner trabajadores = new JSpinner(new SpinnerNumberModel(
            ControladorConcurrencia.TRABAJADORES_POR_DEFECTO, ControladorConcurrencia.TRABAJADORES_MIN,
            ControladorConcurrencia.TRABAJADORES_MAX, 1));
    private final JButton botonIniciar = Estilos.botonPrimario("Procesar cola");
    private final JButton botonDetener = new JButton("Detener");
    private final ModeloTablaCola modeloCola = new ModeloTablaCola();
    private final JTable tablaCola = new JTable(modeloCola);
    private final JTextPane registro = new JTextPane();
    private final JProgressBar avance = new JProgressBar();
    private final JLabel estado = new JLabel();

    private final Timer reloj;
    private long inicioCorrida;
    private int transicionesHechas;
    private int transicionesTotales;
    private boolean deteniendo;

    public PanelConcurrencia(ControladorConcurrencia controlador, Runnable alCambiar, Consumer<String> alInformar) {
        super(new GridBagLayout());
        this.controlador = controlador;
        this.alCambiar = alCambiar;
        this.alInformar = alInformar;
        setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createTitledBorder("Despachador de pedidos (concurrencia)"),
                BorderFactory.createEmptyBorder(2, 8, 6, 8)));

        retardo.setEditor(new JSpinner.NumberEditor(retardo, "0")); // sin separador de miles: 1000, no 1,000
        construir();
        reloj = new Timer(INTERVALO_RELOJ_MS, e -> actualizarReloj());
        estado.setForeground(Estilos.TEXTO_SUAVE);
        estado.setText("Inactivo. Pulsa «Procesar cola» para despachar los pedidos pendientes.");

        // El despachador avisa desde los hilos de trabajo. Aquí solo se pasa cada evento al hilo de Swing.
        controlador.agregarOyente(evento -> SwingUtilities.invokeLater(() -> aplicar(evento)));
    }

    private void construir() {
        JPanel controles = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        controles.setOpaque(false);
        controles.add(new JLabel("Retardo por transición (ms)"));
        controles.add(Box.createHorizontalStrut(6));
        controles.add(retardo);
        controles.add(Box.createHorizontalStrut(16));
        controles.add(new JLabel("Trabajadores simultáneos"));
        controles.add(Box.createHorizontalStrut(6));
        controles.add(trabajadores);
        controles.add(Box.createHorizontalStrut(16));
        botonIniciar.addActionListener(e -> iniciar());
        botonDetener.addActionListener(e -> detener());
        botonDetener.setEnabled(false);
        botonDetener.setPreferredSize(new Dimension(botonDetener.getPreferredSize().width, 34));
        controles.add(botonIniciar);
        controles.add(Box.createHorizontalStrut(6));
        controles.add(botonDetener);
        add(controles, Estilos.celda(0, 0, 2, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(0, 0, 8, 0)));

        tablaCola.setRowHeight(24);
        tablaCola.setShowGrid(false);
        tablaCola.setIntercellSpacing(new Dimension(0, 0));
        tablaCola.setFillsViewportHeight(true);
        tablaCola.setRowSelectionAllowed(false);
        tablaCola.getTableHeader().setReorderingAllowed(false);
        int[] anchos = {32, 80, 85, 100, 140, 95};
        RenderizadorEstado renderizador = new RenderizadorEstado(Set.of());
        for (int i = 0; i < anchos.length; i++) {
            tablaCola.getColumnModel().getColumn(i).setPreferredWidth(anchos[i]);
            if (i == ModeloTablaCola.COLUMNA_PROGRESO) {
                tablaCola.getColumnModel().getColumn(i).setCellRenderer(new RenderizadorProgreso());
            } else {
                tablaCola.getColumnModel().getColumn(i).setCellRenderer(renderizador);
            }
        }
        JScrollPane desplazamientoCola = new JScrollPane(tablaCola);
        desplazamientoCola.setBorder(BorderFactory.createLineBorder(Estilos.BORDE));
        desplazamientoCola.getViewport().setBackground(Estilos.SUPERFICIE);
        desplazamientoCola.setPreferredSize(new Dimension(520, 170));
        add(desplazamientoCola, Estilos.celda(0, 1, 1, 3, 1, GridBagConstraints.BOTH, new Insets(0, 0, 0, 8)));

        registro.setEditable(false);
        registro.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        JScrollPane desplazamientoRegistro = new JScrollPane(registro);
        desplazamientoRegistro.setBorder(BorderFactory.createLineBorder(Estilos.BORDE));
        desplazamientoRegistro.setPreferredSize(new Dimension(360, 170));
        add(desplazamientoRegistro, Estilos.celda(1, 1, 1, 2, 1, GridBagConstraints.BOTH, new Insets(0, 0, 0, 0)));

        add(avance, Estilos.celda(0, 2, 2, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(8, 0, 2, 0)));
        add(estado, Estilos.celda(0, 3, 2, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(0, 0, 0, 0)));
    }

    /** Barra de progreso dentro de la celda de la tabla de la cola. */
    private static final class RenderizadorProgreso implements TableCellRenderer {
        private final JProgressBar barra = new JProgressBar(0, 100);

        RenderizadorProgreso() {
            barra.setStringPainted(true);
            barra.setBorder(BorderFactory.createEmptyBorder(4, 6, 4, 6));
        }

        @Override
        public Component getTableCellRendererComponent(
                JTable tabla, Object valor, boolean seleccionada, boolean enfoque, int fila, int columna) {
            int porcentaje = (Integer) valor;
            barra.setValue(porcentaje);
            barra.setString(porcentaje + " %");
            return barra;
        }
    }

    // --- acciones ------------------------------------------------------------------------

    private void iniciar() {
        List<Pedido> cola;
        try {
            cola = controlador.iniciar(String.valueOf(retardo.getValue()), String.valueOf(trabajadores.getValue()));
        } catch (ErrorConcurrenciaException error) {
            JOptionPane.showMessageDialog(this, error.getMessage(), "No se puede procesar", JOptionPane.WARNING_MESSAGE);
            return;
        }
        preparar(cola);
    }

    private void detener() {
        controlador.detener();
        deteniendo = true;
        estado.setText("Deteniendo…");
        botonDetener.setEnabled(false);
    }

    /** Se ejecuta en el hilo de eventos, antes de que llegue cualquier evento de la corrida. */
    private void preparar(List<Pedido> cola) {
        modeloCola.reiniciar(cola);
        transicionesTotales = 0;
        for (Pedido pedido : cola) {
            transicionesTotales += ProcesadorEstados.estadosPendientes(pedido.getEstado()).size();
        }
        transicionesHechas = 0;
        deteniendo = false;
        avance.setMaximum(Math.max(1, transicionesTotales));
        avance.setValue(0);
        inicioCorrida = System.nanoTime();
        registro.setText("");
        ponerControles(true);
        reloj.start();
        estado.setText("Procesando " + cola.size() + " pedido(s)…");
        alInformar.accept("Despachador: procesando " + cola.size() + " pedido(s) por prioridad.");
    }

    private void ponerControles(boolean enEjecucion) {
        botonIniciar.setEnabled(!enEjecucion);
        retardo.setEnabled(!enEjecucion);
        trabajadores.setEnabled(!enEjecucion);
        botonDetener.setEnabled(enEjecucion);
        if (!enEjecucion) {
            reloj.stop();
        }
    }

    // --- tiempo real (siempre en el hilo de eventos de Swing) ------------------------------

    private void actualizarReloj() {
        if (controlador.enEjecucion() && !deteniendo) {
            double segundos = (System.nanoTime() - inicioCorrida) / 1e9;
            estado.setText(String.format(Locale.US, "Procesando… %d/%d transiciones · %.1f s",
                    transicionesHechas, transicionesTotales, segundos));
        }
    }

    private void aplicar(EventoDespacho evento) {
        String segundos = String.format(Locale.US, "+%5.2f s", evento.marcaMs() / 1000);
        ModeloTablaCola.Fila fila = modeloCola.buscar(evento.pedidoId());

        switch (evento.tipo()) {
            case CORRIDA_INICIADA:
                escribir(segundos + "  Corrida iniciada (" + evento.detalle() + " pedidos)", Estilos.TEXTO_SUAVE);
                break;
            case PEDIDO_INICIADO:
                if (fila != null) {
                    fila.trabajador = "Trabajador " + evento.trabajador();
                    fila.activa = true;
                    modeloCola.filaCambio(fila);
                }
                escribir(segundos + "  Trabajador " + evento.trabajador() + " toma " + evento.pedidoId(),
                        Estilos.TEXTO_SUAVE);
                break;
            case TRANSICION:
                transicionesHechas++;
                avance.setValue(transicionesHechas);
                if (fila != null) {
                    fila.estado = evento.estadoNuevo();
                    modeloCola.filaCambio(fila);
                }
                escribir(segundos + "  " + evento.pedidoId() + ": " + Etiquetas.estado(evento.estadoAnterior())
                        + " -> " + Etiquetas.estado(evento.estadoNuevo()), Estilos.textoDeEstado(evento.estadoNuevo()));
                alCambiar.run(); // el dashboard repinta su tabla con el nuevo estado
                break;
            case PEDIDO_TERMINADO:
                if (fila != null) {
                    fila.trabajador = "libre";
                    fila.activa = false;
                    modeloCola.filaCambio(fila);
                }
                escribir(segundos + "  " + evento.pedidoId() + " completado", Estilos.TEXTO_SUAVE);
                break;
            case CORRIDA_TERMINADA:
                terminar(evento, segundos);
                break;
            case CORRIDA_DETENIDA:
                ponerControles(false);
                String detenida = "Corrida detenida (" + evento.detalle() + " pedidos completados).";
                estado.setText(detenida);
                escribir(segundos + "  " + detenida, Estilos.PELIGRO);
                alInformar.accept("Despachador: " + detenida);
                alCambiar.run();
                break;
            case ERROR:
                ponerControles(false);
                estado.setText("La corrida terminó con un error.");
                escribir("Error: " + evento.detalle(), Estilos.PELIGRO);
                JOptionPane.showMessageDialog(this, evento.detalle(), "Error en el despachador", JOptionPane.ERROR_MESSAGE);
                alCambiar.run();
                break;
            default:
                break;
        }
    }

    private void terminar(EventoDespacho evento, String segundos) {
        ResumenCorrida resumen = evento.resumen();
        ponerControles(false);
        String mensaje = String.format(Locale.US,
                "Cola completada: %d pedido(s) en %.2f s (secuencial estimado %.2f s, aceleración ×%s).",
                resumen.procesados(), resumen.tiempoMs() / 1000, resumen.secuencialEstimadoMs() / 1000,
                resumen.aceleracion());
        estado.setText(mensaje);
        escribir(segundos + "  " + mensaje, Estilos.TEXTO_SUAVE);
        alInformar.accept("Despachador: " + mensaje);
        alCambiar.run();
    }

    private void escribir(String texto, Color color) {
        StyledDocument documento = registro.getStyledDocument();
        SimpleAttributeSet atributos = new SimpleAttributeSet();
        StyleConstants.setForeground(atributos, color);
        try {
            documento.insertString(documento.getLength(), texto + "\n", atributos);
        } catch (BadLocationException error) {
            throw new IllegalStateException(error);
        }
        registro.setCaretPosition(documento.getLength());
    }

    /** Detiene el reloj; se llama al descartar la pantalla. */
    void liberar() {
        reloj.stop();
    }
}
