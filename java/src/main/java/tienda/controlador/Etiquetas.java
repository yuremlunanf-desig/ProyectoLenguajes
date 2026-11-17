package tienda.controlador;

import java.math.BigDecimal;
import java.util.Locale;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Prioridad;
import tienda.modelo.TipoCliente;
import tienda.modelo.TipoEnvio;
import tienda.negocio.CalculadoraPedido;

/**
 * Textos que se muestran al usuario para cada valor de los enumerados del dominio.
 *
 * Responsable: Ian (Login): infraestructura compartida de la GUI.
 */
public final class Etiquetas {

    private Etiquetas() {
    }

    public static String estado(EstadoPedido estado) {
        switch (estado) {
            case PENDIENTE:
                return "Pendiente";
            case EN_PROCESO:
                return "En proceso";
            case ENVIADO:
                return "Enviado";
            case ENTREGADO:
                return "Entregado";
            default:
                return "Cancelado";
        }
    }

    public static String prioridad(Prioridad prioridad) {
        switch (prioridad) {
            case ALTA:
                return "Alta";
            case MEDIA:
                return "Media";
            default:
                return "Baja";
        }
    }

    public static String tipoCliente(TipoCliente tipo) {
        if (tipo == TipoCliente.FRECUENTE) {
            return "Frecuente";
        }
        return "Regular";
    }

    public static String envio(TipoEnvio envio) {
        if (envio == TipoEnvio.EXPRESS) {
            return "Express";
        }
        return "Estándar";
    }

    /** «Estándar ($50)». El costo sale de CalculadoraPedido para no repetir la regla. */
    public static String envioConCosto(TipoEnvio envio) {
        BigDecimal costo = CalculadoraPedido.ENVIO_ESTANDAR;
        if (envio == TipoEnvio.EXPRESS) {
            costo = CalculadoraPedido.ENVIO_EXPRESS;
        }
        return String.format(Locale.US, "%s ($%,.0f)", envio(envio), costo);
    }

    /** Del texto que ve el usuario al estado del dominio (null si no coincide). */
    public static EstadoPedido estadoDesdeTexto(String texto) {
        for (EstadoPedido estado : EstadoPedido.values()) {
            if (estado(estado).equals(texto)) {
                return estado;
            }
        }
        return null;
    }

    // Los selectores de la ventana muestran estos textos, en el mismo orden que los valores del enumerado.

    public static String[] tiposCliente() {
        TipoCliente[] valores = TipoCliente.values();
        String[] textos = new String[valores.length];
        for (int i = 0; i < valores.length; i++) {
            textos[i] = tipoCliente(valores[i]);
        }
        return textos;
    }

    public static String[] prioridades() {
        Prioridad[] valores = Prioridad.values();
        String[] textos = new String[valores.length];
        for (int i = 0; i < valores.length; i++) {
            textos[i] = prioridad(valores[i]);
        }
        return textos;
    }

    public static String[] envios() {
        TipoEnvio[] valores = TipoEnvio.values();
        String[] textos = new String[valores.length];
        for (int i = 0; i < valores.length; i++) {
            textos[i] = envioConCosto(valores[i]);
        }
        return textos;
    }

    public static String dinero(BigDecimal importe) {
        return String.format(Locale.US, "$%,.2f", importe);
    }
}
