package tienda.funcional;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;
import tienda.negocio.CalculadoraPedido;
import tienda.negocio.Desglose;

/**
 * Consultas sobre colecciones de pedidos en estilo funcional.
 *
 * Responsable: Yurem (Funcional y Testing).
 *
 * Son funciones puras construidas con streams y lambdas: no modifican la
 * lista que reciben, siempre devuelven una nueva.
 */
public final class ConsultasPedidos {

    private ConsultasPedidos() {
    }

    /** Pedidos cuyo cliente coincide por id exacto o por parte del nombre. */
    public static List<Pedido> buscarPorCliente(List<Pedido> pedidos, String criterio) {
        String texto = criterio == null ? "" : criterio.trim().toLowerCase(Locale.ROOT);
        if (texto.isEmpty()) {
            return List.of();
        }
        return pedidos.stream()
                .filter(p -> p.getCliente().getId().equalsIgnoreCase(texto)
                        || p.getCliente().getNombre().toLowerCase(Locale.ROOT).contains(texto))
                .toList();
    }

    public static List<Pedido> filtrarPorEstado(List<Pedido> pedidos, EstadoPedido estado) {
        return pedidos.stream()
                .filter(p -> p.getEstado() == estado)
                .toList();
    }

    public static List<Pedido> ordenarPorFecha(List<Pedido> pedidos, boolean descendente) {
        Comparator<Pedido> porFecha = Comparator.comparing(Pedido::getFecha);
        return pedidos.stream()
                .sorted(descendente ? porFecha.reversed() : porFecha)
                .toList();
    }

    /** Primero la prioridad más alta; a igual prioridad, el pedido más antiguo. */
    public static List<Pedido> ordenarPorPrioridad(List<Pedido> pedidos) {
        return pedidos.stream()
                .sorted(Comparator.comparing(Pedido::getPrioridad).thenComparing(Pedido::getFecha))
                .toList();
    }

    public static List<String> ids(List<Pedido> pedidos) {
        return pedidos.stream()
                .map(Pedido::getId)
                .toList();
    }

    public static Map<EstadoPedido, Long> contarPorEstado(List<Pedido> pedidos) {
        return pedidos.stream()
                .collect(Collectors.groupingBy(
                        Pedido::getEstado,
                        () -> new EnumMap<>(EstadoPedido.class),
                        Collectors.counting()));
    }

    /** Suma un importe de cada desglose, por ejemplo: Desglose::iva. */
    public static BigDecimal sumarImportes(Collection<Desglose> desgloses,
                                           Function<Desglose, BigDecimal> selector) {
        return desgloses.stream()
                .map(selector)
                .reduce(new BigDecimal("0.00"), BigDecimal::add);
    }

    public static BigDecimal totalVendido(List<Pedido> pedidos) {
        List<Desglose> desgloses = pedidos.stream()
                .map(CalculadoraPedido::desglose)
                .toList();
        return sumarImportes(desgloses, Desglose::total);
    }
}
