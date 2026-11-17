'use strict';

/**
 * Carga de las métricas desde el servidor.
 * Responsable: Edsson.
 *
 * Pide dos cosas:
 *   1. api/metricas ........... los tres resultados_metricas.json y las líneas de código de cada lenguaje
 *                               (las junta el servidor Express, ver javascript/src/metricasProyecto.js).
 *                               Si no hay servidor, usa la copia fija datos/datos-fijos.js (exportar_estatico.js).
 *   2. datos/volumenes.json ... tiempos medidos con distintos volúmenes de pedidos (opcional: lo genera
 *                               dashboard/medir_volumenes.js).
 *
 * Cuando ya tiene todo, avisa a los demás archivos con el evento «metricas-listas». Así tabla.js, graficas.js
 * y tarjetas.js solo escuchan el evento y no dependen unos de otros:
 *
 *     document.addEventListener('metricas-listas', (evento) => { evento.detail.lenguajes ... });
 *
 * evento.detail = { lenguajes: [{ lenguaje, metricas, aviso, loc }], volumenes: {...} o null }
 */

/** Pide un JSON y lo devuelve ya convertido. Si la respuesta no es 200, lanza un error legible. */
async function pedirJson(ruta) {
  const respuesta = await fetch(ruta, { cache: 'no-store' });
  if (!respuesta.ok) {
    throw new Error(`«${ruta}» respondió ${respuesta.status}`);
  }
  return respuesta.json();
}

/** Los volúmenes son opcionales: si no existen o están dañados, el resto del dashboard funciona igual. */
async function leerVolumenes() {
  try {
    return await pedirJson('datos/volumenes.json');
  } catch (error) {
    return null;
  }
}

/**
 * Pide las métricas del proyecto. Primero intenta con el servidor Express (datos en vivo); si no hay servidor
 * (la página está publicada como sitio estático, o se abrió con doble clic desde una carpeta), usa la copia fija
 * que trae datos/datos-fijos.js (la genera dashboard/exportar_estatico.js). Esa copia va en un archivo de script
 * y no en un JSON porque un navegador no deja leer JSON desde file://, pero sí cargar scripts.
 * Si no hay ninguna de las dos, lanza el error del servidor.
 */
async function pedirProyecto() {
  const hayCopia = Boolean(window.DATOS_FIJOS && window.DATOS_FIJOS.proyecto);
  // Abierta con doble clic (file://) no hay servidor al que preguntar: se usa la copia directamente.
  if (location.protocol === 'file:' && hayCopia) {
    return { proyecto: window.DATOS_FIJOS.proyecto, copiaFija: true };
  }
  try {
    return { proyecto: await pedirJson('api/metricas'), copiaFija: false };
  } catch (errorServidor) {
    if (hayCopia) {
      return { proyecto: window.DATOS_FIJOS.proyecto, copiaFija: true };
    }
    throw errorServidor;
  }
}

async function cargarMetricas() {
  mostrarEstado('Cargando métricas…');
  let proyecto;
  let copiaFija;
  try {
    ({ proyecto, copiaFija } = await pedirProyecto());
  } catch (error) {
    mostrarEstado(
      `No se pudieron cargar las métricas (${error.message}). Abre «abrir_dashboard.bat» (está en la raíz del proyecto) ` +
        'o ejecuta «node dashboard/exportar_estatico.js --solo-datos» y recarga esta página.',
      true
    );
    return;
  }
  // Con servidor, los volúmenes se leen en vivo (y se avisa si faltan); con la copia fija, salen de la misma copia.
  const volumenes = copiaFija ? window.DATOS_FIJOS.volumenes || null : await leerVolumenes();

  document.dispatchEvent(new CustomEvent('metricas-listas', { detail: { lenguajes: proyecto.lenguajes, volumenes } }));

  // Mensaje de estado: cuándo se leyó y qué faltó.
  const avisos = [];
  for (const dato of proyecto.lenguajes) {
    if (dato.aviso !== null) {
      avisos.push(dato.aviso);
    }
  }
  if (volumenes === null) {
    avisos.push('Faltan las mediciones por volumen: ejecuta «node dashboard/medir_volumenes.js» desde la raíz del proyecto.');
  }
  const hora = new Date(proyecto.generado).toLocaleString('es-MX');
  const inicio = copiaFija ? `Copia fija de los datos, generada el ${hora}` : `Datos leídos el ${hora}`;
  mostrarEstado(avisos.length === 0 ? inicio : `${inicio}. ${avisos.join(' ')}`, avisos.length > 0);
}

document.addEventListener('DOMContentLoaded', () => {
  porId('boton-recargar').addEventListener('click', cargarMetricas);
  cargarMetricas();
});
