'use strict';

/**
 * Resultado producido y tabla comparativa con filtro por lenguaje.
 * Responsable: Ian.
 *
 * Se dibuja cuando js/datos.js avisa con el evento «metricas-listas». Llena #resumen-cifras, #coincidencia,
 * #filtro-lenguaje, #tabla-comparativa y #nota-tabla de index.html.
 */

/**
 * Dificultad percibida: es una VALORACIÓN del equipo (1 = muy fácil, 5 = muy difícil), no una medición.
 * Si tu experiencia fue distinta, cambia los números y los motivos aquí.
 */
const DIFICULTAD = {
  Python: {
    nivel: 2,
    etiqueta: 'Baja',
    motivo: 'Sintaxis corta y sin declarar tipos. Lo más difícil: pasar datos entre el hilo de asyncio y la ventana.',
  },
  Java: {
    nivel: 4,
    etiqueta: 'Alta',
    motivo: 'Hay que declarar tipos, clases y excepciones, y recordar SwingUtilities.invokeLater para tocar la ventana.',
  },
  JavaScript: {
    nivel: 3,
    etiqueta: 'Media',
    motivo: 'Fácil de escribir, pero son dos programas (servidor y navegador) que se hablan por HTTP.',
  },
};

/** Columnas de la tabla. «clave» es el campo de cada fila por el que se ordena. */
const COLUMNAS = [
  { clave: 'lenguaje', titulo: 'Lenguaje', numerica: false },
  { clave: 'resultado', titulo: 'Resultado', numerica: true },
  { clave: 'codigo', titulo: 'LOC de código', numerica: true },
  { clave: 'interfaz', titulo: 'LOC de interfaz', numerica: true },
  { clave: 'pruebas', titulo: 'LOC de pruebas', numerica: true },
  { clave: 'archivos', titulo: 'Archivos', numerica: true },
  { clave: 'tiempoTotal', titulo: 'Corrida (ms)', numerica: true },
  { clave: 'aceleracion', titulo: 'Aceleración', numerica: true },
  { clave: 'dificultad', titulo: 'Dificultad percibida', numerica: true },
];

let filas = []; // una fila por lenguaje
let filtro = 'Todos'; // «Todos» o el nombre de un lenguaje
let orden = { clave: null, ascendente: true };

document.addEventListener('metricas-listas', (evento) => {
  filas = armarFilas(evento.detail.lenguajes);
  dibujarResumen(evento.detail.lenguajes);
  dibujarFiltro();
  dibujarTabla();
});

/** Junta lo que muestra la tabla de cada lenguaje: métricas de ejecución, LOC y dificultad. */
function armarFilas(lenguajes) {
  const resultado = [];
  for (const dato of lenguajes) {
    const metricas = dato.metricas;
    resultado.push({
      lenguaje: dato.lenguaje,
      resultado: metricas ? Number(metricas.ventas.total) : null,
      codigo: dato.loc.codigo,
      interfaz: dato.loc.interfaz,
      pruebas: dato.loc.pruebas,
      archivos: dato.loc.archivos,
      tiempoTotal: metricas ? metricas.tiempos_ms.total : null,
      aceleracion: metricas ? metricas.aceleracion_concurrencia : null,
      dificultad: DIFICULTAD[dato.lenguaje] ? DIFICULTAD[dato.lenguaje].nivel : null,
    });
  }
  return resultado;
}

// ---------------------------------------------------------------- resultado

function tarjetaDeCifra(etiqueta, valor, clases = '') {
  return crear(
    'div',
    { class: `tarjeta ${clases}` },
    crear('span', { class: clases.includes('principal') ? 'cifra' : 'cifra media' }, valor),
    crear('span', { class: 'cifra-etiqueta' }, etiqueta)
  );
}

function dibujarResumen(lenguajes) {
  // Solo los lenguajes que ya generaron su resultados_metricas.json.
  const conMetricas = lenguajes.filter((dato) => dato.metricas !== null);
  const sinMetricas = lenguajes.filter((dato) => dato.metricas === null);

  if (conMetricas.length === 0) {
    reemplazar(porId('resumen-cifras'), crear('p', { class: 'pendiente' }, 'Todavía no hay resultados. Ejecuta las tres versiones (ver README).'));
    reemplazar(porId('coincidencia'));
    return;
  }

  const referencia = conMetricas[0].metricas;
  const firma = (metricas) => JSON.stringify([metricas.ventas, metricas.pedidos]);
  let coinciden = true;
  for (const dato of conMetricas) {
    if (firma(dato.metricas) !== firma(referencia)) {
      coinciden = false;
    }
  }

  const nombres = conMetricas.map((dato) => dato.lenguaje).join(', ');
  const rechazados = referencia.rechazos.length;
  const detalleRechazo = rechazados > 0 ? `${rechazados} rechazado: ${referencia.rechazos[0].id}` : 'ninguno rechazado';

  reemplazar(
    porId('resumen-cifras'),
    tarjetaDeCifra(coinciden ? `Total vendido, igual en ${nombres}` : 'Total vendido (¡no coincide!)', coinciden ? pesos(referencia.ventas.total) : 'Revisar', 'principal'),
    tarjetaDeCifra(`Pedidos registrados de ${referencia.pedidos.leidos} leídos (${detalleRechazo})`, String(referencia.pedidos.registrados)),
    tarjetaDeCifra('Espera simulada por cada cambio de estado', `${referencia.retardo_por_transicion_ms} ms`)
  );

  // El mensaje usa ícono y texto, no solo color.
  let mensaje;
  if (!coinciden) {
    mensaje = 'Los importes no coinciden entre lenguajes: ' + conMetricas.map((dato) => `${dato.lenguaje} ${pesos(dato.metricas.ventas.total)}`).join(', ') + '.';
  } else if (sinMetricas.length > 0) {
    mensaje = `Faltan los resultados de ${sinMetricas.map((dato) => dato.lenguaje).join(', ')}. ${sinMetricas[0].aviso}`;
    coinciden = false;
  } else {
    const v = referencia.ventas;
    mensaje =
      `Los ${conMetricas.length} lenguajes coinciden al centavo: subtotal ${pesos(v.subtotal)}, descuentos ${pesos(v.descuentos)}, ` +
      `IVA ${pesos(v.iva)}, envío ${pesos(v.envio)} y total ${pesos(v.total)}.`;
  }
  reemplazar(
    porId('coincidencia'),
    crear('span', { class: `icono ${coinciden ? 'bien' : 'mal'}`, 'aria-hidden': 'true' }, coinciden ? '✓' : '✕'),
    crear('span', {}, mensaje)
  );
}

