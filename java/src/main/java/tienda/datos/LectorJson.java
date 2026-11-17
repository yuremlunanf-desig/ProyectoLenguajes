package tienda.datos;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import tienda.modelo.Cliente;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;
import tienda.modelo.Prioridad;
import tienda.modelo.Producto;
import tienda.modelo.TipoCliente;
import tienda.modelo.TipoEnvio;

/**
 * Lectura y parseo del JSON de solicitudes a objetos del dominio.
 *
 * Responsable: Ian (Modelos y Datos).
 *
 * El lector no valida reglas de negocio: entrega los pedidos tal como vienen
 * en el archivo y deja la validación al paquete tienda.negocio.
 */
public final class LectorJson {

    private LectorJson() {
    }

    /** Lee el archivo JSON y devuelve la lista de pedidos que contiene. */
    public static List<Pedido> leerPedidos(Path ruta) throws IOException {
        try (Reader lector = Files.newBufferedReader(ruta, StandardCharsets.UTF_8)) {
            JsonObject raiz = JsonParser.parseReader(lector).getAsJsonObject();
            List<Pedido> pedidos = new ArrayList<>();
            for (JsonElement elemento : arreglo(raiz, "pedidos")) {
                pedidos.add(aPedido(elemento.getAsJsonObject()));
            }
            return pedidos;
        }
    }

    private static Pedido aPedido(JsonObject d) {
        List<Producto> productos = new ArrayList<>();
        for (JsonElement elemento : arreglo(d, "productos")) {
            productos.add(aProducto(elemento.getAsJsonObject()));
        }
        return new Pedido(
                d.get("id").getAsString(),
                aCliente(d.getAsJsonObject("cliente")),
                LocalDateTime.parse(d.get("fecha").getAsString()),
                productos,
                TipoEnvio.valueOf(texto(d, "envio", "ESTANDAR")),
                Prioridad.valueOf(texto(d, "prioridad", "MEDIA")),
                EstadoPedido.valueOf(texto(d, "estado", "PENDIENTE")));
    }

    private static Cliente aCliente(JsonObject d) {
        return new Cliente(
                d.get("id").getAsString(),
                d.get("nombre").getAsString(),
                TipoCliente.valueOf(texto(d, "tipo", "REGULAR")));
    }

    private static Producto aProducto(JsonObject d) {
        return new Producto(
                d.get("sku").getAsString(),
                d.get("nombre").getAsString(),
                // getAsBigDecimal lee el precio directo del texto, sin pasar por double.
                d.get("precio").getAsBigDecimal(),
                d.get("cantidad").getAsInt());
    }

    private static JsonArray arreglo(JsonObject d, String campo) {
        return d.has(campo) ? d.getAsJsonArray(campo) : new JsonArray();
    }

    private static String texto(JsonObject d, String campo, String porDefecto) {
        String valor = d.has(campo) ? d.get(campo).getAsString() : porDefecto;
        return valor.toUpperCase(Locale.ROOT);
    }
}
