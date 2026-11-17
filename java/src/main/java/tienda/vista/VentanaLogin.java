package tienda.vista;

import java.awt.Dimension;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.util.function.Consumer;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import tienda.controlador.CamposIncompletosException;
import tienda.controlador.ControladorLogin;
import tienda.seguridad.AutenticacionException;
import tienda.seguridad.Usuario;

/**
 * Pantalla de inicio de sesión.
 *
 * Responsable: Ian (Login).
 *
 * Solo dibuja los campos y muestra los errores con JOptionPane. La validación real la hace
 * ControladorLogin; si sale bien, avisa a la aplicación con alAutenticar.
 */
public final class VentanaLogin extends JPanel {

    private final ControladorLogin controlador;
    private final Consumer<Usuario> alAutenticar;
    private final JTextField campoUsuario = new JTextField(22);
    private final JPasswordField campoContrasena = new JPasswordField(22);
    private final char caracterDeEco = campoContrasena.getEchoChar();

    public VentanaLogin(ControladorLogin controlador, Consumer<Usuario> alAutenticar, Runnable alSalir) {
        super(new GridBagLayout());
        this.controlador = controlador;
        this.alAutenticar = alAutenticar;
        setBackground(Estilos.FONDO);

        JPanel tarjeta = new JPanel(new GridBagLayout());
        tarjeta.setBackground(Estilos.SUPERFICIE);
        tarjeta.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(Estilos.BORDE), BorderFactory.createEmptyBorder(28, 32, 28, 32)));

        campoUsuario.setName("usuario");
        campoContrasena.setName("contrasena");

        JCheckBox mostrar = new JCheckBox("Mostrar contraseña");
        mostrar.setOpaque(false);
        mostrar.addActionListener(e -> {
            if (mostrar.isSelected()) {
                campoContrasena.setEchoChar((char) 0); // 0 = mostrar el texto
            } else {
                campoContrasena.setEchoChar(caracterDeEco);
            }
        });

        JButton ingresar = Estilos.botonPrimario("Ingresar");
        ingresar.addActionListener(e -> ingresar());
        JButton salir = new JButton("Salir");
        salir.addActionListener(e -> alSalir.run());
        salir.setPreferredSize(new Dimension(salir.getPreferredSize().width, 34));
        campoUsuario.addActionListener(e -> ingresar());
        campoContrasena.addActionListener(e -> ingresar());

        Insets sinMargen = new Insets(0, 0, 0, 0);
        int fila = 0;
        tarjeta.add(Estilos.etiqueta("Sistema de pedidos", java.awt.Font.BOLD, 22f, Estilos.TEXTO),
                Estilos.celda(0, fila++, 2, 1, 0, GridBagConstraints.NONE, sinMargen));
        tarjeta.add(Estilos.etiqueta("Inicia sesión para continuar", java.awt.Font.PLAIN, 13f, Estilos.TEXTO_SUAVE),
                Estilos.celda(0, fila++, 2, 1, 0, GridBagConstraints.NONE, new Insets(0, 0, 18, 0)));
        tarjeta.add(new JLabel("Usuario"), Estilos.celda(0, fila++, 2, 1, 0, GridBagConstraints.NONE, sinMargen));
        tarjeta.add(campoUsuario,
                Estilos.celda(0, fila++, 2, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(2, 0, 12, 0)));
        tarjeta.add(new JLabel("Contraseña"), Estilos.celda(0, fila++, 2, 1, 0, GridBagConstraints.NONE, sinMargen));
        tarjeta.add(campoContrasena,
                Estilos.celda(0, fila++, 2, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(2, 0, 6, 0)));
        tarjeta.add(mostrar,
                Estilos.celda(0, fila++, 2, 1, 0, GridBagConstraints.NONE, new Insets(0, 0, 18, 0)));
        tarjeta.add(ingresar,
                Estilos.celda(0, fila, 1, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(0, 0, 0, 6)));
        tarjeta.add(salir,
                Estilos.celda(1, fila, 1, 1, 0, GridBagConstraints.HORIZONTAL, new Insets(0, 6, 0, 0)));
        add(tarjeta);

        SwingUtilities.invokeLater(campoUsuario::requestFocusInWindow);
    }

    private void ingresar() {
        String contrasena = new String(campoContrasena.getPassword());
        try {
            Usuario usuario = controlador.iniciarSesion(campoUsuario.getText(), contrasena);
            campoContrasena.setText("");
            alAutenticar.accept(usuario);
        } catch (CamposIncompletosException error) {
            JOptionPane.showMessageDialog(this, error.getMessage(), "Datos incompletos", JOptionPane.WARNING_MESSAGE);
            if (campoUsuario.getText().isBlank()) {
                campoUsuario.requestFocusInWindow();
            } else {
                campoContrasena.requestFocusInWindow();
            }
        } catch (AutenticacionException error) {
            JOptionPane.showMessageDialog(this, error.getMessage(), "Acceso denegado", JOptionPane.ERROR_MESSAGE);
            campoContrasena.setText("");
            campoContrasena.requestFocusInWindow();
        }
    }
}
