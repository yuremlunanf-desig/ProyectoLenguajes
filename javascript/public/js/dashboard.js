/**
 * Pantalla principal: carga los datos comunes, conecta formulario, tabla y panel de concurrencia, y
 * mantiene la tabla al día preguntando al servidor cada 500 ms.
 *
 * Responsable: Leonardo (Dashboard) conecta las piezas; Ian (Login) el cierre de sesión.
 */
import { api, mostrarError, toast } from './comun.js';
import { iniciarConcurrencia } from './concurrencia.js';
import { iniciarFormulario } from './formulario.js';
import { iniciarPedidos } from './pedidos.js';

const INTERVALO_MS = 500; // cada cuánto se consulta al servidor

const mensaje = document.getElementById('mensaje');
function informar(texto) {
  mensaje.textContent = texto;
}

async function main() {
  const sesion = await api('/api/sesion');
  const opciones = await api('/api/opciones');
  const catalogo = await api('/api/catalogo');
  const despachador = await api('/api/despachador');
  document.getElementById('usuario-actual').textContent = `${sesion.usuario.nombre} (${sesion.usuario.usuario})`;

  const pedidos = iniciarPedidos({ opciones, informar });
  const concurrencia = iniciarConcurrencia({ opciones, estadoInicial: despachador, informar });
  iniciarFormulario({
    opciones,
    productos: catalogo.productos,
    async alRegistrar(creado) {
      const visible = await pedidos.mostrarNuevo(creado.id);
      let texto = creado.mensaje;
      if (!visible) {
        texto += ' (No se ve en la tabla por los filtros activos.)';
      }
      informar(texto);
    },
  });
  await pedidos.consultar(true); // true: avisa de los pedidos rechazados al cargar el archivo

  // Tiempo real: cada 500 ms se le pregunta al servidor cómo van los pedidos y el despachador.
  let consultando = false; // evita encimar consultas si el servidor tarda en responder
  let sinConexion = false;
  setInterval(async () => {
    if (consultando) {
      return;
    }
    consultando = true;
    try {
      await pedidos.consultar(false);
      await concurrencia.consultar();
      if (sinConexion) {
        sinConexion = false;
        toast('Se recuperó la conexión con el servidor.', 'ok', { duracion: 2500 });
      }
    } catch (error) {
      // Se avisa una sola vez, no cada 500 ms, mientras el servidor no responda.
      if (!sinConexion && !error.silencioso) {
        sinConexion = true;
        toast('No se pudo actualizar la información del servidor. Se reintentará solo.', 'error');
      }
    }
    consultando = false;
  }, INTERVALO_MS);

  document.getElementById('btn-logout').addEventListener('click', async () => {
    try {
      await api('/api/logout', { metodo: 'POST' });
    } catch (error) {
      toast('No se pudo cerrar la sesión en el servidor; se vuelve al inicio.', 'aviso');
    }
    location.assign('/');
  });
}

main().catch(mostrarError);
