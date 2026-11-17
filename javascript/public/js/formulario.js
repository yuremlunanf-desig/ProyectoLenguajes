/**
 * Formulario de captura de pedidos: datos del cliente, carrito y registro.
 *
 * Responsable: Edsson (Formularios).
 *
 * Cada dato se valida primero en el navegador (respuesta inmediata, con una alerta tipo toast) y el
 * servidor vuelve a validar todo: las reglas de negocio, como «cantidad mayor que 0» o «el carrito no
 * puede estar vacío», las decide siempre el servidor con los módulos de la fase 1.
 *
 * El carrito vive aquí; cada cambio se manda a POST /api/pedidos/vista-previa, que devuelve las líneas
 * normalizadas (las del mismo producto sumadas) con su importe y los totales ya calculados.
 */
import { api, avisarCampo, el, llenarSelect, marcarInvalido, mostrarError, toast } from './comun.js';

export function iniciarFormulario({ opciones, productos, alRegistrar }) {
  const formulario = document.getElementById('form-pedido');
  const clienteId = document.getElementById('cliente-id');
  const clienteNombre = document.getElementById('cliente-nombre');
  const tipo = document.getElementById('tipo-cliente');
  const prioridad = document.getElementById('prioridad');
  const envio = document.getElementById('envio');
  const producto = document.getElementById('producto');
  const cantidad = document.getElementById('cantidad');
  const cuerpoCarrito = document.querySelector('#tabla-carrito tbody');
  const importes = {
    subtotal: document.getElementById('imp-subtotal'),
    descuento: document.getElementById('imp-descuento'),
    iva: document.getElementById('imp-iva'),
    envio: document.getElementById('imp-envio'),
    total: document.getElementById('imp-total'),
  };

  let carrito = []; // [{ sku, nombre, cantidad, importe }]
  let seleccionada = null; // sku de la línea elegida
  let version = 0; // descarta vistas previas viejas si llegan desordenadas

  llenarSelect(tipo, opciones.tiposCliente);
  llenarSelect(prioridad, opciones.prioridades);
  prioridad.value = 'MEDIA';
  llenarSelect(envio, opciones.envios);
  const opcionesDeProducto = [];
  for (const p of productos) {
    opcionesDeProducto.push({ valor: p.sku, etiqueta: p.etiqueta });
  }
  llenarSelect(producto, opcionesDeProducto, { marcador: 'Elige un producto…' });

  /** Lo que se le manda al servidor para calcular un carrito. */
  function cuerpoDeVistaPrevia(lineas) {
    return { tipoCliente: tipo.value, envio: envio.value, lineas };
  }

  /** Solo el sku y la cantidad de cada línea (lo demás lo calcula el servidor). */
  function lineasDe(lista) {
    const lineas = [];
    for (const linea of lista) {
      lineas.push({ sku: linea.sku, cantidad: linea.cantidad });
    }
    return lineas;
  }

  function pintarCarrito() {
    if (carrito.length === 0) {
      cuerpoCarrito.replaceChildren(el('tr', {}, el('td', { colspan: 3, clase: 'vacio' }, 'El carrito está vacío.')));
      return;
    }
    const filas = [];
    for (const linea of carrito) {
      const seleccionadaAhora = linea.sku === seleccionada;
      filas.push(
        el(
          'tr',
          { 'data-sku': linea.sku, 'aria-selected': seleccionadaAhora ? 'true' : 'false', tabindex: '0' },
          el('td', {}, linea.nombre),
          el('td', { clase: 'centro' }, String(linea.cantidad)),
          el('td', { clase: 'num' }, linea.importe)
        )
      );
    }
    cuerpoCarrito.replaceChildren(...filas);
  }

  /** Muestra los importes del desglose, o rayitas si el carrito está vacío (desglose = null). */
  function pintarImportes(desglose) {
    if (desglose === null) {
      for (const nombre in importes) {
        importes[nombre].textContent = '—';
      }
      return;
    }
    importes.subtotal.textContent = desglose.subtotal;
    importes.descuento.textContent = `-${desglose.descuento}`;
    importes.iva.textContent = desglose.iva;
    importes.envio.textContent = desglose.envio;
    importes.total.textContent = desglose.total;
  }

  /** Pide al servidor las líneas normalizadas y los importes del carrito indicado. */
  async function calcular(lineas) {
    const esta = ++version;
    const respuesta = await api('/api/pedidos/vista-previa', { metodo: 'POST', cuerpo: cuerpoDeVistaPrevia(lineas) });
    return esta === version ? respuesta : null;
  }

  async function actualizarVistaPrevia() {
    try {
      const respuesta = await calcular(lineasDe(carrito));
      if (!respuesta) return;
      carrito = respuesta.lineas;
      pintarCarrito();
      pintarImportes(respuesta.desglose);
    } catch (error) {
      mostrarError(error);
    }
  }

  // --- acciones ---

  async function agregar() {
    if (producto.value === '') {
      avisarCampo(producto, 'Elige un producto de la lista.');
      return;
    }
    const texto = cantidad.value.trim();
    if (!/^[+-]?\d+$/.test(texto)) {
      avisarCampo(cantidad, `La cantidad «${texto}» no es un número entero. Escribe, por ejemplo, 2.`);
      return;
    }
    try {
      // El servidor valida la línea (cantidad > 0, etc.) y devuelve el carrito ya con las líneas sumadas.
      const respuesta = await calcular([...lineasDe(carrito), { sku: producto.value, cantidad: texto }]);
      if (!respuesta) return;
      carrito = respuesta.lineas;
      pintarCarrito();
      pintarImportes(respuesta.desglose);
      cantidad.value = '1';
      marcarInvalido(cantidad, false);
      marcarInvalido(producto, false);
      toast(`Agregado al carrito: ${producto.selectedOptions[0].textContent.split(' · ')[1]}.`, 'ok', { duracion: 1800 });
    } catch (error) {
      mostrarError(error);
      cantidad.focus();
    }
  }

  function quitar() {
    if (seleccionada === null || !carrito.some((l) => l.sku === seleccionada)) {
      toast('Selecciona la línea del carrito que quieres quitar.', 'aviso');
      return;
    }
    carrito = carrito.filter((l) => l.sku !== seleccionada);
    seleccionada = null;
    pintarCarrito();
    actualizarVistaPrevia();
  }

  function vaciar() {
    carrito = [];
    seleccionada = null;
    pintarCarrito();
    pintarImportes(null);
  }

  async function registrar() {
    if (clienteId.value.trim() === '') {
      avisarCampo(clienteId, 'Escribe el id del cliente (por ejemplo C005).');
      return;
    }
    if (clienteNombre.value.trim() === '') {
      avisarCampo(clienteNombre, 'Escribe el nombre del cliente.');
      return;
    }
    if (carrito.length === 0) {
      avisarCampo(producto, 'El carrito está vacío: agrega al menos un producto.');
      return;
    }
    try {
      const creado = await api('/api/pedidos', {
        metodo: 'POST',
        cuerpo: {
          cliente: { id: clienteId.value.trim(), nombre: clienteNombre.value.trim(), tipo: tipo.value },
          envio: envio.value,
          prioridad: prioridad.value,
          lineas: lineasDe(carrito),
        },
      });
      clienteId.value = '';
      clienteNombre.value = '';
      for (const campo of [clienteId, clienteNombre, producto, cantidad]) marcarInvalido(campo, false);
      vaciar();
      clienteId.focus();
      toast(creado.mensaje, 'ok');
      alRegistrar(creado);
    } catch (error) {
      mostrarError(error); // por ejemplo 422: el negocio rechazó el pedido
    }
  }

  // --- eventos ---
  document.getElementById('btn-agregar').addEventListener('click', agregar);
  document.getElementById('btn-quitar').addEventListener('click', quitar);
  document.getElementById('btn-vaciar').addEventListener('click', vaciar);
  cantidad.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      agregar();
    }
  });
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    registrar();
  });
  // Cambiar el tipo de cliente o el envío cambia el descuento y el costo: se recalcula.
  for (const campo of [tipo, envio]) {
    campo.addEventListener('change', () => {
      if (carrito.length > 0) actualizarVistaPrevia();
    });
  }
  cuerpoCarrito.addEventListener('click', (evento) => {
    const fila = evento.target.closest('tr[data-sku]');
    if (!fila) return;
    seleccionada = fila.dataset.sku;
    for (const otra of cuerpoCarrito.querySelectorAll('tr[data-sku]')) {
      otra.setAttribute('aria-selected', otra === fila ? 'true' : 'false');
    }
  });

  pintarCarrito();
}
