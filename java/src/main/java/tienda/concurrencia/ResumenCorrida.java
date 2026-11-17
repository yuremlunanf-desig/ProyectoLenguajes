package tienda.concurrencia;

/**
 * Totales de una corrida del despachador.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 *
 * @param secuencialEstimadoMs lo que habría tardado atender todas las transiciones una tras otra
 */
public record ResumenCorrida(int procesados, double tiempoMs, double secuencialEstimadoMs) {

    /** Veces que fue más rápida la corrida que la línea base secuencial (null si no hay tiempo medido). */
    public Double aceleracion() {
        return tiempoMs > 0 ? Math.round(secuencialEstimadoMs / tiempoMs * 100) / 100.0 : null;
    }
}
