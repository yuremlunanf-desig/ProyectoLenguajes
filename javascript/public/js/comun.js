/**
 * Utilidades compartidas por las páginas: llamadas a la API, alertas (toasts) y creación segura de elementos.
 *
 * Responsable: Ian (Login): infraestructura compartida de la interfaz web.
 */

/** Error de una llamada a la API: lleva el código HTTP y el tipo que mandó el servidor. */
export class ErrorApi extends Error {
  constructor(status, tipo, mensaje, { silencioso = false } = {}) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    this.tipo = tipo;
    this.silencioso = silencioso;
  }
}

/**
 * Llama a la API con JSON y devuelve el cuerpo de la respuesta (null si es 204).
 * Si el servidor responde con error lanza un ErrorApi con el mensaje listo para mostrar.
 * Una respuesta 401 fuera del login significa que la sesión expiró: se vuelve al login.
 */
export async function api(ruta, { metodo = 'GET', cuerpo, sinRedireccion = false } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      credentials: 'same-origin',
      headers: cuerpo === undefined ? {} : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorApi(0, 'red', 'No se pudo contactar con el servidor. ¿Sigue en ejecución?');
  }
  if (respuesta.status === 204) {
    return null;
  }
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // Una respuesta sin JSON (por ejemplo, una página de error): se usa un mensaje genérico.
  }
  if (!respuesta.ok) {
    if (respuesta.status === 401 && !sinRedireccion) {
      location.assign('/');
      throw new ErrorApi(401, 'autenticacion', 'La sesión expiró.', { silencioso: true });
    }
    const error = datos?.error;
    throw new ErrorApi(respuesta.status, error?.tipo ?? 'interno', error?.mensaje ?? `Error ${respuesta.status}.`);
  }
  return datos;
}

/**
 * Crea un elemento. Los textos se asignan con textContent (nunca como HTML), así lo que escribe el
 * usuario, por ejemplo el nombre de un cliente, no puede inyectar código en la página.
 */
export function el(etiqueta, atributos = {}, ...hijos) {
  const elemento = document.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    if (nombre === 'clase') elemento.className = valor;
    else elemento.setAttribute(nombre, valor === true ? '' : valor);
  }
  elemento.append(...hijos);
  return elemento;
}

// ---------- alertas ----------

const ICONOS = { aviso: '⚠', error: '✕', ok: '✓', info: 'ℹ' };
const DURACION_MS = { aviso: 6000, error: 8000, ok: 4000, info: 5000 };

function contenedorDeToasts() {
  let contenedor = document.getElementById('toasts');
  if (!contenedor) {
    contenedor = el('div', { id: 'toasts', clase: 'toasts', role: 'region', 'aria-label': 'Notificaciones' });
    document.body.append(contenedor);
  }
  return contenedor;
}

/**
 * Muestra una alerta tipo toast: tipo = 'aviso' (algo que el usuario corrige), 'error', 'ok' o 'info'.
 * Los errores se anuncian a los lectores de pantalla con role="alert".
 */
export function toast(mensaje, tipo = 'info', { duracion = DURACION_MS[tipo] } = {}) {
  const cerrar = el('button', { clase: 'toast__cerrar', type: 'button', 'aria-label': 'Cerrar notificación' }, '×');
  const alerta = el(
    'div',
    { clase: `toast toast--${tipo}`, role: tipo === 'error' ? 'alert' : 'status' },
    el('span', { clase: 'toast__icono', 'aria-hidden': 'true' }, ICONOS[tipo] ?? ICONOS.info),
    el('span', { clase: 'toast__texto' }, mensaje),
    cerrar
  );
  const quitar = () => alerta.remove();
  cerrar.addEventListener('click', quitar);
  contenedorDeToasts().append(alerta);
  setTimeout(quitar, duracion);
  return alerta;
}

/** Muestra un error de la API con el estilo que le corresponde según su tipo. */
export function mostrarError(error) {
  if (error?.silencioso) {
    return;
  }
  if (!(error instanceof ErrorApi)) {
    console.error(error);
    toast('Ocurrió un error inesperado en la página. Recárgala e intenta de nuevo.', 'error');
    return;
  }
  // 'formulario' y 'conflicto' son cosas que el usuario corrige; el resto son errores.
  const tipo = error.tipo === 'formulario' || error.tipo === 'conflicto' ? 'aviso' : 'error';
  toast(error.message, tipo);
}

/** Marca (o desmarca) un campo como inválido para lectores de pantalla y para el estilo. */
export function marcarInvalido(campo, invalido = true) {
  if (invalido) {
    campo.setAttribute('aria-invalid', 'true');
    campo.addEventListener('input', () => campo.removeAttribute('aria-invalid'), { once: true });
  } else {
    campo.removeAttribute('aria-invalid');
  }
}

/** Avisa (toast), marca el campo y le da el foco. Devuelve false para poder usarlo como `return avisarCampo(...)`. */
export function avisarCampo(campo, mensaje) {
  toast(mensaje, 'aviso');
  marcarInvalido(campo);
  campo.focus();
  return false;
}

/** Llena un <select> con opciones { valor, etiqueta }. Si se da `marcador`, la primera opción es ese texto (sin valor). */
export function llenarSelect(select, opciones, { marcador } = {}) {
  const elementos = [];
  if (marcador !== undefined) {
    elementos.push(el('option', { value: '' }, marcador));
  }
  for (const opcion of opciones) {
    elementos.push(el('option', { value: opcion.valor }, opcion.etiqueta));
  }
  select.replaceChildren(...elementos);
}
