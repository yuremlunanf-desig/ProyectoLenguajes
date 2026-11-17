package tienda.concurrencia;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;

/**
 * Cambio de estado de los pedidos con varios hilos.
 *
 * Responsable: Edsson (Concurrencia y Main).
 *
 * Cada pedido avanza por el flujo PENDIENTE -> EN_PROCESO -> ENVIADO -> ENTREGADO.
 * Cada transición tarda un tiempo simulado (almacén, paquetería). En modo
 * concurrente cada pedido se atiende en un hilo de un ExecutorService mediante
 * CompletableFuture; en modo secuencial se atiende un pedido tras otro y sirve
 * como línea base.
 */
public final class ProcesadorEstados {

    public static final List<EstadoPedido> FLUJO_ESTADOS = List.of(
            EstadoPedido.PENDIENTE,
            EstadoPedido.EN_PROCESO,
            EstadoPedido.ENVIADO,
            EstadoPedido.ENTREGADO);
    public static final long RETARDO_TRANSICION_MS = 100;
    private static final int MAXIMO_HILOS = 16;

    private ProcesadorEstados() {
    }

    /** Estados que le faltan recorrer a un pedido (vacío si ya terminó o se canceló). */
    public static List<EstadoPedido> estadosPendientes(EstadoPedido estado) {
        int posicion = FLUJO_ESTADOS.indexOf(estado);
        return posicion < 0 ? List.of() : FLUJO_ESTADOS.subList(posicion + 1, FLUJO_ESTADOS.size());
    }

    /** Lleva un pedido hasta ENTREGADO, esperando retardoMs en cada transición. */
    public static ResultadoProcesamiento avanzarPedido(Pedido pedido, long retardoMs) {
        return avanzarPedido(pedido, retardoMs, null);
    }

    /**
     * Igual que la anterior, pero avisa a {@code oyente} (opcional) después de cada transición.
     * La interfaz gráfica lo usa para enterarse en tiempo real; con {@code null} no cambia nada.
     */
    public static ResultadoProcesamiento avanzarPedido(
            Pedido pedido, long retardoMs, OyenteTransicion oyente) {
        long inicio = System.nanoTime();
        EstadoPedido estadoInicial = pedido.getEstado();
        List<String> transiciones = new ArrayList<>();
        for (EstadoPedido siguiente : estadosPendientes(estadoInicial)) {
            pausar(retardoMs);
            EstadoPedido anterior = pedido.getEstado();
            transiciones.add(anterior + "->" + siguiente);
            pedido.cambiarEstado(siguiente);
            if (oyente != null) {
                oyente.alCambiarEstado(pedido, anterior, siguiente);
            }
        }
        double duracionMs = (System.nanoTime() - inicio) / 1_000_000.0;
        return new ResultadoProcesamiento(
                pedido.getId(), estadoInicial, pedido.getEstado(), List.copyOf(transiciones), duracionMs);
    }

    /** Avanza todos los pedidos a la vez. Los resultados salen en el orden de entrada. */
    public static List<ResultadoProcesamiento> procesarConcurrente(List<Pedido> pedidos, long retardoMs) {
        if (pedidos.isEmpty()) {
            return List.of();
        }
        ExecutorService hilos = Executors.newFixedThreadPool(Math.min(pedidos.size(), MAXIMO_HILOS));
        try {
            List<CompletableFuture<ResultadoProcesamiento>> tareas = pedidos.stream()
                    .map(pedido -> CompletableFuture.supplyAsync(() -> avanzarPedido(pedido, retardoMs), hilos))
                    .toList();
            return tareas.stream()
                    .map(CompletableFuture::join)
                    .toList();
        } finally {
            hilos.shutdown();
        }
    }

    /** Avanza los pedidos uno por uno (línea base para medir la aceleración). */
    public static List<ResultadoProcesamiento> procesarSecuencial(List<Pedido> pedidos, long retardoMs) {
        return pedidos.stream()
                .map(pedido -> avanzarPedido(pedido, retardoMs))
                .toList();
    }

    private static void pausar(long milisegundos) {
        try {
            Thread.sleep(milisegundos);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Se interrumpió el cambio de estado.", e);
        }
    }
}
