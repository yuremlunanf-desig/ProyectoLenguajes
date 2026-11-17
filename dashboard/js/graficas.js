'use strict';

/**
 * Gráficas de rendimiento con Chart.js.
 * Responsable: Leonardo.
 *
 * Tres gráficas, todas con una tabla gemela («Ver como tabla») con los mismos números:
 *   1. #grafica-modos ..... tiempo secuencial frente a concurrente (archivo de prueba)
 *   2. #grafica-etapas .... tiempo de cómputo real de cada etapa (escala logarítmica)
 *   3. #grafica-volumen ... cómo cambian los tiempos al crecer el número de pedidos (volumenes.json)
 *
 * Los colores salen de css/estilos.css: cada lenguaje conserva el suyo en toda la página y el gris es la
 * línea base «secuencial». Se redibuja cuando js/datos.js avisa con «metricas-listas» y cuando cambia el
 * modo claro/oscuro del sistema.
 */

const graficas = {}; // gráficas ya dibujadas, por id de canvas (hay que destruirlas antes de redibujarlas)
let datosActuales = null;
let medidaVolumen = 'concurrente_ms';

document.addEventListener('metricas-listas', (evento) => {
  datosActuales = evento.detail;
  dibujarTodo();
});

// Si cambia entre modo claro y oscuro, se vuelven a leer los colores.
alCambiarTema(() => {
  if (datosActuales !== null) {
    dibujarTodo();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  for (const boton of porId('selector-volumen').querySelectorAll('button')) {
    boton.addEventListener('click', () => {
      medidaVolumen = boton.dataset.medida;
      for (const otro of porId('selector-volumen').querySelectorAll('button')) {
        otro.setAttribute('aria-checked', String(otro === boton));
      }
      if (datosActuales !== null) {
        graficaVolumen(datosActuales.volumenes);
      }
    });
  }
});

function dibujarTodo() {
  const aviso = porId('aviso-chart');
  if (typeof Chart === 'undefined') {
    // No cargó la librería (sin internet o CDN bloqueado): la página sigue funcionando sin las gráficas.
    if (aviso === null) {
      porId('leyenda-lenguajes').after(
        crear('p', { id: 'aviso-chart', class: 'aviso-libreria' }, 'No se pudo cargar Chart.js desde el CDN. Revisa tu conexión a internet y recarga la página.')
      );
    }
    return;
  }
  if (aviso !== null) {
    aviso.remove();
  }

  // Valores por defecto de Chart.js para toda la página.
  Chart.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", sans-serif';
  Chart.defaults.font.size = 13;
  Chart.defaults.color = leerColor('--tinta-2');

  const conMetricas = [];
  for (const dato of datosActuales.lenguajes) {
    if (dato.metricas !== null) {
      conMetricas.push(dato);
    }
  }
  graficaModos(conMetricas);
  graficaEtapas(conMetricas);
  graficaVolumen(datosActuales.volumenes);
}

// ----------------------------------------------------------------- utilidades

/** Destruye la gráfica anterior (si hay) y dibuja la nueva en el canvas. */
function dibujar(idCanvas, configuracion) {
  if (graficas[idCanvas]) {
    graficas[idCanvas].destroy();
  }
  graficas[idCanvas] = new Chart(porId(idCanvas), configuracion);
}

function escalaY(titulo, extra = {}) {
  return {
    beginAtZero: true,
    title: { display: true, text: titulo, color: leerColor('--tinta-2') },
    grid: { color: leerColor('--linea') },
    border: { color: leerColor('--eje') },
    ticks: { color: leerColor('--tenue'), callback: (valor) => numero(valor) },
    ...extra,
  };
}

function escalaX(titulo, extra = {}) {
  return {
    title: { display: titulo !== '', text: titulo, color: leerColor('--tinta-2') },
    grid: { display: false },
    border: { color: leerColor('--eje') },
    ticks: { color: leerColor('--tinta-2') },
    ...extra,
  };
}

/** Ventanita que aparece al pasar el mouse (o al enfocar con el teclado): el valor primero, el nombre después. */
function tooltip(funciones) {
  return {
    backgroundColor: leerColor('--superficie'),
    titleColor: leerColor('--tinta-2'),
    bodyColor: leerColor('--tinta'),
    borderColor: leerColor('--eje'),
    borderWidth: 1,
    padding: 10,
    boxPadding: 4,
    usePointStyle: true,
    callbacks: { labelPointStyle: () => ({ pointStyle: 'rectRounded', rotation: 0 }), ...funciones },
  };
}

/** Tabla con los mismos números de una gráfica, para quien no puede o no quiere usar el mouse. */
function tablaGemela(idContenedor, titulos, filas) {
  const cabecera = crear('tr', {}, ...titulos.map((titulo, i) => crear('th', { scope: 'col', class: i === 0 ? '' : 'numero' }, titulo)));
  const cuerpo = crear('tbody', {});
  for (const fila of filas) {
    const renglon = crear('tr', {}, crear('th', { scope: 'row' }, fila[0]));
    for (const valor of fila.slice(1)) {
      renglon.append(crear('td', { class: 'numero' }, valor));
    }
    cuerpo.append(renglon);
  }
  reemplazar(porId(idContenedor), crear('table', {}, crear('thead', {}, cabecera), cuerpo));
}

/** Dibuja el valor de cada barra sobre ella (solo se usa donde hay pocas barras). */
const valoresSobreBarras = {
  id: 'valoresSobreBarras',
  afterDatasetsDraw(grafica) {
    const ctx = grafica.ctx;
    ctx.save();
    ctx.fillStyle = leerColor('--tinta-2');
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    grafica.data.datasets.forEach((conjunto, i) => {
      grafica.getDatasetMeta(i).data.forEach((barra, j) => {
        ctx.fillText(numero(conjunto.data[j]), barra.x, barra.y - 4);
      });
    });
    ctx.restore();
  },
};

// ------------------------------------------------- 1. secuencial / concurrente

function graficaModos(conMetricas) {
  const nombres = [];
  const secuencial = [];
  const concurrente = [];
  const filas = [];
  for (const dato of conMetricas) {
    const tiempos = dato.metricas.tiempos_ms;
    nombres.push(dato.lenguaje);
    secuencial.push(tiempos.cambio_estados_secuencial);
    concurrente.push(tiempos.cambio_estados_concurrente);
    filas.push([
      dato.lenguaje,
      numero(tiempos.cambio_estados_secuencial, 1),
      numero(tiempos.cambio_estados_concurrente, 1),
      `${numero(dato.metricas.aceleracion_concurrencia, 2)}×`,
    ]);
  }

  dibujar('grafica-modos', {
    type: 'bar',
    data: {
      labels: nombres,
      datasets: [
        // Gris = línea base. Azul/naranja/verde agua = cada lenguaje, igual que en el resto de la página.
        { label: 'Secuencial', data: secuencial, backgroundColor: leerColor('--serie-base') },
        { label: 'Concurrente', data: concurrente, backgroundColor: nombres.map(colorDe) },
      ],
    },
    options: {
      maintainAspectRatio: false,
      layout: { padding: { top: 18 } }, // espacio para el número que se dibuja sobre cada barra
      datasets: {
        bar: {
          borderRadius: 4,
          borderColor: leerColor('--superficie'),
          borderWidth: 2,
          hoverBorderColor: leerColor('--tinta'),
          categoryPercentage: 0.7,
        },
      },
      scales: { x: escalaX(''), y: escalaY('milisegundos') },
      plugins: {
        legend: { display: false }, // la leyenda de colores está en el HTML, arriba de las gráficas
        tooltip: tooltip({
          label: (punto) => `${numero(punto.parsed.y, 1)} ms · ${punto.dataset.label}`,
        }),
      },
    },
    plugins: [valoresSobreBarras],
  });

  tablaGemela('tabla-modos', ['Lenguaje', 'Secuencial (ms)', 'Concurrente (ms)', 'Aceleración'], filas);
  porId('grafica-modos').setAttribute(
    'aria-label',
    'Barras, secuencial y concurrente en ms: ' +
      filas.map((f) => `${f[0]} ${f[1]} y ${f[2]}`).join('; ')
  );
}

// -------------------------------------------------------- 2. cómputo real

const ETAPAS = [
  ['lectura_json', 'Lectura del JSON'],
  ['validacion_y_calculo', 'Validación y cálculo'],
  ['consultas_funcionales', 'Consultas funcionales'],
];

function graficaEtapas(conMetricas) {
  const conjuntos = [];
  const filas = [];
  let menor = Infinity;
  let mayor = 0;

  for (const dato of conMetricas) {
    const valores = [];
    for (const [clave] of ETAPAS) {
      const valor = dato.metricas.tiempos_ms[clave];
      valores.push(valor);
      menor = Math.min(menor, valor);
      mayor = Math.max(mayor, valor);
    }
    conjuntos.push({ label: dato.lenguaje, data: valores, backgroundColor: colorDe(dato.lenguaje) });
  }
  for (const [clave, nombre] of ETAPAS) {
    filas.push([nombre, ...conMetricas.map((dato) => numero(dato.metricas.tiempos_ms[clave], 3))]);
  }

  // En escala logarítmica los límites son potencias de 10: 0.01, 0.1, 1, 10, 100…
  const minimo = Math.pow(10, Math.floor(Math.log10(menor)));
  const maximo = Math.pow(10, Math.ceil(Math.log10(mayor)));

  dibujar('grafica-etapas', {
    type: 'bar',
    data: { labels: ETAPAS.map((etapa) => etapa[1]), datasets: conjuntos },
    options: {
      maintainAspectRatio: false,
      datasets: {
        bar: { borderRadius: 4, borderColor: leerColor('--superficie'), borderWidth: 2, hoverBorderColor: leerColor('--tinta') },
      },
      scales: {
        x: escalaX(''),
        y: escalaY('milisegundos (escala logarítmica)', {
          type: 'logarithmic',
          beginAtZero: false,
          min: minimo,
          max: maximo,
          ticks: {
            color: leerColor('--tenue'),
            // Solo se rotulan las potencias de 10; las líneas intermedias del eje no llevan número.
            callback: (valor) => (Math.abs(Math.log10(valor) % 1) < 1e-9 ? numero(valor, valor < 1 ? 2 : 0) : ''),
          },
        }),
      },
      plugins: {
        legend: { display: false },
        tooltip: tooltip({ label: (punto) => `${numero(punto.parsed.y, 3)} ms · ${punto.dataset.label}` }),
      },
    },
  });

  tablaGemela('tabla-etapas', ['Etapa (ms)', ...conMetricas.map((dato) => dato.lenguaje)], filas);
}

// ------------------------------------------------------ 3. según el volumen

/**
 * Python y JavaScript dan casi los mismos tiempos, así que sus líneas se encimarían. Cada lenguaje usa una
 * marca distinta y un grosor distinto, y el más grueso se dibuja al fondo: así los tres se ven aunque coincidan.
 * (Chart.js dibuja primero el conjunto con «order» más alto.)
 */
const ESTILO_LINEA = {
  Python: { grosor: 5, marca: 'circle', radio: 7, orden: 2 },
  Java: { grosor: 3, marca: 'rect', radio: 5, orden: 1 },
  JavaScript: { grosor: 2, marca: 'triangle', radio: 4, orden: 0 },
};

const MEDIDAS = {
  concurrente_ms: { titulo: 'milisegundos (concurrente)', formato: (v) => `${numero(v)} ms` },
  secuencial_ms: { titulo: 'milisegundos (secuencial)', formato: (v) => `${numero(v)} ms` },
  aceleracion: { titulo: 'veces más rápido (secuencial ÷ concurrente)', formato: (v) => `${numero(v, 2)}×` },
};

function graficaVolumen(volumenes) {
  const caja = porId('grafica-volumen').parentElement;
  if (volumenes === null) {
    caja.hidden = true;
    reemplazar(porId('tabla-volumen'));
    porId('lectura-volumen').textContent =
      'Todavía no hay mediciones por volumen. Desde la raíz del proyecto ejecuta «node dashboard/medir_volumenes.js» y recarga.';
    return;
  }
  caja.hidden = false;

  const medida = MEDIDAS[medidaVolumen];
  const nombres = Object.keys(volumenes.resultados);
  const conjuntos = [];
  for (const nombre of nombres) {
    const puntos = volumenes.resultados[nombre].map((fila) => ({ x: fila.pedidos, y: fila[medidaVolumen] }));
    conjuntos.push({
      label: nombre,
      data: puntos,
      borderColor: colorDe(nombre),
      backgroundColor: colorDe(nombre),
      borderWidth: ESTILO_LINEA[nombre].grosor,
      order: ESTILO_LINEA[nombre].orden,
      tension: 0,
      pointStyle: ESTILO_LINEA[nombre].marca,
      pointRadius: ESTILO_LINEA[nombre].radio,
      pointHoverRadius: ESTILO_LINEA[nombre].radio + 3,
      pointBorderColor: leerColor('--superficie'),
      pointBorderWidth: 1.5,
    });
  }

  dibujar('grafica-volumen', {
    type: 'line',
    data: { datasets: conjuntos },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false }, // un solo cuadro con los tres lenguajes en ese volumen
      scales: {
        x: escalaX('pedidos en el archivo (el 20 % es inválido y se rechaza)', {
          type: 'linear',
          min: 0,
          ticks: { color: leerColor('--tinta-2'), callback: (valor) => numero(valor) },
        }),
        y: escalaY(medida.titulo),
      },
      plugins: {
        legend: { display: false },
        tooltip: tooltip({
          title: (puntos) => `${numero(puntos[0].parsed.x)} pedidos`,
          label: (punto) => `${medida.formato(punto.parsed.y)} · ${punto.dataset.label}`,
        }),
      },
    },
  });

  // Tabla gemela: una fila por volumen, una columna por lenguaje.
  const filas = [];
  volumenes.volumenes.forEach((cantidad, i) => {
    const fila = [`${numero(cantidad)} pedidos`];
    for (const nombre of nombres) {
      const medicion = volumenes.resultados[nombre][i];
      fila.push(medicion ? medida.formato(medicion[medidaVolumen]) : '—');
    }
    filas.push(fila);
  });
  tablaGemela('tabla-volumen', ['Volumen', ...nombres], filas);
  porId('grafica-volumen').setAttribute('aria-label', `Líneas, ${medida.titulo} según el número de pedidos, por lenguaje`);
  porId('lectura-volumen').textContent = leerVolumen(volumenes);
}

