package tienda;

import java.nio.file.Files;
import java.nio.file.Path;
import javax.swing.JOptionPane;
import javax.swing.SwingUtilities;
import tienda.vista.AplicacionGui;
import tienda.vista.Estilos;

/**
 * Punto de entrada de la interfaz gráfica (Swing): login y dashboard de pedidos.
 *
 * Responsable: Ian (Login).
 *
 * Uso (desde la carpeta java/):
 *     .\mvnw.cmd -q compile exec:java "-Dexec.mainClass=tienda.MainGui"
 *
 * Usuarios de prueba (datos/usuarios.json):  admin / 1234   y   operador / ventas
 * La versión de consola sigue siendo tienda.Main. Opcionalmente se puede pasar la carpeta de datos:
 *     "-Dexec.args=ruta/a/datos"
 */
public final class MainGui {

    private MainGui() {
    }

    public static void main(String[] args) {
        // Si algo falla de forma inesperada (un defecto, no un error del usuario) se avisa en una ventana.
        Thread.setDefaultUncaughtExceptionHandler((hilo, error) -> mostrarErrorInesperado(error));

        Path datos = carpetaDeDatos(args);
        SwingUtilities.invokeLater(() -> abrirVentana(datos));
    }

    private static void abrirVentana(Path datos) {
        Estilos.instalar();
        if (datos == null) {
            JOptionPane.showMessageDialog(null,
                    "No se encontró la carpeta datos/. Ejecuta el programa desde la carpeta java/ "
                            + "o pasa la ruta con -Dexec.args=\"ruta/a/datos\".",
                    "No se puede iniciar el sistema", JOptionPane.ERROR_MESSAGE);
            return;
        }
        new AplicacionGui(datos).iniciar();
    }

    private static void mostrarErrorInesperado(Throwable error) {
        error.printStackTrace(); // el detalle queda en la consola
        String mensaje = "Ocurrió un error que la aplicación no esperaba:\n\n"
                + error.getClass().getSimpleName() + ": " + error.getMessage()
                + "\n\nEl detalle quedó en la consola.";
        SwingUtilities.invokeLater(() ->
                JOptionPane.showMessageDialog(null, mensaje, "Error inesperado", JOptionPane.ERROR_MESSAGE));
    }

    /** La que se pase como argumento o, si no, ../datos (desde java/) o datos (desde la raíz del proyecto). */
    private static Path carpetaDeDatos(String[] args) {
        if (args.length > 0) {
            Path indicada = Path.of(args[0]);
            if (Files.isDirectory(indicada)) {
                return indicada;
            }
            return null;
        }
        Path[] candidatas = {Path.of("..", "datos"), Path.of("datos")};
        for (Path candidata : candidatas) {
            if (Files.isDirectory(candidata)) {
                return candidata;
            }
        }
        return null;
    }
}
