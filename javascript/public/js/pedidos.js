/**
 * Tabla de pedidos, indicadores, filtros y detalle.
 *
 * Responsable: Leonardo (Dashboard).
 *
 * Los datos (filas ya formateadas, resumen) los entrega GET /api/pedidos, que reutiliza las consultas
 * funcionales del servidor; aquí solo se dibujan. Los filtros se aplican en el servidor.
 * dashboard.js llama a consultar() cada 500 ms: la tabla solo se vuelve a dibujar si algo cambió.
 */
import { api, el, llenarSelect, mostrarError, toast } from './comun.js';

const COLUMNAS_NUMERICAS = ['Subtotal', 'Descuento', 'IVA', 'Total'];

export function iniciarPedidos({ opciones, informar }) {
  const buscar = document.getElementById('buscar');
  const filtroEstado = document.getElementById('filtro-estado');
  const orden = document.getElementById('orden');
  const tabla = document.getElementById('tabla-pedidos');
  const encabezado = tabla.querySelector('thead tr');
  const cuerpo = tabla.querySelector('tbody');
  const contenedorKpis = document.getElementById('kpis');
  const dialogo = document.getElementById('dialogo-detalle');

  let seleccionado = null; // id del pedido seleccionado
  let consulta = 0; // número de la última consulta: sirve para descartar respuestas viejas
  let ultimaRespuesta = ''; // lo último que se dibujó, para no repintar si no cambió nada
  let columnas = [];
  const tarjetas = {}; // clave del indicador -> elemento donde va el número

  const filtrosDeEstado = [{ valor: 'TODOS', etiqueta: 'Todos' }].concat(opciones.estados);
  llenarSelect(filtroEstado, filtrosDeEstado);
  llenarSelect(orden, opciones.ordenes);
  construirIndicadores();

  /** Una tarjeta del resumen: un número grande y su título. */
  function crearTarjeta(clave, titulo, clase) {
    const valor = el('span', { clase: 'kpi__valor' }, '0');
    tarjetas[clave] = valor;
    return el('div', { clase: `kpi ${clase}` }, valor, el('span', { clase: 'kpi__titulo' }, titulo));
  }

  function construirIndicadores() {
    const lista = [crearTarjeta('total', 'Pedidos', 'kpi--total')];
    for (const estado of opciones.flujoEstados) {
      let titulo = estado;
      for (const e of opciones.estados) {
        if (e.valor === estado) {
          titulo = e.etiqueta;
        }
      }
      lista.push(crearTarjeta(estado, titulo, `kpi--${estado}`));
    }
    lista.push(crearTarjeta('vendido', 'Total vendido', 'kpi--vendido'));
    contenedorKpis.replaceChildren(...lista);
  }

  function esNumerica(nombreDeColumna) {
    return COLUMNAS_NUMERICAS.includes(nombreDeColumna);
  }

  function pintarEncabezado(nombres) {
    if (columnas.join() === nombres.join()) {
      return;
    }
    columnas = nombres;
    const celdas = [];
    for (const nombre of nombres) {
      celdas.push(el('th', { scope: 'col', clase: esNumerica(nombre) ? 'num' : '' }, nombre));
    }
    encabezado.replaceChildren(...celdas);
  }

  function pintarFilas(filas) {
    if (filas.length === 0) {
      const mensaje = el('td', { colspan: columnas.length, clase: 'vacio' }, 'No hay pedidos que coincidan con los filtros.');
      cuerpo.replaceChildren(el('tr', {}, mensaje));
      return;
    }
    const trs = [];
    for (const fila of filas) {
      const celdas = [];
      for (let i = 0; i < fila.valores.length; i++) {
        celdas.push(el('td', { clase: esNumerica(columnas[i]) ? 'num' : '' }, fila.valores[i]));
      }
      const tr = el(
        'tr',
        {
          clase: `estado-${fila.estado}`,
          'data-id': fila.id,
          tabindex: '0',
          'aria-selected': fila.id === seleccionado ? 'true' : 'false',
        },
        ...celdas
      );
      trs.push(tr);
    }
    cuerpo.replaceChildren(...trs);
  }

  function pintarResumen(resumen) {
    tarjetas.total.textContent = String(resumen.totalPedidos);
    for (const estado of opciones.flujoEstados) {
      tarjetas[estado].textContent = String(resumen.porEstado[estado]);
    }
    tarjetas.vendido.textContent = resumen.totalVendido;
  }

  /**
   * Pide la tabla al servidor y la dibuja solo si cambió algo (así no se pierde un doble clic a mitad
   * de un repintado). Si la consulta falla lanza el error: quien llama decide cómo avisarlo.
   */
  async function consultar(avisarRechazos) {
    const esta = ++consulta;
    const parametros = new URLSearchParams({ cliente: buscar.value, estado: filtroEstado.value, orden: orden.value });
    const respuesta = await api(`/api/pedidos?${parametros}`);
    if (esta !== consulta) {
      return; // mientras tanto se pidió otra consulta más nueva
    }
    const texto = JSON.stringify(respuesta);
    if (texto !== ultimaRespuesta) {
      ultimaRespuesta = texto;
      pintarEncabezado(respuesta.columnas);
      pintarFilas(respuesta.filas);
      pintarResumen(respuesta.resumen);
    }
    if (avisarRechazos && respuesta.rechazos.length > 0) {
      avisarDeRechazos(respuesta.rechazos);
    }
  }

  /** Igual que consultar, pero muestra el error en una alerta (para acciones que pidió el usuario). */
  async function refrescar() {
    try {
      await consultar(false);
    } catch (error) {
      mostrarError(error);
    }
  }

  function avisarDeRechazos(rechazos) {
    let mensaje = `Al cargar las solicitudes se rechazaron ${rechazos.length} pedido(s) por no cumplir las reglas de negocio:\n`;
    for (const motivo of rechazos) {
      mensaje += `\n• ${motivo}`;
    }
    toast(mensaje, 'aviso', { duracion: 10000 });
  }

  function seleccionar(id) {
    seleccionado = id;
    for (const fila of cuerpo.querySelectorAll('tr[data-id]')) {
      fila.setAttribute('aria-selected', fila.dataset.id === id ? 'true' : 'false');
    }
    const fila = cuerpo.querySelector(`tr[data-id="${CSS.escape(id)}"]`);
    if (fila) {
      fila.scrollIntoView({ block: 'nearest' });
    }
  }

  async function mostrarDetalle(id) {
    try {
      const respuesta = await api(`/api/pedidos/${encodeURIComponent(id)}/detalle`);
      document.getElementById('detalle-titulo').textContent = `Detalle de ${id}`;
      document.getElementById('detalle-texto').textContent = respuesta.texto;
      dialogo.showModal();
    } catch (error) {
      mostrarError(error);
    }
  }

  async function restablecer() {
    const pregunta =
      'Se descartarán los pedidos capturados y los cambios de estado, y se volverá a cargar ' +
      'solicitudes_pequenas.json.\n\n¿Continuar?';
    if (!confirm(pregunta)) {
      return;
    }
    try {
      const respuesta = await api('/api/datos/restablecer', { metodo: 'POST' });
      seleccionado = null;
      await consultar(false);
      informar('Datos restablecidos desde solicitudes_pequenas.json.');
      if (respuesta.rechazos.length > 0) {
        avisarDeRechazos(respuesta.rechazos);
      }
    } catch (error) {
      mostrarError(error);
    }
  }

  /** Doble clic o Enter en una fila: abre el detalle del pedido. */
  function filaDe(evento) {
    return evento.target.closest('tr[data-id]');
  }

  // --- eventos de la página ---
  buscar.addEventListener('input', refrescar);
  filtroEstado.addEventListener('change', refrescar);
  orden.addEventListener('change', refrescar);
  document.getElementById('btn-limpiar').addEventListener('click', () => {
    buscar.value = '';
    filtroEstado.value = 'TODOS';
    orden.value = opciones.ordenes[0].valor;
    refrescar();
  });
  document.getElementById('btn-restablecer').addEventListener('click', restablecer);
  document.getElementById('btn-cerrar-detalle').addEventListener('click', () => dialogo.close());

  cuerpo.addEventListener('click', (evento) => {
    const fila = filaDe(evento);
    if (fila) {
      seleccionar(fila.dataset.id);
    }
  });
  cuerpo.addEventListener('dblclick', (evento) => {
    const fila = filaDe(evento);
    if (fila) {
      mostrarDetalle(fila.dataset.id);
    }
  });
  cuerpo.addEventListener('keydown', (evento) => {
    const fila = filaDe(evento);
    if (fila && evento.key === 'Enter') {
      mostrarDetalle(fila.dataset.id);
    }
    if (fila && evento.key === ' ') {
      evento.preventDefault();
      seleccionar(fila.dataset.id);
    }
  });

  return {
    consultar,
    refrescar,
    /** Después de registrar un pedido: repinta y lo deja seleccionado (devuelve false si los filtros lo ocultan). */
    async mostrarNuevo(id) {
      await refrescar();
      if (cuerpo.querySelector(`tr[data-id="${CSS.escape(id)}"]`)) {
        seleccionar(id);
        return true;
      }
      return false;
    },
  };
}
