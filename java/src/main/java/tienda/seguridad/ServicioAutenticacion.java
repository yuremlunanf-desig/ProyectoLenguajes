package tienda.seguridad;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Control de acceso: valida usuario y contraseña contra datos/usuarios.json.
 *
 * Responsable: Ian (Login).
 *
 * Versión sencilla para estudiar: usuarios.json guarda las contraseñas en texto plano y aquí se
 * comparan tal cual. Es solo para este proyecto académico: en un sistema real nunca se guarda la
 * contraseña así, se guarda un hash.
 */
public final class ServicioAutenticacion {

    /** Un usuario tal como viene en usuarios.json. */
    private record Registro(String usuario, String password, String nombre) {
    }

    private final List<Registro> registros = new ArrayList<>();

    /** Lee usuarios.json. Si no existe o está mal escrito lanza AutenticacionException. */
    public ServicioAutenticacion(Path ruta) {
        try (Reader lector = Files.newBufferedReader(ruta, StandardCharsets.UTF_8)) {
            JsonArray lista = JsonParser.parseReader(lector).getAsJsonObject().getAsJsonArray("usuarios");
            for (JsonElement elemento : lista) {
                JsonObject u = elemento.getAsJsonObject();
                String usuario = u.get("usuario").getAsString();
                String nombre = u.has("nombre") ? u.get("nombre").getAsString() : usuario;
                registros.add(new Registro(usuario, u.get("password").getAsString(), nombre));
            }
        } catch (NoSuchFileException error) {
            throw new AutenticacionException("No se encontró el archivo de usuarios: " + ruta);
        } catch (IOException | RuntimeException error) {
            throw new AutenticacionException("El archivo de usuarios " + ruta + " tiene un formato inválido.");
        }
    }

    /** Devuelve el usuario si el nombre y la contraseña coinciden; si no, lanza AutenticacionException. */
    public Usuario autenticar(String usuario, String contrasena) {
        for (Registro registro : registros) {
            if (registro.usuario().equals(usuario.strip()) && registro.password().equals(contrasena)) {
                return new Usuario(registro.usuario(), registro.nombre());
            }
        }
        throw new AutenticacionException("Usuario o contraseña incorrectos.");
    }
}