/** Frase que explica lo que se ve, con los números reales del volumen más grande medido. */
function leerVolumen(volumenes) {
  const nombres = Object.keys(volumenes.resultados);
  const ultimo = volumenes.volumenes.length - 1;
  const cantidad = numero(volumenes.volumenes[ultimo]);
  const partes = nombres.map((nombre) => {
    const medicion = volumenes.resultados[nombre][ultimo];
    return `${nombre} ${MEDIDAS[medidaVolumen].formato(medicion[medidaVolumen])}`;
  });
  const cifras = `Con ${cantidad} pedidos: ${partes.join(', ')}. `;

  if (medidaVolumen === 'secuencial_ms') {
    return cifras + 'En los tres crece en línea recta: cada pedido espera a que termine el anterior, así que el tiempo es casi igual en todos.';
  }
  if (medidaVolumen === 'aceleracion') {
    return cifras + 'Python y JavaScript atienden todos los pedidos a la vez, por eso su aceleración sigue creciendo. Java usa un pool de 16 hilos: cuando hay más pedidos que hilos tienen que turnarse y la aceleración se frena.';
  }
  return cifras + 'Python y JavaScript casi no notan el volumen porque solo esperan (todas las esperas se traslapan). Java reparte el trabajo entre 16 hilos, así que con más pedidos que hilos el tiempo sube.';
}
