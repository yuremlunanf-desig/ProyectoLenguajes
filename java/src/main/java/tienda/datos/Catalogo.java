package tienda.datos;

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
 * Lectura de datos/catalogo.json: los productos que ofrece el formulario de pedidos.
 *
 * Responsable: Edsson (Formularios).
 */
public final class Catalogo {

    private Catalogo() {
    }

    /** Lee el catálogo. Lanza CatalogoException (con mensaje legible) si no se puede. */
    public static List<ItemCatalogo> leer(Path ruta) {
        try (Reader lector = Files.newBufferedReader(ruta, StandardCharsets.UTF_8)) {
            List<ItemCatalogo> items = new ArrayList<>();
            for (JsonElement elemento : JsonParser.parseReader(lector).getAsJsonObject().getAsJsonArray("productos")) {
                JsonObject p = elemento.getAsJsonObject();
                items.add(new ItemCatalogo(
                        p.get("sku").getAsString(),
                        p.get("nombre").getAsString(),
                        // getAsBigDecimal lee el precio directo del texto, sin pasar por double.
                        p.get("precio").getAsBigDecimal()));
            }
            return List.copyOf(items);
        } catch (NoSuchFileException error) {
            throw new CatalogoException("No se encontró el catálogo de productos: " + ruta, error);
        } catch (IOException | RuntimeException error) {
            String motivo = error instanceof NullPointerException ? "falta un campo obligatorio" : error.getMessage();
            throw new CatalogoException("El catálogo " + ruta + " tiene un formato inválido (" + motivo + ").", error);
        }
    }
}
