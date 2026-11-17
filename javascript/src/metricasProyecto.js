'use strict';

/**
 * Datos del dashboard comparativo: lee los tres resultados_metricas.json y cuenta las líneas de
 * código (LOC) reales de cada implementación.
 *
 * Responsable: Edsson (métricas).
 *
 * Las LOC son aproximadas: se cuentan las líneas que no están en blanco y no son comentarios
 * (comentarios de línea, bloques /* *\/ y docstrings de Python). Es el mismo criterio para los tres.
 */

const fs = require('node:fs/promises');
const path = require('node:path');

/**
 * Cómo se inspecciona cada lenguaje.
 *  - carpeta / raiz: dónde está el código (relativo a la raíz del proyecto)
 *  - extensiones: qué archivos cuentan como código
 *  - estilo: cómo se escriben los comentarios ('python', 'c' para Java/JS/CSS, 'html')
 *  - esPrueba / esInterfaz: reciben la ruta relativa a `raiz` y dicen si el archivo es una prueba o es parte de la
 *    interfaz (ventanas, páginas); lo que no es ninguna de las dos es modelo y controladores.
 */
const LENGUAJES = [
  {
    lenguaje: 'Python',
    carpeta: 'python',
    raiz: 'python',
    extensiones: ['.py'],
    ignorar: ['__pycache__', '.pytest_cache', '.venv'],
    comoEjecutar: 'python main.py',
    esPrueba: (ruta) => path.basename(ruta).startsWith('test_'),
    esInterfaz: (ruta) => /^gui\/(vista_|estilos|app)/.test(ruta) || ruta === 'main_gui.py',
  },
  {
    lenguaje: 'Java',
    carpeta: 'java',
    raiz: 'java/src',
    extensiones: ['.java'],
    ignorar: [],
    comoEjecutar: '.\\mvnw.cmd -q compile exec:java',
    esPrueba: (ruta) => ruta.startsWith('test/'),
    esInterfaz: (ruta) => ruta.includes('/vista/') || ruta.endsWith('/MainGui.java'),
  },
  {
    lenguaje: 'JavaScript',
    carpeta: 'javascript',
    raiz: 'javascript',
    // En la versión web también cuentan el HTML y el CSS de la interfaz.
    extensiones: ['.js', '.html', '.css'],
    ignorar: ['node_modules', 'coverage'],
    comoEjecutar: 'npm run consola',
    esPrueba: (ruta) => ruta.startsWith('tests/'),
    esInterfaz: (ruta) => ruta.startsWith('public/'),
  },
];

/** Cómo empieza y termina un comentario en cada estilo de código. */
const COMENTARIOS = {
  python: { linea: '#', bloques: [['"""', '"""'], ["'''", "'''"]] },
  c: { linea: '//', bloques: [['/*', '*/']] },
  html: { linea: null, bloques: [['<!--', '-->']] },
};

function estiloDe(extension) {
  if (extension === '.py') {
    return 'python';
  }
  if (extension === '.html') {
    return 'html';
  }
  return 'c';
}

/** Cuenta las líneas de código de un texto: ni vacías ni comentarios. */
function contarLineas(texto, estilo) {
  const reglas = COMENTARIOS[estilo];
  let contadas = 0;
  let finDelBloque = null; // mientras no sea null, estamos dentro de un comentario de varias líneas

  for (const original of texto.split(/\r?\n/)) {
    const linea = original.trim();
    if (linea === '') {
      continue;
    }
    if (finDelBloque !== null) {
      if (linea.includes(finDelBloque)) {
        finDelBloque = null;
      }
      continue;
    }
    if (reglas.linea !== null && linea.startsWith(reglas.linea)) {
      continue;
    }
    let esComentario = false;
    for (const [inicio, fin] of reglas.bloques) {
      if (linea.startsWith(inicio)) {
        esComentario = true;
        // Si el bloque no se cierra en la misma línea, el comentario sigue en las siguientes.
        if (!linea.slice(inicio.length).includes(fin)) {
          finDelBloque = fin;
        }
        break;
      }
    }
    if (!esComentario) {
      contadas++;
    }
  }
  return contadas;
}

/** Recorre una carpeta y devuelve las rutas (relativas a ella, con «/») de los archivos de código. */
async function listarArchivos(carpeta, lenguaje, subcarpeta = '') {
  const archivos = [];
  const entradas = await fs.readdir(path.join(carpeta, subcarpeta), { withFileTypes: true });
  for (const entrada of entradas) {
    const relativa = subcarpeta === '' ? entrada.name : `${subcarpeta}/${entrada.name}`;
    if (entrada.isDirectory()) {
      if (!lenguaje.ignorar.includes(entrada.name)) {
        archivos.push(...(await listarArchivos(carpeta, lenguaje, relativa)));
      }
    } else if (lenguaje.extensiones.includes(path.extname(entrada.name))) {
      archivos.push(relativa);
    }
  }
  return archivos;
}

/** LOC de un lenguaje: código (con la interfaz incluida), interfaz y pruebas, más la cantidad de archivos. */
async function contarCodigo(carpetaProyecto, lenguaje) {
  const raiz = path.join(carpetaProyecto, lenguaje.raiz);
  const loc = { codigo: 0, interfaz: 0, logica: 0, pruebas: 0, archivos: 0, archivosPruebas: 0 };

  for (const ruta of await listarArchivos(raiz, lenguaje)) {
    const texto = await fs.readFile(path.join(raiz, ruta), 'utf8');
    const lineas = contarLineas(texto, estiloDe(path.extname(ruta)));
    if (lenguaje.esPrueba(ruta)) {
      loc.pruebas += lineas;
      loc.archivosPruebas++;
    } else {
      loc.codigo += lineas;
      loc.archivos++;
      if (lenguaje.esInterfaz(ruta)) {
        loc.interfaz += lineas;
      }
    }
  }
  loc.logica = loc.codigo - loc.interfaz;
  return loc;
}

/** Lee resultados_metricas.json de un lenguaje. Si falta o está dañado devuelve { metricas: null, aviso }. */
async function leerMetricas(carpetaProyecto, lenguaje) {
  const ruta = path.join(carpetaProyecto, lenguaje.carpeta, 'resultados_metricas.json');
  try {
    return { metricas: JSON.parse(await fs.readFile(ruta, 'utf8')), aviso: null };
  } catch (error) {
    const motivo = error.code === 'ENOENT' ? 'todavía no existe' : 'no se pudo leer';
    return {
      metricas: null,
      aviso: `${lenguaje.carpeta}/resultados_metricas.json ${motivo}. Ejecuta «${lenguaje.comoEjecutar}» dentro de ${lenguaje.carpeta}/.`,
    };
  }
}

/** Todo lo que necesita el dashboard: por lenguaje, sus métricas de ejecución y sus LOC. */
async function leerProyecto(carpetaProyecto) {
  const lenguajes = [];
  for (const lenguaje of LENGUAJES) {
    const { metricas, aviso } = await leerMetricas(carpetaProyecto, lenguaje);
    lenguajes.push({
      lenguaje: lenguaje.lenguaje,
      metricas,
      aviso,
      loc: await contarCodigo(carpetaProyecto, lenguaje),
    });
  }
  return { generado: new Date().toISOString(), lenguajes };
}

module.exports = { leerProyecto, contarLineas };
