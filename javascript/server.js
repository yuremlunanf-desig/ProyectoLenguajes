'use strict';

/**
 * Punto de entrada de la interfaz web (Express): login y dashboard de pedidos en el navegador.
 *
 * Responsable: Ian (Login).
 *
 * Uso (desde la carpeta javascript/):
 *     npm start
 * y abrir http://localhost:3000 en el navegador.
 *
 * Usuarios de prueba (datos/usuarios.json):  admin / 1234   y   operador / ventas
 * La versión de consola sigue siendo index.js (npm run consola).
 *
 * Variables opcionales: PORT (3000 por defecto) y HOST (127.0.0.1: solo se acepta tráfico de esta
 * computadora). Ejemplo en PowerShell:  $env:PORT = 3001; npm start
 */

const path = require('node:path');
const { crearApp } = require('./src/servidor');

const PUERTO = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const CARPETA_DATOS = path.join(__dirname, '..', 'datos');

async function main() {
  let aplicacion;
  try {
    aplicacion = await crearApp({ carpetaDatos: CARPETA_DATOS });
  } catch (error) {
    console.error(`No se pudo iniciar el servidor: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  // Se escucha 'listening' en lugar de pasar un callback a listen(): en Express 5 ese callback también
  // se invoca cuando hay un error (por ejemplo, puerto ocupado) y mostraría «lista» por equivocación.
  const servidor = aplicacion.app.listen(PUERTO, HOST);
  servidor.once('listening', () => {
    console.log(`Interfaz web lista en http://localhost:${PUERTO}  (Ctrl+C para detenerla)`);
  });
  servidor.on('error', (error) => {
    console.error(
      error.code === 'EADDRINUSE'
        ? `El puerto ${PUERTO} ya está en uso. Cierra el otro programa o elige otro puerto (PORT=3001).`
        : `No se pudo abrir el puerto ${PUERTO}: ${error.message}`
    );
    process.exitCode = 1;
  });

  let apagando = false;
  const apagar = async () => {
    if (apagando) {
      return;
    }
    apagando = true;
    await aplicacion.cerrar();
    servidor.close(() => process.exit(0));
    servidor.closeAllConnections?.();
  };
  process.on('SIGINT', apagar);
  process.on('SIGTERM', apagar);
}

main();
