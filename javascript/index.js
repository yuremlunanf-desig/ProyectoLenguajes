'use strict';

/**
 * Punto de entrada: registra pedidos, consulta, cambia estados y exporta métricas.
 *
 * Responsable: Edsson (Concurrencia y Main).
 *
 * Uso (desde la carpeta javascript/):
 *     node index.js [ruta_del_json]
 *
 * Genera javascript/resultados_metricas.json con los tiempos y totales de la corrida.
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { EstadoPedido } = require('./src/modelos');
const { leerPedidos } = require('./src/lectorJson');
const { CalculadoraPedido, PedidoInvalidoError, formatearCentavos } = require('./src/negocio');
const {
  buscarPorCliente,
  contarPorEstado,
  filtrarPorEstado,
  ids,
  ordenarPorFecha,
  ordenarPorPrioridad,
  sumarImportes,
} = require('./src/funcional');
const {
  RETARDO_TRANSICION_MS,
  procesarConcurrente,
  procesarSecuencial,
} = require('./src/concurrencia');

const ENTRADA_POR_DEFECTO = path.join(__dirname, '..', 'datos', 'solicitudes_pequenas.json');
const SALIDA = path.join(__dirname, 'resultados_metricas.json');
const CLIENTE_DE_EJEMPLO = 'C001';

const redondear3 = (valor) => Math.round(valor * 1000) / 1000;
const msDesde = (inicio) => redondear3(performance.now() - inicio);

/** Fecha y hora local en formato ISO sin zona: 2026-11-11T10:20:30. */
function fechaLocal() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 19);
}

/** Valida y calcula cada pedido. Devuelve { registrados, desgloses, rechazos }. */
function registrar(pedidos) {
  const registrados = [];
  const desgloses = new Map();
  const rechazos = [];
  for (const pedido of pedidos) {
    try {
      desgloses.set(pedido.id, CalculadoraPedido.desglose(pedido));
      registrados.push(pedido);
    } catch (error) {
      if (!(error instanceof PedidoInvalidoError)) {
        throw error;
      }
      rechazos.push({ id: pedido.id, motivo: error.message });
    }
  }
  return { registrados, desgloses, rechazos };
}

/** Corre el flujo completo y devuelve las métricas de la corrida. */
async function ejecutar(rutaEntrada) {
  const inicioTotal = performance.now();

  let inicio = performance.now();
  const leidos = await leerPedidos(rutaEntrada);
  const msLectura = msDesde(inicio);

  inicio = performance.now();
  const { registrados, desgloses, rechazos } = registrar(leidos);
  const msRegistro = msDesde(inicio);

  inicio = performance.now();
  const consultas = {
    cliente: CLIENTE_DE_EJEMPLO,
    pedidos_del_cliente: ids(buscarPorCliente(registrados, CLIENTE_DE_EJEMPLO)),
    pendientes: ids(filtrarPorEstado(registrados, EstadoPedido.PENDIENTE)),
    orden_por_fecha: ids(ordenarPorFecha(registrados)),
    orden_por_prioridad: ids(ordenarPorPrioridad(registrados)),
  };
  const msConsultas = msDesde(inicio);

  const estadosIniciales = new Map(registrados.map((p) => [p.id, p.estado]));
  const conteoInicial = contarPorEstado(registrados);

  // Línea base: los mismos cambios de estado, un pedido tras otro.
  inicio = performance.now();
  await procesarSecuencial(registrados);
  const msSecuencial = msDesde(inicio);

  // Se restauran los estados para repetir la simulación de forma concurrente.
  registrados.forEach((pedido) => pedido.cambiarEstado(estadosIniciales.get(pedido.id)));

  inicio = performance.now();
  const resultados = await procesarConcurrente(registrados);
  const msConcurrente = msDesde(inicio);

  const importes = [...desgloses.values()];
  return {
    lenguaje: 'JavaScript',
    runtime: `Node.js ${process.versions.node}`,
    modelo_concurrencia: 'async/await (promesas con Promise.all)',
    fecha_ejecucion: fechaLocal(),
    archivo_entrada: path.basename(rutaEntrada),
    pedidos: {
      leidos: leidos.length,
      registrados: registrados.length,
      rechazados: rechazos.length,
    },
    rechazos,
    retardo_por_transicion_ms: RETARDO_TRANSICION_MS,
    tiempos_ms: {
      lectura_json: msLectura,
      validacion_y_calculo: msRegistro,
      consultas_funcionales: msConsultas,
      cambio_estados_secuencial: msSecuencial,
      cambio_estados_concurrente: msConcurrente,
      total: msDesde(inicioTotal),
    },
    aceleracion_concurrencia:
      msConcurrente > 0 ? Math.round((msSecuencial / msConcurrente) * 100) / 100 : null,
    ventas: {
      subtotal: formatearCentavos(sumarImportes(importes, (d) => d.subtotal)),
      descuentos: formatearCentavos(sumarImportes(importes, (d) => d.descuento)),
      iva: formatearCentavos(sumarImportes(importes, (d) => d.iva)),
      envio: formatearCentavos(sumarImportes(importes, (d) => d.envio)),
      total: formatearCentavos(sumarImportes(importes, (d) => d.total)),
    },
    consultas,
    estados_iniciales: conteoInicial,
    estados_finales: contarPorEstado(registrados),
    detalle_pedidos: registrados.map((pedido, i) => {
      const desglose = desgloses.get(pedido.id);
      const resultado = resultados[i];
      return {
        id: pedido.id,
        cliente: pedido.cliente.nombre,
        prioridad: pedido.prioridad,
        tipo_envio: pedido.envio,
        subtotal: formatearCentavos(desglose.subtotal),
        descuento: formatearCentavos(desglose.descuento),
        iva: formatearCentavos(desglose.iva),
        envio: formatearCentavos(desglose.envio),
        total: formatearCentavos(desglose.total),
        estado_inicial: resultado.estadoInicial,
        estado_final: resultado.estadoFinal,
        transiciones: resultado.transiciones,
        duracion_ms: redondear3(resultado.duracionMs),
      };
    }),
  };
}

