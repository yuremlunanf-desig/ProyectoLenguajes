'use strict';

/**
 * Mide las tres implementaciones con distintos volúmenes de pedidos y guarda dashboard/datos/volumenes.json,
 * que es lo que dibuja la gráfica «Qué pasa cuando crece el volumen de pedidos».
 *
 * Responsable: Leonardo (gráficas de rendimiento).
 *
 * Uso, desde la raíz del proyecto:
 *     node dashboard/medir_volumenes.js              volúmenes por defecto: 5, 100, 200, 300 y 400 pedidos
 *     node dashboard/medir_volumenes.js 5 50 100     otros volúmenes (múltiplos de 5, para poder verificar el total)
 *
 * Cómo funciona:
 *   1. Con los 5 pedidos de datos/solicitudes_pequenas.json arma archivos más grandes repitiéndolos con ids nuevos
 *      (el 5.º pedido de cada grupo sigue siendo inválido, así que siempre se rechaza el 20 %).
 *   2. Corre la versión de consola de cada lenguaje con ese archivo (python main.py <archivo>, etc.).
 *   3. Lee el resultados_metricas.json que cada una escribe y junta los tiempos.
 *   4. Verifica que los tres den el mismo total (el del archivo base multiplicado por el número de grupos).
 *
 * Las corridas son reales: cada cambio de estado espera 100 ms, así que con 400 pedidos la versión secuencial
 * tarda más de un minuto. Las tres versiones se miden a la vez y los volúmenes uno tras otro (unos 4 minutos).
 * Al terminar se restauran los resultados_metricas.json que había antes, para no perder los del archivo de prueba.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { exec } = require('node:child_process');

const RAIZ = path.join(__dirname, '..');
const ENTRADA_BASE = path.join(RAIZ, 'datos', 'solicitudes_pequenas.json');
const CARPETA_TEMPORAL = path.join(RAIZ, 'datos', '_volumenes_temporal');
const SALIDA = path.join(__dirname, 'datos', 'volumenes.json');
const VOLUMENES_POR_DEFECTO = [5, 100, 200, 300, 400];
const ES_WINDOWS = process.platform === 'win32';

/**
 * Cómo se corre cada lenguaje. Todos se ejecutan desde su carpeta, por eso el archivo de entrada se pasa
 * con una ruta relativa (../datos/...): así no hay problemas con espacios en las rutas.
 */
const LENGUAJES = [
  {
    nombre: 'Python',
    carpeta: 'python',
    comando: (entrada) => `${ES_WINDOWS ? 'python' : 'python3'} main.py ${entrada}`,
  },
  {
    nombre: 'Java',
    carpeta: 'java',
    comando: (entrada) => `${ES_WINDOWS ? '.\\mvnw.cmd' : 'sh mvnw'} -q compile exec:java "-Dexec.args=${entrada}"`,
  },
  {
    nombre: 'JavaScript',
    carpeta: 'javascript',
    comando: (entrada) => `node index.js ${entrada}`,
  },
];

function volumenesPedidos() {
  const pedidos = process.argv.slice(2).map(Number);
  if (pedidos.length === 0) {
    return VOLUMENES_POR_DEFECTO;
  }
  for (const cantidad of pedidos) {
    if (!Number.isInteger(cantidad) || cantidad < 5 || cantidad % 5 !== 0) {
      throw new Error(`Volumen no válido: ${cantidad}. Usa múltiplos de 5 (5, 50, 100…).`);
    }
  }
  return pedidos;
}

/** Arma el contenido de un archivo con `cantidad` pedidos repitiendo los del archivo base. */
function armarPedidos(cantidad) {
  const base = JSON.parse(fs.readFileSync(ENTRADA_BASE, 'utf8')).pedidos;
  const pedidos = [];
  for (let i = 0; i < cantidad; i++) {
    const copia = JSON.parse(JSON.stringify(base[i % base.length]));
    copia.id = `PED-${String(i + 1).padStart(4, '0')}`;
    pedidos.push(copia);
  }
  return { pedidos };
}

function correr(comando, carpeta) {
  return new Promise((resolver, rechazar) => {
    exec(comando, { cwd: carpeta, timeout: 15 * 60 * 1000, maxBuffer: 20 * 1024 * 1024 }, (error, salida, errores) => {
      if (error) {
        rechazar(new Error(`${error.message.trim()}\n${errores}`.trim()));
      } else {
        resolver(salida);
      }
    });
  });
}

/** Corre un lenguaje con un archivo y devuelve su resultados_metricas.json ya leído. */
async function medir(lenguaje, rutaArchivo) {
  const carpeta = path.join(RAIZ, lenguaje.carpeta);
  const entrada = path.relative(carpeta, rutaArchivo).split(path.sep).join('/');
  await correr(lenguaje.comando(entrada), carpeta);
  return JSON.parse(fs.readFileSync(path.join(carpeta, 'resultados_metricas.json'), 'utf8'));
}

const aCentavos = (texto) => Math.round(Number(texto) * 100);
const segundos = (ms) => `${(ms / 1000).toFixed(1)} s`;

