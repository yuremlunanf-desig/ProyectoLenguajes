package tienda;

import static tienda.concurrencia.ProcesadorEstados.RETARDO_TRANSICION_MS;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import tienda.concurrencia.ProcesadorEstados;
import tienda.concurrencia.ResultadoProcesamiento;
import tienda.datos.LectorJson;
import tienda.funcional.ConsultasPedidos;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;
import tienda.negocio.CalculadoraPedido;
import tienda.negocio.Desglose;
import tienda.negocio.PedidoInvalidoException;

/**
 * Punto de entrada: registra pedidos, consulta, cambia estados y exporta métricas.
 *
 * Responsable: Edsson (Concurrencia y Main).
 *
 * Uso (desde la carpeta java/):
 *     mvn -q compile exec:java
 *     mvn -q compile exec:java -Dexec.args="ruta_del_json"
 *
 * Genera java/resultados_metricas.json con los tiempos y totales de la corrida.
 */
public final class Main {

    private static final Path ENTRADA_POR_DEFECTO = Path.of("..", "datos", "solicitudes_pequenas.json");
    private static final Path SALIDA = Path.of("resultados_metricas.json");
    private static final String CLIENTE_DE_EJEMPLO = "C001";
    private static final DateTimeFormatter FORMATO_FECHA =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    /** Resultado de validar y calcular los pedidos leídos. */
    private record Registro(
            List<Pedido> registrados,
            Map<String, Desglose> desgloses,
            List<Map<String, Object>> rechazos) {
    }

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        Path entrada = args.length > 0 ? Path.of(args[0]) : ENTRADA_POR_DEFECTO;
        long inicioTotal = System.nanoTime();

        long inicio = System.nanoTime();
        List<Pedido> leidos = LectorJson.leerPedidos(entrada);
        double msLectura = msDesde(inicio);

        inicio = System.nanoTime();
        Registro registro = registrar(leidos);
        double msRegistro = msDesde(inicio);
        List<Pedido> registrados = registro.registrados();

        inicio = System.nanoTime();
        List<String> delCliente =
                ConsultasPedidos.ids(ConsultasPedidos.buscarPorCliente(registrados, CLIENTE_DE_EJEMPLO));
        List<String> pendientes =
                ConsultasPedidos.ids(ConsultasPedidos.filtrarPorEstado(registrados, EstadoPedido.PENDIENTE));
        List<String> porFecha = ConsultasPedidos.ids(ConsultasPedidos.ordenarPorFecha(registrados, false));
        List<String> porPrioridad = ConsultasPedidos.ids(ConsultasPedidos.ordenarPorPrioridad(registrados));
        double msConsultas = msDesde(inicio);

        Map<String, EstadoPedido> estadosIniciales = registrados.stream()
                .collect(Collectors.toMap(Pedido::getId, Pedido::getEstado));
        Map<EstadoPedido, Long> conteoInicial = ConsultasPedidos.contarPorEstado(registrados);

        // Línea base: los mismos cambios de estado, un pedido tras otro.
        inicio = System.nanoTime();
        ProcesadorEstados.procesarSecuencial(registrados, RETARDO_TRANSICION_MS);
        double msSecuencial = msDesde(inicio);

        // Se restauran los estados para repetir la simulación de forma concurrente.
        registrados.forEach(pedido -> pedido.cambiarEstado(estadosIniciales.get(pedido.getId())));

        inicio = System.nanoTime();
        List<ResultadoProcesamiento> resultados =
                ProcesadorEstados.procesarConcurrente(registrados, RETARDO_TRANSICION_MS);
        double msConcurrente = msDesde(inicio);
        Double aceleracion = msConcurrente > 0
                ? Math.round(msSecuencial / msConcurrente * 100) / 100.0
                : null;

        Collection<Desglose> importes = registro.desgloses().values();
        String totalVendido = ConsultasPedidos.sumarImportes(importes, Desglose::total).toPlainString();
        String runtime = "Java " + System.getProperty("java.version");

        List<Map<String, Object>> detalle = new ArrayList<>();
        for (int i = 0; i < registrados.size(); i++) {
            Pedido pedido = registrados.get(i);
            Desglose desglose = registro.desgloses().get(pedido.getId());
            ResultadoProcesamiento resultado = resultados.get(i);
            detalle.add(mapa(
                    "id", pedido.getId(),
                    "cliente", pedido.getCliente().getNombre(),
                    "prioridad", pedido.getPrioridad().name(),
                    "tipo_envio", pedido.getEnvio().name(),
                    "subtotal", desglose.subtotal().toPlainString(),
                    "descuento", desglose.descuento().toPlainString(),
                    "iva", desglose.iva().toPlainString(),
                    "envio", desglose.envio().toPlainString(),
                    "total", desglose.total().toPlainString(),
                    "estado_inicial", resultado.estadoInicial().name(),
                    "estado_final", resultado.estadoFinal().name(),
                    "transiciones", resultado.transiciones(),
                    "duracion_ms", redondear3(resultado.duracionMs())));
        }

