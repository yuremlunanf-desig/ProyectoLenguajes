/**
 * Panel de concurrencia: muestra cómo el despachador del servidor procesa la cola.
 *
 * Responsable: Yurem (Concurrencia en la interfaz).
 *
 * El navegador pregunta el estado con GET /api/despachador (lo llama dashboard.js cada 500 ms) y aquí se
 * pinta lo que responde el servidor: la tabla de la cola, la barra de avance y el registro de eventos.
 */
import { api, el, mostrarError, toast } from './comun.js';

export function iniciarConcurrencia({ opciones, estadoInicial, informar }) {
  const campoRetardo = document.getElementById('retardo');
  const campoTrabajadores = document.getElementById('trabajadores');
  const botonProcesar = document.getElementById('btn-procesar');
  const botonDetener = document.getElementById('btn-detener');
  const cuerpoCola = document.querySelector('#tabla-cola tbody');
  const registro = document.getElementById('registro');
  const avance = document.getElementById('avance');
  const estado = document.getElementById('estado-despachador');

  const limites = estadoInicial.limites; // límites y valores por defecto: los define el servidor
  const etiquetaDeEstado = {};
  for (const e of opciones.estados) {
    etiquetaDeEstado[e.valor] = e.etiqueta;
  }
  const etiquetaDePrioridad = {};
  for (const p of opciones.prioridades) {
    etiquetaDePrioridad[p.valor] = p.etiqueta;
  }
  const flujo = opciones.flujoEstados;

  campoRetardo.min = limites.retardoMs.minimo;
  campoRetardo.max = limites.retardoMs.maximo;
  campoRetardo.value = limites.retardoMs.porDefecto;
  campoTrabajadores.min = limites.trabajadores.minimo;
  campoTrabajadores.max = limites.trabajadores.maximo;
  campoTrabajadores.value = limites.trabajadores.porDefecto;

  // Lo que ya está dibujado: así solo se repinta lo que cambió.
  let corridaMostrada = -1;
  let eventosMostrados = 0;
  let colaMostrada = '';
  let mensajeFinal = ''; // texto del último evento de cierre de la corrida
  let deteniendo = false;

  // --- dibujo ---

  /** Porcentaje del flujo PENDIENTE -> ENTREGADO que lleva un pedido. */
  function porcentaje(valorEstado) {
    const avanceDelFlujo = flujo.indexOf(valorEstado);
    if (avanceDelFlujo < 0) {
      return 0;
    }
    return Math.round((100 * avanceDelFlujo) / (flujo.length - 1));
  }

  function pintarCola(cola) {
    if (cola.length === 0) {
      cuerpoCola.replaceChildren(el('tr', {}, el('td', { colspan: 6, clase: 'vacio' }, 'Sin corrida todavía.')));
      return;
    }
    const filas = [];
    for (const fila of cola) {
      const pct = porcentaje(fila.estado);
      let trabajador = 'en espera';
      if (fila.trabajador > 0) {
        trabajador = `Trabajador ${fila.trabajador}`;
      }
      let clase = `estado-${fila.estado}`;
      if (fila.activa) {
        clase += ' activa';
      }
      filas.push(
        el(
          'tr',
          { clase, 'data-id': fila.id },
          el('td', { clase: 'centro' }, String(fila.orden)),
          el('td', {}, fila.id),
          el('td', {}, etiquetaDePrioridad[fila.prioridad]),
          el('td', {}, trabajador),
          el('td', {}, el('progress', { max: '100', value: String(pct), 'aria-label': `Progreso de ${fila.id}` }), ` ${pct} %`),
          el('td', {}, etiquetaDeEstado[fila.estado])
        )
      );
    }
    cuerpoCola.replaceChildren(...filas);
  }

  function escribir(texto, clase) {
    registro.append(el('li', { clase }, texto));
    registro.scrollTop = registro.scrollHeight;
  }

  /** Agrega al registro una línea por cada evento que el servidor anotó. */
  function escribirEvento(evento) {
    const marca = `+${(evento.marcaMs / 1000).toFixed(2).padStart(5, ' ')} s`;
    if (evento.tipo === 'CORRIDA_INICIADA') {
      escribir(`${marca}  Corrida iniciada (${evento.detalle} pedidos)`, 'suave');
    } else if (evento.tipo === 'PEDIDO_INICIADO') {
      escribir(`${marca}  Trabajador ${evento.trabajador} toma ${evento.pedidoId}`, 'suave');
    } else if (evento.tipo === 'TRANSICION') {
      const anterior = etiquetaDeEstado[evento.estadoAnterior];
      const nuevo = etiquetaDeEstado[evento.estadoNuevo];
      escribir(`${marca}  ${evento.pedidoId}: ${anterior} → ${nuevo}`, `estado-${evento.estadoNuevo}`);
    } else if (evento.tipo === 'PEDIDO_TERMINADO') {
      escribir(`${marca}  ${evento.pedidoId} completado`, 'suave');
    } else if (evento.tipo === 'CORRIDA_TERMINADA') {
      const r = evento.resumen;
      mensajeFinal =
        `Cola completada: ${r.procesados} pedido(s) en ${(r.tiempoMs / 1000).toFixed(2)} s ` +
        `(secuencial estimado ${(r.secuencialEstimadoMs / 1000).toFixed(2)} s, aceleración ×${r.aceleracion}).`;
      escribir(`${marca}  ${mensajeFinal}`, 'suave');
      informar(`Despachador: ${mensajeFinal}`);
    } else if (evento.tipo === 'CORRIDA_DETENIDA') {
      mensajeFinal = `Corrida detenida (${evento.detalle} pedidos completados).`;
      escribir(`${marca}  ${mensajeFinal}`, 'detenida');
      informar(`Despachador: ${mensajeFinal}`);
    } else if (evento.tipo === 'ERROR') {
      mensajeFinal = 'La corrida terminó con un error.';
      escribir(`Error: ${evento.detalle}`, 'detenida');
      toast(`Error en el despachador: ${evento.detalle}`, 'error');
    }
  }

  /** Dibuja el estado que respondió el servidor. */
  function mostrar(actual) {
    // ¿Empezó una corrida nueva? Entonces se limpia lo de la anterior.
    if (actual.corrida !== corridaMostrada) {
      corridaMostrada = actual.corrida;
      eventosMostrados = 0;
      colaMostrada = '';
      mensajeFinal = '';
      deteniendo = false;
      registro.replaceChildren();
    }

    const textoCola = JSON.stringify(actual.cola);
    if (textoCola !== colaMostrada) {
      colaMostrada = textoCola;
      pintarCola(actual.cola);
    }

    for (let i = eventosMostrados; i < actual.eventos.length; i++) {
      escribirEvento(actual.eventos[i]);
    }
    eventosMostrados = actual.eventos.length;

    // Avance: cuántas transiciones se han hecho de las que se esperaban.
    let hechas = 0;
    for (const evento of actual.eventos) {
      if (evento.tipo === 'TRANSICION') {
        hechas += 1;
      }
    }
    avance.max = Math.max(1, actual.transicionesTotales);
    avance.value = hechas;

    // Botones y mensaje de estado
    botonProcesar.disabled = actual.enEjecucion;
    campoRetardo.disabled = actual.enEjecucion;
    campoTrabajadores.disabled = actual.enEjecucion;
    botonDetener.disabled = !actual.enEjecucion || deteniendo;
    if (actual.enEjecucion && deteniendo) {
      estado.textContent = 'Deteniendo…';
    } else if (actual.enEjecucion) {
      const segundos = ((Date.now() - actual.inicio) / 1000).toFixed(1);
      estado.textContent = `Procesando… ${hechas}/${actual.transicionesTotales} transiciones · ${segundos} s`;
    } else if (mensajeFinal !== '') {
      estado.textContent = mensajeFinal;
    } else {
      estado.textContent = 'Inactivo. Pulsa «Procesar cola» para despachar los pedidos pendientes.';
    }
  }

  /** Pregunta al servidor cómo va el despachador y lo dibuja. Si falla lanza el error (lo atiende quien llama). */
  async function consultar() {
    mostrar(await api('/api/despachador'));
  }

  // --- acciones ---

  async function procesar() {
    const retardo = campoRetardo.value.trim();
    const hilos = campoTrabajadores.value.trim();
    const entero = /^[+-]?\d+$/;
    const { retardoMs, trabajadores } = limites;
    if (!entero.test(retardo) || Number(retardo) < retardoMs.minimo || Number(retardo) > retardoMs.maximo) {
      toast(`El retardo debe ser un número entero entre ${retardoMs.minimo} y ${retardoMs.maximo} ms.`, 'aviso');
      campoRetardo.focus();
      return;
    }
    if (!entero.test(hilos) || Number(hilos) < trabajadores.minimo || Number(hilos) > trabajadores.maximo) {
      toast(
        `La cantidad de trabajadores debe ser un número entero entre ${trabajadores.minimo} y ${trabajadores.maximo}.`,
        'aviso'
      );
      campoTrabajadores.focus();
      return;
    }
    botonProcesar.disabled = true;
    try {
      await api('/api/despachador/iniciar', {
        metodo: 'POST',
        cuerpo: { retardoMs: Number(retardo), trabajadores: Number(hilos) },
      });
      informar('Despachador: procesando los pedidos pendientes por prioridad.');
      await consultar(); // no se espera al siguiente ciclo de 500 ms: se ve de inmediato
    } catch (error) {
      botonProcesar.disabled = false;
      mostrarError(error);
    }
  }

  async function detener() {
    botonDetener.disabled = true;
    deteniendo = true;
    estado.textContent = 'Deteniendo…';
    try {
      await api('/api/despachador/detener', { metodo: 'POST' });
    } catch (error) {
      deteniendo = false;
      botonDetener.disabled = false;
      mostrarError(error);
    }
  }

  botonProcesar.addEventListener('click', procesar);
  botonDetener.addEventListener('click', detener);
  mostrar(estadoInicial);

  return { consultar };
}