// ------------------------------------------------------------------- filtro

function dibujarFiltro() {
  const botones = [];
  const opciones = ['Todos', ...filas.map((fila) => fila.lenguaje)];
  for (const opcion of opciones) {
    const boton = crear('button', { type: 'button', 'aria-pressed': String(opcion === filtro) }, opcion);
    boton.addEventListener('click', () => {
      filtro = opcion;
      dibujarFiltro();
      dibujarTabla();
    });
    botones.push(boton);
  }
  reemplazar(porId('filtro-lenguaje'), ...botones);
}

// -------------------------------------------------------------------- tabla

/** Texto de cada celda (la tabla y el orden usan los mismos campos). */
function celda(fila, columna) {
  const valor = fila[columna.clave];
  if (columna.clave === 'lenguaje') {
    return crear('th', { scope: 'row' }, crear('span', { class: `muestra serie-${idDe(fila.lenguaje)}` }), fila.lenguaje);
  }
  if (valor === null) {
    return crear('td', { class: 'numero' }, '—');
  }
  if (columna.clave === 'resultado') {
    return crear('td', { class: 'numero fuerte' }, pesos(valor));
  }
  if (columna.clave === 'tiempoTotal') {
    return crear('td', { class: 'numero' }, numero(valor, 1));
  }
  if (columna.clave === 'aceleracion') {
    return crear('td', { class: 'numero' }, `${numero(valor, 2)}×`);
  }
  if (columna.clave === 'dificultad') {
    return celdaDificultad(fila.lenguaje, valor);
  }
  return crear('td', { class: 'numero' }, numero(valor));
}

/** Cinco puntos (los llenos son el nivel) más la palabra y el motivo. */
function celdaDificultad(lenguaje, nivel) {
  const puntos = crear('span', { class: 'puntos', 'aria-hidden': 'true' });
  for (let i = 1; i <= 5; i++) {
    puntos.append(crear('span', { class: i <= nivel ? 'punto lleno' : 'punto' }));
  }
  const datos = DIFICULTAD[lenguaje];
  return crear(
    'td',
    {},
    puntos,
    crear('strong', {}, `${datos.etiqueta} (${nivel}/5)`),
    crear('span', { class: 'motivo' }, datos.motivo)
  );
}

function filasVisibles() {
  const visibles = [];
  for (const fila of filas) {
    if (filtro === 'Todos' || fila.lenguaje === filtro) {
      visibles.push(fila);
    }
  }
  if (orden.clave !== null) {
    const clave = orden.clave;
    visibles.sort((a, b) => {
      if (a[clave] === null) return 1; // lo que no tiene dato va al final
      if (b[clave] === null) return -1;
      const diferencia = typeof a[clave] === 'string' ? a[clave].localeCompare(b[clave]) : a[clave] - b[clave];
      return orden.ascendente ? diferencia : -diferencia;
    });
  }
  return visibles;
}

function encabezado(columna) {
  const activa = orden.clave === columna.clave;
  const flecha = activa ? (orden.ascendente ? '▲' : '▼') : '';
  const atributos = { scope: 'col', 'aria-sort': activa ? (orden.ascendente ? 'ascending' : 'descending') : 'none' };
  if (columna.numerica && columna.clave !== 'dificultad') {
    atributos.class = 'numero';
  }
  const boton = crear('button', { type: 'button' }, columna.titulo, crear('span', { 'aria-hidden': 'true' }, flecha));
  boton.addEventListener('click', () => {
    if (orden.clave === columna.clave) {
      orden.ascendente = !orden.ascendente;
    } else {
      orden = { clave: columna.clave, ascendente: true };
    }
    dibujarTabla();
  });
  return crear('th', atributos, boton);
}

function dibujarTabla() {
  const cabecera = crear('tr', {});
  for (const columna of COLUMNAS) {
    cabecera.append(encabezado(columna));
  }

  const cuerpo = crear('tbody', {});
  for (const fila of filasVisibles()) {
    const renglon = crear('tr', {});
    for (const columna of COLUMNAS) {
      renglon.append(celda(fila, columna));
    }
    cuerpo.append(renglon);
  }

  reemplazar(porId('tabla-comparativa'), crear('thead', {}, cabecera), cuerpo);
  porId('nota-tabla').textContent =
    'La interfaz (ventanas y estilos: Tkinter, Swing o HTML/CSS/JS del navegador) ya está incluida en las LOC de código; lo demás es modelo y controladores. ' +
    'En JavaScript también se cuentan el HTML y el CSS. Corrida = tiempo total de python main.py (o su equivalente); aceleración = tiempo secuencial ÷ tiempo concurrente. ' +
    'La dificultad percibida es una valoración del equipo, no una medición.';
}