function imprimirReporte(metricas) {
  const { pedidos, tiempos_ms: tiempos, consultas } = metricas;

  console.log(`=== Automatización de pedidos (${metricas.runtime}) ===`);
  console.log(
    `Pedidos leídos: ${pedidos.leidos} | registrados: ${pedidos.registrados} ` +
      `| rechazados: ${pedidos.rechazados}`
  );
  metricas.rechazos.forEach((rechazo) => console.log(`  [RECHAZADO] ${rechazo.motivo}`));

  console.log();
  console.log(
    'ID'.padEnd(9) +
      'Cliente'.padEnd(18) +
      'Subtotal'.padStart(10) +
      'Descuento'.padStart(11) +
      'IVA'.padStart(10) +
      'Envío'.padStart(9) +
      'Total'.padStart(11) +
      '  Estado'
  );
  metricas.detalle_pedidos.forEach((fila) =>
    console.log(
      fila.id.padEnd(9) +
        fila.cliente.padEnd(18) +
        fila.subtotal.padStart(10) +
        fila.descuento.padStart(11) +
        fila.iva.padStart(10) +
        fila.envio.padStart(9) +
        fila.total.padStart(11) +
        `  ${fila.estado_inicial} -> ${fila.estado_final}`
    )
  );
  console.log(`Total vendido: $${metricas.ventas.total}`);

  console.log();
  console.log('Consultas (estilo funcional):');
  console.log(`  Pedidos del cliente ${consultas.cliente}: ${consultas.pedidos_del_cliente.join(', ')}`);
  console.log(`  Pendientes:          ${consultas.pendientes.join(', ')}`);
  console.log(`  Orden por fecha:     ${consultas.orden_por_fecha.join(', ')}`);
  console.log(`  Orden por prioridad: ${consultas.orden_por_prioridad.join(', ')}`);

  console.log();
  console.log(`Cambio de estados (${metricas.retardo_por_transicion_ms} ms por transición):`);
  console.log(`  Secuencial:  ${tiempos.cambio_estados_secuencial} ms`);
  console.log(
    `  Concurrente: ${tiempos.cambio_estados_concurrente} ms ` +
      `(aceleración x${metricas.aceleracion_concurrencia})`
  );
  console.log(`Tiempo total: ${tiempos.total} ms`);
  console.log(`Métricas exportadas en: ${SALIDA}`);
}

async function main() {
  const rutaEntrada = process.argv[2] ? path.resolve(process.argv[2]) : ENTRADA_POR_DEFECTO;
  const metricas = await ejecutar(rutaEntrada);
  await fs.writeFile(SALIDA, `${JSON.stringify(metricas, null, 2)}\n`, 'utf8');
  imprimirReporte(metricas);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
