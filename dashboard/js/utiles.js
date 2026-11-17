'use strict';

/**
 * Funciones pequeñas que usan todos los archivos del dashboard.
 * Responsable: Ian.
 *
 * Se cargan primero (ver index.html), así que el resto de los archivos puede usarlas sin importarlas.
 */

/** Atajo para document.getElementById. */
function porId(id) {
  return document.getElementById(id);
}

/**
 * Crea un elemento HTML: crear('p', { class: 'nota' }, 'Hola').
 * Los textos entran como texto, nunca como HTML, así que un dato raro del JSON no puede inyectar código.
 */
function crear(etiqueta, atributos, ...hijos) {
  const nodo = document.createElement(etiqueta);
  const claves = Object.keys(atributos || {});
  for (const clave of claves) {
    nodo.setAttribute(clave, atributos[clave]);
  }
  nodo.append(...hijos);
  return nodo;
}

/** Vacía un contenedor y pone los nodos nuevos. */
function reemplazar(contenedor, ...nodos) {
  contenedor.replaceChildren(...nodos);
}

/** 8360.46 -> «$8,360.46» (pesos mexicanos). */
function pesos(valor) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valor));
}

/** 1732 -> «1,732»; con decimales: numero(2.92, 2) -> «2.92». */
function numero(valor, decimales = 0) {
  return Number(valor).toLocaleString('es-MX', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

/** «JavaScript» -> «javascript»: nombre de las clases y variables de color de cada lenguaje. */
function idDe(lenguaje) {
  return lenguaje.toLowerCase();
}

/** Color actual de un lenguaje (se lee de css/estilos.css, así cambia solo en modo oscuro). */
function colorDe(lenguaje) {
  return leerColor(`--serie-${idDe(lenguaje)}`);
}

/** Valor de una variable CSS, por ejemplo leerColor('--tinta'). */
function leerColor(variable) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

/** ¿Se usa el tema oscuro? Manda la elección explícita (atributo data-theme) y, si no hay, la del sistema. */
function temaOscuro() {
  const elegido = document.documentElement.getAttribute('data-theme');
  if (elegido === 'dark') {
    return true;
  }
  if (elegido === 'light') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Llama a la función cuando cambia el tema: por el sistema o por una elección explícita (data-theme). */
function alCambiarTema(funcion) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', funcion);
  new MutationObserver(funcion).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

/** Escribe el mensaje de estado de la parte de arriba. Con esError = true se ve en rojo. */
function mostrarEstado(texto, esError = false) {
  const estado = porId('estado');
  estado.textContent = texto;
  estado.className = esError ? 'estado error' : 'estado';
}
