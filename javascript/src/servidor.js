'use strict';

/**
 * Ensamblado del servidor web: arma el modelo, los controladores y las rutas de Express.
 *
 * Responsable: Ian (Login) crea el esqueleto y la protección de rutas; cada integrante conecta sus rutas.
 *
 * Aquí se arma todo el MVC («composition root»). crearApp devuelve la aplicación de Express sin
 * ponerla a escuchar, para que las pruebas la usen con supertest; server.js es quien abre el puerto.
 */

const path = require('node:path');
const express = require('express');
const { ServicioAutenticacion } = require('./autenticacion');
const { leerCatalogo } = require('./catalogo');
const { AlmacenPedidos } = require('./almacen');
const { Despachador } = require('./despachador');
const { ControladorLogin } = require('./controladores/controladorLogin');
const { ControladorDashboard } = require('./controladores/controladorDashboard');
const { ControladorFormulario } = require('./controladores/controladorFormulario');
const { ControladorConcurrencia } = require('./controladores/controladorConcurrencia');
const { Sesiones, requerirSesion, requerirSesionPagina } = require('./api/sesiones');
const { apiNoEncontrada, manejadorDeErrores } = require('./api/errores');
const { rutasAcceso } = require('./api/rutasAcceso');
const { rutasPedidos } = require('./api/rutasPedidos');
const { rutasFormulario } = require('./api/rutasFormulario');
const { rutasDespachador } = require('./api/rutasDespachador');
const { rutasDashboard } = require('./api/rutasDashboard');

const CARPETA_PUBLICA = path.join(__dirname, '..', 'public');
const CARPETA_PROYECTO = path.join(__dirname, '..', '..');
const CARPETA_DASHBOARD = path.join(CARPETA_PROYECTO, 'dashboard');

/** Cabeceras de seguridad: solo se carga contenido del propio servidor y no se permite incrustar la página. */
function cabecerasDeSeguridad(req, res, next) {
  res.set({
    'Content-Security-Policy':
      "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  next();
}

/**
 * Cabeceras del dashboard comparativo: igual de estrictas, pero deja cargar Chart.js y Mermaid desde el CDN de
 * jsDelivr (con integridad verificada en el HTML). Mermaid dibuja sus diagramas con estilos en línea.
 */
function cabecerasDashboard(req, res, next) {
  res.set({
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  next();
}

/**
 * Crea la aplicación. Lanza un error con mensaje legible si faltan o están dañados los archivos de datos
 * (ArchivoUsuariosError, CatalogoError, o el error de lectura de solicitudes_pequenas.json).
 */
async function crearApp({
  carpetaDatos,
  carpetaPublica = CARPETA_PUBLICA,
  carpetaProyecto = CARPETA_PROYECTO,
  carpetaDashboard = CARPETA_DASHBOARD,
} = {}) {
  // --- modelo ---
  const servicio = await ServicioAutenticacion.desdeJson(path.join(carpetaDatos, 'usuarios.json'));
  const catalogo = await leerCatalogo(path.join(carpetaDatos, 'catalogo.json'));
  const almacen = new AlmacenPedidos(path.join(carpetaDatos, 'solicitudes_pequenas.json'));
  await almacen.cargar();
  const despachador = new Despachador();
  const sesiones = new Sesiones();

  // --- controladores ---
  const controladorLogin = new ControladorLogin(servicio);
  const controladorDashboard = new ControladorDashboard(almacen);
  const controladorFormulario = new ControladorFormulario(almacen, catalogo);
  const controladorConcurrencia = new ControladorConcurrencia(almacen, despachador);

  // --- rutas ---
  const app = express();
  app.disable('x-powered-by');

  // El dashboard comparativo (http://localhost:3000/dashboard) es público y de solo lectura. Va antes de las
  // cabeceras generales porque necesita las suyas (CDN); la página y sus datos salen del mismo servidor.
  app.use('/dashboard', cabecerasDashboard, rutasDashboard({ carpetaProyecto }), express.static(carpetaDashboard));

  app.use(cabecerasDeSeguridad);
  app.use(express.json({ limit: '50kb' }));

  const api = express.Router();
  api.use(rutasAcceso({ controladorLogin, sesiones }));
  api.use(requerirSesion(sesiones)); // todo lo que sigue exige haber iniciado sesión
  api.use(rutasPedidos({ controladorDashboard, hayTrabajoEnCurso: () => controladorConcurrencia.enEjecucion }));
  api.use(rutasFormulario({ controladorFormulario }));
  api.use(rutasDespachador({ controladorConcurrencia }));
  api.use(apiNoEncontrada);
  app.use('/api', api);

  // El dashboard solo se sirve con sesión; el resto (login, CSS, JS) es público.
  app.get('/dashboard.html', requerirSesionPagina(sesiones), (req, res) => {
    res.sendFile(path.join(carpetaPublica, 'dashboard.html'));
  });
  app.use(express.static(carpetaPublica));

  app.use(manejadorDeErrores);

  return {
    app,
    almacen,
    despachador,
    sesiones,
    /** Detiene el despachador (se usa al apagar el servidor). */
    async cerrar() {
      await controladorConcurrencia.cerrar();
    },
  };
}

module.exports = { crearApp };
