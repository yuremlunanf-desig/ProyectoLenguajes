package tienda.vista;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GridBagConstraints;
import java.awt.Insets;
import java.awt.RenderingHints;
import java.awt.Window;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.UIManager;
import javax.swing.UnsupportedLookAndFeelException;
import javax.swing.border.Border;
import tienda.modelo.EstadoPedido;

/**
 * Colores, tipografía y componentes con estilo propio, compartidos por todas las vistas.
 *
 * Responsable: Ian (Login): infraestructura compartida de la GUI.
 */
public final class Estilos {

    public static final String FUENTE = "Segoe UI";
    public static final Color FONDO = new Color(0xF4F6F8);
    public static final Color SUPERFICIE = Color.WHITE;
    public static final Color BORDE = new Color(0xD9E2EC);
    public static final Color TEXTO = new Color(0x1F2933);
    public static final Color TEXTO_SUAVE = new Color(0x52606D);
    public static final Color PRIMARIO = new Color(0x2563EB);
    public static final Color PRIMARIO_HOVER = new Color(0x1D4ED8);
    public static final Color PELIGRO = new Color(0xB42318);
    public static final Color EXITO = new Color(0x14532D);

    private Estilos() {
    }

    /** Color de fondo de las filas de cada estado. El texto oscuro sobre fondo claro mantiene el contraste. */
    public static Color fondoDeEstado(EstadoPedido estado) {
        switch (estado) {
            case PENDIENTE:
                return new Color(0xFFF4D6);
            case EN_PROCESO:
                return new Color(0xDBEAFE);
            case ENVIADO:
                return new Color(0xEDE9FE);
            case ENTREGADO:
                return new Color(0xDCFCE7);
            default:
                return new Color(0xF1F5F9);
        }
    }

    /** Color del texto de las filas de cada estado. */
    public static Color textoDeEstado(EstadoPedido estado) {
        switch (estado) {
            case PENDIENTE:
                return new Color(0x7A5200);
            case EN_PROCESO:
                return new Color(0x1E3A8A);
            case ENVIADO:
                return new Color(0x4C1D95);
            case ENTREGADO:
                return new Color(0x14532D);
            default:
                return new Color(0x64748B);
        }
    }

    /** Configura el aspecto (Nimbus con colores propios). Se llama una vez, antes de crear ventanas. */
    public static void instalar() {
        Font base = new Font(FUENTE, Font.PLAIN, 13);
        UIManager.put("defaultFont", base);
        UIManager.put("control", FONDO);
        UIManager.put("nimbusOrange", PRIMARIO);       // color de las barras de progreso
        UIManager.put("nimbusFocus", PRIMARIO);
        UIManager.put("nimbusSelectionBackground", PRIMARIO);
        UIManager.put("Table.alternateRowColor", SUPERFICIE);
        try {
            for (UIManager.LookAndFeelInfo info : UIManager.getInstalledLookAndFeels()) {
                if ("Nimbus".equals(info.getName())) {
                    UIManager.setLookAndFeel(info.getClassName());
                    return;
                }
            }
        } catch (ClassNotFoundException | InstantiationException | IllegalAccessException
                 | UnsupportedLookAndFeelException error) {
            // Si Nimbus no está disponible se queda con el aspecto predeterminado del JDK.
        }
    }

    public static Font fuente(int estilo, float tamano) {
        return new Font(FUENTE, estilo, 1).deriveFont(estilo, tamano);
    }

    public static Border bordeTarjeta() {
        return BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(BORDE), BorderFactory.createEmptyBorder(8, 12, 8, 12));
    }

    public static JPanel tarjeta() {
        JPanel panel = new JPanel();
        panel.setBackground(SUPERFICIE);
        panel.setBorder(bordeTarjeta());
        return panel;
    }

    public static JLabel etiqueta(String texto, int estilo, float tamano, Color color) {
        JLabel etiqueta = new JLabel(texto);
        etiqueta.setFont(fuente(estilo, tamano));
        etiqueta.setForeground(color);
        return etiqueta;
    }

    /** Botón azul con texto blanco, dibujado por nosotros para que se vea igual en cualquier aspecto. */
    public static JButton botonPrimario(String texto) {
        JButton boton = new JButton(texto) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                Color fondo = !isEnabled() ? new Color(0x93B4F5)
                        : getModel().isPressed() || getModel().isRollover() ? PRIMARIO_HOVER : PRIMARIO;
                g2.setColor(fondo);
                g2.fillRoundRect(0, 0, getWidth(), getHeight(), 8, 8);
                g2.dispose();
                super.paintComponent(g);
            }
        };
        boton.setFont(fuente(Font.BOLD, 13f));
        boton.setForeground(Color.WHITE);
        boton.setContentAreaFilled(false);
        boton.setOpaque(false);
        boton.setFocusPainted(false);
        boton.setRolloverEnabled(true);
        boton.setBorder(BorderFactory.createEmptyBorder(7, 16, 7, 16));
        boton.setPreferredSize(new Dimension(boton.getPreferredSize().width, 34));
        return boton;
    }

    /** Restricciones de GridBagLayout con los parámetros que más se usan. */
    public static GridBagConstraints celda(int x, int y, int ancho, double pesoX, double pesoY, int relleno,
                                           Insets margen) {
        GridBagConstraints c = new GridBagConstraints();
        c.gridx = x;
        c.gridy = y;
        c.gridwidth = ancho;
        c.weightx = pesoX;
        c.weighty = pesoY;
        c.fill = relleno;
        c.anchor = GridBagConstraints.WEST;
        c.insets = margen;
        return c;
    }

    /** Dimensiona la ventana (sin pasarse de la pantalla) y la centra. */
    public static void centrar(Window ventana, int ancho, int alto) {
        Dimension pantalla = ventana.getToolkit().getScreenSize();
        int w = Math.min(ancho, pantalla.width - 40);
        int h = Math.min(alto, pantalla.height - 80);
        ventana.setSize(w, h);
        ventana.setLocation((pantalla.width - w) / 2, Math.max(0, (pantalla.height - h) / 2 - 20));
    }
}
