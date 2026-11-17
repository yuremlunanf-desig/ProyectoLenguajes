package tienda.vista;

import java.awt.Dimension;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JOptionPane;
import tienda.controlador.ControladorConcurrencia;
import tienda.controlador.ControladorDashboard;
import tienda.controlador.ControladorFormulario;
import tienda.controlador.ControladorLogin;
import tienda.datos.AlmacenPedidos;
import tienda.datos.Catalogo;
import tienda.datos.CatalogoException;
import tienda.datos.ItemCatalogo;
import tienda.seguridad.AutenticacionException;
import tienda.seguridad.ServicioAutenticacion;
import tienda.seguridad.Usuario;

/**
 * Ventana única de la aplicación: pasa del login al dashboard.
 *
 * Responsable: Ian (Login) crea el esqueleto y la navegación; Leonardo conecta el dashboard.
 *
 * Aquí se arma todo el MVC: se crea el modelo, los controladores y se entregan a las vistas.
 */
public final class AplicacionGui extends JFrame {

    private static final Dimension TAMANO_LOGIN = new Dimension(460, 420);
    private static final Dimension TAMANO_DASHBOARD = new Dimension(1400, 860);

    private final Path carpetaDatos;
    private ServicioAutenticacion servicio;
    private JComponent vista;

    public AplicacionGui(Path carpetaDatos) {
        super("Sistema de pedidos");
        this.carpetaDatos = carpetaDatos;
        setDefaultCloseOperation(DO_NOTHING_ON_CLOSE);
        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                salir();
            }
        });
    }

    /** Carga los usuarios y muestra el login. Devuelve false (tras avisar) si no se pudo. */
    public boolean iniciar() {
        try {
            servicio = new ServicioAutenticacion(carpetaDatos.resolve("usuarios.json"));
        } catch (AutenticacionException error) {
            JOptionPane.showMessageDialog(null, error.getMessage(), "No se puede iniciar el sistema",
                    JOptionPane.ERROR_MESSAGE);
            dispose();
            return false;
        }
        mostrarLogin();
        setVisible(true);
        return true;
    }

    // --- navegación -----------------------------------------------------------------------

    private void mostrarLogin() {
        VentanaLogin login = new VentanaLogin(new ControladorLogin(servicio), this::entrar, this::salir);
        cambiarVista(login, TAMANO_LOGIN, false);
    }

    private void entrar(Usuario usuario) {
        AlmacenPedidos almacen = new AlmacenPedidos(carpetaDatos.resolve("solicitudes_pequenas.json"));
        List<ItemCatalogo> catalogo;
        try {
            almacen.cargar();
            catalogo = Catalogo.leer(carpetaDatos.resolve("catalogo.json"));
        } catch (CatalogoException error) {
            avisarErrorDeDatos(error.getMessage());
            return;
        } catch (IOException | RuntimeException error) {
            // Archivos de datos dañados (JSON mal escrito, fechas o valores inválidos...).
            avisarErrorDeDatos(error.getClass().getSimpleName() + ": " + error.getMessage());
            return;
        }
        VistaDashboard dashboard = new VistaDashboard(
                usuario, new ControladorDashboard(almacen), new ControladorFormulario(almacen, catalogo),
                new ControladorConcurrencia(almacen), this::cerrarSesion);
        cambiarVista(dashboard, TAMANO_DASHBOARD, true);
    }

    private void avisarErrorDeDatos(String detalle) {
        JOptionPane.showMessageDialog(this, "Revisa los archivos de la carpeta datos/.\n\n" + detalle,
                "No se pudieron cargar los datos", JOptionPane.ERROR_MESSAGE);
    }

    private void cerrarSesion() {
        if (vista instanceof VistaDashboard) {
            VistaDashboard dashboard = (VistaDashboard) vista;
            if (dashboard.procesando()) {
                int respuesta = JOptionPane.showConfirmDialog(this,
                        "El despachador sigue procesando pedidos. Se detendrá al cerrar la sesión.\n\n"
                                + "¿Cerrar la sesión?",
                        "Cerrar sesión", JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE);
                if (respuesta != JOptionPane.YES_OPTION) {
                    return;
                }
            }
        }
        mostrarLogin();
    }

    /** Cierra la ventana (y detiene el despachador si había uno en marcha). */
    public void salir() {
        descartarVista();
        dispose();
    }

    private void cambiarVista(JComponent nueva, Dimension tamano, boolean redimensionable) {
        descartarVista();
        vista = nueva;
        setContentPane(nueva);
        setResizable(redimensionable);
        if (redimensionable) {
            setMinimumSize(new Dimension(1180, 720));
        } else {
            setMinimumSize(tamano);
        }
        Estilos.centrar(this, tamano.width, tamano.height);
        revalidate();
        repaint();
    }

    private void descartarVista() {
        if (vista instanceof VistaDashboard) {
            ((VistaDashboard) vista).cerrar();
        }
        vista = null;
    }
}
