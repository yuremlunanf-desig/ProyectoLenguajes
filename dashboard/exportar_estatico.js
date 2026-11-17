'use strict';

/**
 * Prepara el dashboard para publicarlo como sitio estático (GitHub Pages, Netlify, Cloudflare Pages...), sin
 * servidor Express.
 *
 * Responsable: Edsson.
 *
 * Uso, desde la raíz del proyecto:
 *     node dashboard/exportar_estatico.js [carpetaDestino] [--reemplazar]
 *     node dashboard/exportar_estatico.js --solo-datos      (solo actualiza dashboard/datos/datos-fijos.js)
 *
 * Con --solo-datos no se copia nada: sirve para abrir dashboard/index.html con doble clic, sin servidor, y verlo con
 * las métricas al día (lo hace abrir_dashboard.bat, en la raíz del proyecto).
 *
 * Qué hace:
 *   1. Lee los tres resultados_metricas.json y cuenta las líneas de código igual que el servidor
 *      (javascript/src/metricasProyecto.js), y toma también las mediciones por volumen (datos/volumenes.json).
 *   2. Guarda esa «foto» en dashboard/datos/datos-fijos.js; js/datos.js la usa cuando no hay servidor. Va como
 *      script (window.DATOS_FIJOS = {...}) y no como JSON porque así la página también funciona al abrirla con
 *      doble clic: un navegador no deja leer JSON desde file://, pero sí cargar scripts.
 *   3. Copia index.html, css/, js/ y datos/ a la carpeta destino (por defecto «tablero-estatico/» en la raíz del
 *      proyecto), lista para subirla.
 *
 * Cuando cambien los resultados o el código, se vuelve a ejecutar y se vuelve a subir la carpeta.
 */

const fs = require('node:fs');
const path = require('node:path');
const { leerProyecto } = require('../javascript/src/metricasProyecto');

const RAIZ = path.join(__dirname, '..');
const ELEMENTOS = ['index.html', 'css', 'js', 'datos']; // lo único que necesita la página

const LEEME = `Dashboard comparativo (Python, Java y JavaScript): copia estática
=====================================================================

Esta carpeta es un sitio web completo: no necesita servidor. Se puede abrir con doble clic en index.html
o publicarla en internet.

Cómo publicarla gratis:
  - Netlify Drop: entra a https://app.netlify.com/drop y arrastra esta carpeta.
  - GitHub Pages: sube el contenido de esta carpeta a un repositorio y activa Pages (Settings > Pages).
  - Cloudflare Pages: crea un proyecto y sube la carpeta con «Direct upload».

Las gráficas y los diagramas se cargan desde jsDelivr (Chart.js y Mermaid), así que quien abra la página
necesita internet. Los datos son una copia fija: se regeneran con «node dashboard/exportar_estatico.js».
`;

function main() {
  const argumentos = process.argv.slice(2);
  const reemplazar = argumentos.includes('--reemplazar');
  const soloDatos = argumentos.includes('--solo-datos');
  const pedido = argumentos.find((a) => !a.startsWith('--'));
  const destino = path.resolve(pedido || path.join(RAIZ, 'tablero-estatico'));

  // No se borra nada que no sea una salida anterior de este mismo script.
  if (!soloDatos && fs.existsSync(destino) && fs.readdirSync(destino).length > 0) {
    const esSalidaAnterior = fs.existsSync(path.join(destino, 'index.html')) && fs.existsSync(path.join(destino, 'datos', 'datos-fijos.js'));
    if (!reemplazar || !esSalidaAnterior) {
      console.error(
        `La carpeta «${destino}» ya existe y no está vacía. ` +
          (esSalidaAnterior ? 'Agrega --reemplazar para sobrescribirla.' : 'Elige otra carpeta o vacíala.')
      );
      process.exitCode = 1;
      return;
    }
    fs.rmSync(destino, { recursive: true, force: true });
  }

  leerProyecto(RAIZ)
    .then((proyecto) => {
      const faltan = proyecto.lenguajes.filter((l) => l.metricas === null).map((l) => l.lenguaje);
      if (faltan.length > 0) {
        throw new Error(`Faltan resultados_metricas.json de: ${faltan.join(', ')}. Ejecuta primero cada programa de consola.`);
      }
      // Los volúmenes son opcionales: sin ellos la página solo oculta esa gráfica.
      let volumenes = null;
      try {
        volumenes = JSON.parse(fs.readFileSync(path.join(__dirname, 'datos', 'volumenes.json'), 'utf8'));
      } catch (error) {
        console.warn('Aviso: no se encontró datos/volumenes.json; la copia no tendrá la gráfica por volumen.');
      }
      const copia = { proyecto, volumenes };
      fs.writeFileSync(
        path.join(__dirname, 'datos', 'datos-fijos.js'),
        `// Generado por dashboard/exportar_estatico.js: copia fija de los datos. No se edita a mano.\nwindow.DATOS_FIJOS = ${JSON.stringify(copia, null, 2)};\n`,
        'utf8'
      );
      if (soloDatos) {
        console.log(`Datos actualizados (${proyecto.generado}): dashboard/datos/datos-fijos.js`);
        return;
      }

      fs.mkdirSync(destino, { recursive: true });
      for (const elemento of ELEMENTOS) {
        fs.cpSync(path.join(__dirname, elemento), path.join(destino, elemento), { recursive: true });
      }
      fs.writeFileSync(path.join(destino, 'LEEME.txt'), LEEME, 'utf8');
      console.log(`Listo: ${destino}`);
      console.log(`Datos del ${proyecto.generado} (${proyecto.lenguajes.map((l) => `${l.lenguaje} ${l.loc.codigo} LOC`).join(', ')}).`);
    })
    .catch((error) => {
      console.error(`No se pudo exportar: ${error.message}`);
      process.exitCode = 1;
    });
}

main();