async function main() {
  const volumenes = volumenesPedidos();
  const resultados = {};
  const runtimes = {};
  const fallos = {};
  for (const lenguaje of LENGUAJES) {
    resultados[lenguaje.nombre] = [];
  }

  // Los resultados_metricas.json de ahora se guardan para devolverlos al terminar.
  const respaldos = {};
  for (const lenguaje of LENGUAJES) {
    const ruta = path.join(RAIZ, lenguaje.carpeta, 'resultados_metricas.json');
    respaldos[ruta] = fs.existsSync(ruta) ? fs.readFileSync(ruta) : null;
  }

  fs.mkdirSync(CARPETA_TEMPORAL, { recursive: true });
  const totalPorGrupo = {}; // total del archivo base: sirve para verificar los demás volúmenes
  let coinciden = true;

  try {
    console.log(`Midiendo ${volumenes.join(', ')} pedidos en ${LENGUAJES.map((l) => l.nombre).join(', ')}…`);
    for (const cantidad of volumenes) {
      const archivo = path.join(CARPETA_TEMPORAL, `solicitudes_${cantidad}.json`);
      fs.writeFileSync(archivo, JSON.stringify(armarPedidos(cantidad)));

      // Los tres lenguajes corren a la vez: casi todo su tiempo es esperar, así que no se estorban.
      const corridas = await Promise.all(
        LENGUAJES.map(async (lenguaje) => {
          try {
            return { lenguaje, metricas: await medir(lenguaje, archivo) };
          } catch (error) {
            return { lenguaje, error };
          }
        })
      );

      const totales = [];
      for (const { lenguaje, metricas, error } of corridas) {
        if (error) {
          fallos[lenguaje.nombre] = error.message;
          console.log(`  ${cantidad} pedidos · ${lenguaje.nombre}: NO SE PUDO MEDIR\n${error.message}`);
          continue;
        }
        runtimes[lenguaje.nombre] = metricas.runtime;
        totales.push(aCentavos(metricas.ventas.total));
        resultados[lenguaje.nombre].push({
          pedidos: metricas.pedidos.leidos,
          registrados: metricas.pedidos.registrados,
          secuencial_ms: metricas.tiempos_ms.cambio_estados_secuencial,
          concurrente_ms: metricas.tiempos_ms.cambio_estados_concurrente,
          aceleracion: metricas.aceleracion_concurrencia,
          total_vendido: metricas.ventas.total,
        });
        console.log(
          `  ${String(cantidad).padStart(3)} pedidos · ${lenguaje.nombre.padEnd(10)} ` +
            `secuencial ${segundos(metricas.tiempos_ms.cambio_estados_secuencial).padStart(7)} · ` +
            `concurrente ${segundos(metricas.tiempos_ms.cambio_estados_concurrente).padStart(6)} · ` +
            `aceleración ${metricas.aceleracion_concurrencia}× · total $${metricas.ventas.total}`
        );
      }

      // Verificación: todos los lenguajes deben dar el mismo total, y debe ser el del archivo base × grupos.
      if (cantidad === 5 && totales.length > 0) {
        totalPorGrupo.centavos = totales[0];
      }
      for (const total of totales) {
        const esperado = totalPorGrupo.centavos === undefined ? total : totalPorGrupo.centavos * (cantidad / 5);
        if (total !== totales[0] || total !== esperado) {
          coinciden = false;
        }
      }
    }
  } finally {
    // Se devuelven los resultados_metricas.json de antes y se borra la carpeta temporal.
    for (const ruta of Object.keys(respaldos)) {
      if (respaldos[ruta] !== null) {
        fs.writeFileSync(ruta, respaldos[ruta]);
      } else {
        fs.rmSync(ruta, { force: true });
      }
    }
    fs.rmSync(CARPETA_TEMPORAL, { recursive: true, force: true });
  }

  // Una comparación con un lenguaje ausente engañaría: si algo falló, no se escribe el archivo.
  if (Object.keys(fallos).length > 0) {
    throw new Error(`No se pudo medir ${Object.keys(fallos).join(', ')}; no se escribió volumenes.json.`);
  }

  const salida = {
    generado: new Date().toISOString(),
    equipo: { sistema: `${os.type()} ${os.release()}`, procesadores: os.cpus().length, runtimes },
    retardo_por_transicion_ms: 100,
    nota:
      'Cada volumen repite los pedidos de solicitudes_pequenas.json (el 20 % es inválido y se rechaza). ' +
      'El tiempo secuencial crece con el número de pedidos; el concurrente depende de cuántas tareas puede atender a la vez cada lenguaje.',
    volumenes,
    totales_coinciden: coinciden,
    resultados,
  };
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, `${JSON.stringify(salida, null, 2)}\n`, 'utf8');
  console.log(`\nGuardado en ${path.relative(RAIZ, SALIDA)}${coinciden ? ' (los totales coinciden en los tres lenguajes)' : ' (¡ojo: los totales NO coinciden!)'}.`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