        double msTotal = msDesde(inicioTotal);
        Map<String, Object> metricas = mapa(
                "lenguaje", "Java",
                "runtime", runtime,
                "modelo_concurrencia", "hilos (ExecutorService con CompletableFuture)",
                "fecha_ejecucion", LocalDateTime.now().format(FORMATO_FECHA),
                "archivo_entrada", entrada.getFileName().toString(),
                "pedidos", mapa(
                        "leidos", leidos.size(),
                        "registrados", registrados.size(),
                        "rechazados", registro.rechazos().size()),
                "rechazos", registro.rechazos(),
                "retardo_por_transicion_ms", RETARDO_TRANSICION_MS,
                "tiempos_ms", mapa(
                        "lectura_json", msLectura,
                        "validacion_y_calculo", msRegistro,
                        "consultas_funcionales", msConsultas,
                        "cambio_estados_secuencial", msSecuencial,
                        "cambio_estados_concurrente", msConcurrente,
                        "total", msTotal),
                "aceleracion_concurrencia", aceleracion,
                "ventas", mapa(
                        "subtotal", ConsultasPedidos.sumarImportes(importes, Desglose::subtotal).toPlainString(),
                        "descuentos", ConsultasPedidos.sumarImportes(importes, Desglose::descuento).toPlainString(),
                        "iva", ConsultasPedidos.sumarImportes(importes, Desglose::iva).toPlainString(),
                        "envio", ConsultasPedidos.sumarImportes(importes, Desglose::envio).toPlainString(),
                        "total", totalVendido),
                "consultas", mapa(
                        "cliente", CLIENTE_DE_EJEMPLO,
                        "pedidos_del_cliente", delCliente,
                        "pendientes", pendientes,
                        "orden_por_fecha", porFecha,
                        "orden_por_prioridad", porPrioridad),
                "estados_iniciales", conteoInicial,
                "estados_finales", ConsultasPedidos.contarPorEstado(registrados),
                "detalle_pedidos", detalle);

        Gson gson = new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().serializeNulls().create();
        Files.writeString(SALIDA, gson.toJson(metricas) + "\n", StandardCharsets.UTF_8);

        System.out.printf("=== Automatización de pedidos (%s) ===%n", runtime);
        System.out.printf("Pedidos leídos: %d | registrados: %d | rechazados: %d%n",
                leidos.size(), registrados.size(), registro.rechazos().size());
        registro.rechazos().forEach(rechazo -> System.out.println("  [RECHAZADO] " + rechazo.get("motivo")));

        System.out.println();
        System.out.printf("%-9s%-18s%10s%11s%10s%9s%11s  %s%n",
                "ID", "Cliente", "Subtotal", "Descuento", "IVA", "Envío", "Total", "Estado");
        for (Map<String, Object> fila : detalle) {
            System.out.printf("%-9s%-18s%10s%11s%10s%9s%11s  %s -> %s%n",
                    fila.get("id"), fila.get("cliente"), fila.get("subtotal"), fila.get("descuento"),
                    fila.get("iva"), fila.get("envio"), fila.get("total"),
                    fila.get("estado_inicial"), fila.get("estado_final"));
        }
        System.out.println("Total vendido: $" + totalVendido);

        System.out.println();
        System.out.println("Consultas (estilo funcional):");
        System.out.println("  Pedidos del cliente " + CLIENTE_DE_EJEMPLO + ": " + String.join(", ", delCliente));
        System.out.println("  Pendientes:          " + String.join(", ", pendientes));
        System.out.println("  Orden por fecha:     " + String.join(", ", porFecha));
        System.out.println("  Orden por prioridad: " + String.join(", ", porPrioridad));

        System.out.println();
        System.out.println("Cambio de estados (" + RETARDO_TRANSICION_MS + " ms por transición):");
        System.out.println("  Secuencial:  " + msSecuencial + " ms");
        System.out.println("  Concurrente: " + msConcurrente + " ms (aceleración x" + aceleracion + ")");
        System.out.println("Tiempo total: " + msTotal + " ms");
        System.out.println("Métricas exportadas en: " + SALIDA.toAbsolutePath().normalize());
    }

    /** Valida y calcula cada pedido; los inválidos quedan en la lista de rechazos. */
    private static Registro registrar(List<Pedido> pedidos) {
        List<Pedido> registrados = new ArrayList<>();
        Map<String, Desglose> desgloses = new LinkedHashMap<>();
        List<Map<String, Object>> rechazos = new ArrayList<>();
        for (Pedido pedido : pedidos) {
            try {
                desgloses.put(pedido.getId(), CalculadoraPedido.desglose(pedido));
                registrados.add(pedido);
            } catch (PedidoInvalidoException error) {
                rechazos.add(mapa("id", pedido.getId(), "motivo", error.getMessage()));
            }
        }
        return new Registro(registrados, desgloses, rechazos);
    }

    /** Arma un mapa ordenado a partir de pares clave, valor (el orden se conserva en el JSON). */
    private static Map<String, Object> mapa(Object... pares) {
        Map<String, Object> mapa = new LinkedHashMap<>();
        for (int i = 0; i < pares.length; i += 2) {
            mapa.put((String) pares[i], pares[i + 1]);
        }
        return mapa;
    }

    private static double msDesde(long inicioNanos) {
        return redondear3((System.nanoTime() - inicioNanos) / 1_000_000.0);
    }

    private static double redondear3(double valor) {
        return Math.round(valor * 1000) / 1000.0;
    }
}
