package tienda.concurrencia;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import tienda.funcional.ConsultasPedidos;
import tienda.modelo.EstadoPedido;
import tienda.modelo.Pedido;

/**
 * Despachador de la cola de pedidos: procesa en hilos de fondo y avisa cada cambio de estado.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 *
 * Funciona como en la fase 1: un ExecutorService con N hilos y una tarea por pedido. Los pedidos se
 * envían en orden de prioridad, así que los hilos los van tomando en ese orden. Cada cambio se avisa a
 * los observadores registrados con {@link #agregarOyente}. Los avisos llegan desde hilos de trabajo, no
 * desde el hilo de eventos de Swing: la ventana los pasa a su hilo con SwingUtilities.invokeLater.
 * Esta clase no usa Swing, así que se prueba sin ventana.
 */
public final class Despachador {

    // Los oyentes se registran antes de iniciar la primera corrida, por eso basta una lista normal.
    private final List<Consumer<EventoDespacho>> oyentes = new ArrayList<>();
    private final Object cerrojo = new Object();

    private boolean ocupado = false;
    private ExecutorService hilos;
    private Thread coordinador;

    // Datos de la corrida en curso
    private long inicioNanos;
    private int terminados;
    private volatile boolean detenido;
    private volatile String error;

    public void agregarOyente(Consumer<EventoDespacho> oyente) {
        oyentes.add(oyente);
    }

    public boolean enEjecucion() {
        synchronized (cerrojo) {
            return ocupado;
        }
    }

    /** Pedidos que aún tienen estados por recorrer, el de mayor prioridad primero. */
    public static List<Pedido> colaDe(List<Pedido> pedidos) {
        List<Pedido> pendientes = new ArrayList<>();
        for (Pedido pedido : pedidos) {
            if (!ProcesadorEstados.estadosPendientes(pedido.getEstado()).isEmpty()) {
                pendientes.add(pedido);
            }
        }
        return ConsultasPedidos.ordenarPorPrioridad(pendientes);
    }

    /** Arranca una corrida en segundo plano y devuelve la cola que va a procesar. */
    public List<Pedido> iniciar(List<Pedido> pedidos, long retardoMs, int trabajadores) {
        List<Pedido> cola = colaDe(pedidos);
        if (cola.isEmpty()) {
            throw new DespachadorException("No hay pedidos pendientes por procesar.");
        }
        synchronized (cerrojo) {
            if (ocupado) {
                throw new DespachadorException("El despachador ya está procesando la cola.");
            }
            ocupado = true;
            inicioNanos = System.nanoTime();
            terminados = 0;
            detenido = false;
            error = null;
            hilos = Executors.newFixedThreadPool(Math.min(trabajadores, cola.size()));
            coordinador = new Thread(() -> correr(cola, retardoMs), "Despachador");
            coordinador.setDaemon(true);
            coordinador.start();
        }
        return cola;
    }

    /** Cancela la corrida en curso. Los pedidos quedan en el estado que ya alcanzaron. */
    public void detener() {
        synchronized (cerrojo) {
            if (ocupado) {
                detenido = true;
                hilos.shutdownNow(); // interrumpe los hilos que están esperando y descarta las tareas que no empezaron
            }
        }
    }

    /** Bloquea hasta que termine la corrida (lo usan las pruebas y el cierre de la ventana). */
    public void esperar(long timeoutMs) {
        Thread hilo;
        synchronized (cerrojo) {
            hilo = coordinador;
        }
        if (hilo != null) {
            try {
                hilo.join(timeoutMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    // --- hilo coordinador ---------------------------------------------------------------

    private void correr(List<Pedido> cola, long retardoMs) {
        int transiciones = 0;
        for (Pedido pedido : cola) {
            transiciones += ProcesadorEstados.estadosPendientes(pedido.getEstado()).size();
        }
        avisar(TipoEvento.CORRIDA_INICIADA, "", 0, null, null, String.valueOf(cola.size()), null);

        try {
            for (Pedido pedido : cola) {
                hilos.submit(() -> atender(pedido, retardoMs));
            }
        } catch (RejectedExecutionException e) {
            // Se pulsó Detener antes de terminar de enviar las tareas: detener() ya cerró el ejecutor.
        }
        hilos.shutdown(); // no se aceptan más tareas; las que ya se enviaron se terminan
        try {
            hilos.awaitTermination(1, TimeUnit.HOURS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Se libera antes del aviso final: quien lo reciba ya puede iniciar otra corrida.
        synchronized (cerrojo) {
            ocupado = false;
        }
        if (error != null) {
            avisar(TipoEvento.ERROR, "", 0, null, null, error, null);
        } else if (detenido) {
            avisar(TipoEvento.CORRIDA_DETENIDA, "", 0, null, null, terminados + " de " + cola.size(), null);
        } else {
            double tiempoMs = msDesdeElInicio();
            ResumenCorrida resumen = new ResumenCorrida(terminados, tiempoMs, transiciones * retardoMs);
            avisar(TipoEvento.CORRIDA_TERMINADA, "", 0, null, null, "", resumen);
        }
    }

    /** Lo ejecuta uno de los hilos de trabajo: lleva un pedido hasta ENTREGADO avisando cada paso. */
    private void atender(Pedido pedido, long retardoMs) {
        int trabajador = numeroDeTrabajador();
        avisar(TipoEvento.PEDIDO_INICIADO, pedido.getId(), trabajador, null, null, "", null);
        try {
            // El tercer parámetro se llama cada vez que el pedido cambia de estado.
            ProcesadorEstados.avanzarPedido(pedido, retardoMs, (p, anterior, nuevo) ->
                    avisar(TipoEvento.TRANSICION, p.getId(), trabajador, anterior, nuevo, "", null));
        } catch (RuntimeException e) {
            // Si el hilo se interrumpe (botón Detener), la espera lanza una excepción: es normal.
            if (!detenido) {
                error = e.getClass().getSimpleName() + ": " + e.getMessage();
            }
            return;
        }
        synchronized (cerrojo) {
            terminados++;
        }
        avisar(TipoEvento.PEDIDO_TERMINADO, pedido.getId(), trabajador, null, null, "", null);
    }

    // --- ayudas ------------------------------------------------------------------------

    /** Los hilos del ExecutorService se llaman «pool-1-thread-3»: el último número es el del trabajador. */
    private static int numeroDeTrabajador() {
        String nombre = Thread.currentThread().getName();
        return Integer.parseInt(nombre.substring(nombre.lastIndexOf('-') + 1));
    }

    private double msDesdeElInicio() {
        return Math.round((System.nanoTime() - inicioNanos) / 100_000.0) / 10.0;
    }

    private void avisar(TipoEvento tipo, String pedidoId, int trabajador, EstadoPedido anterior,
                        EstadoPedido nuevo, String detalle, ResumenCorrida resumen) {
        EventoDespacho evento = new EventoDespacho(
                tipo, pedidoId, trabajador, anterior, nuevo, detalle, msDesdeElInicio(), resumen);
        for (Consumer<EventoDespacho> oyente : oyentes) {
            try {
                oyente.accept(evento);
            } catch (RuntimeException e) {
                // Un observador defectuoso no debe detener el procesamiento de los pedidos.
                System.err.println("Oyente del despachador falló: " + e);
            }
        }
    }
}
