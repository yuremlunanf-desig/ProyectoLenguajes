'use strict';

/**
 * Dibuja los diagramas de arquitectura y de concurrencia con Mermaid.js.
 * Responsable: Yurem.
 *
 * El texto de cada diagrama está en js/definiciones.js. Aquí solo se le pide a Mermaid que lo convierta en SVG
 * y se mete el resultado en el contenedor de index.html (#diagrama-mvc, #diagrama-login, #diagrama-concurrencia).
 * Los diagramas no dependen de las métricas, así que se dibujan en cuanto carga la página.
 */

let lenguajeDiagrama = 'Python'; // pestaña activa del diagrama de concurrencia
let contador = 0; // Mermaid necesita un id distinto para cada dibujo

document.addEventListener('DOMContentLoaded', () => {
  for (const boton of porId('pestanas-concurrencia').querySelectorAll('button')) {
    boton.addEventListener('click', () => {
      lenguajeDiagrama = boton.dataset.lenguaje;
      for (const otro of porId('pestanas-concurrencia').querySelectorAll('button')) {
        otro.setAttribute('aria-selected', String(otro === boton));
      }
      dibujarConcurrencia();
    });
  }
  dibujarDiagramas();
});

// Si cambia entre modo claro y oscuro, se vuelven a dibujar con los colores del tema.
alCambiarTema(dibujarDiagramas);

function prepararMermaid() {
  const oscuro = temaOscuro();
  mermaid.initialize({
    startOnLoad: false, // los dibujamos nosotros, uno por uno
    securityLevel: 'strict', // Mermaid no ejecuta HTML ni scripts que vengan en el texto
    theme: oscuro ? 'dark' : 'neutral',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    flowchart: { useMaxWidth: true, htmlLabels: true, nodeSpacing: 40, rankSpacing: 60, padding: 20, wrappingWidth: 420 },
    sequence: { useMaxWidth: true, mirrorActors: false },
  });
}

/** Convierte un texto de Mermaid en SVG y lo pone dentro del contenedor. Si falla, lo dice en la página. */
async function dibujarEn(idContenedor, texto) {
  const contenedor = porId(idContenedor);
  try {
    contador++;
    const resultado = await mermaid.render(`dibujo-mermaid-${contador}`, texto.trim());
    contenedor.innerHTML = resultado.svg; // SVG que genera Mermaid a partir de nuestro propio texto
  } catch (error) {
    reemplazar(contenedor, crear('p', { class: 'aviso-libreria' }, `No se pudo dibujar el diagrama: ${error.message}`));
  }
}

function dibujarConcurrencia() {
  const elegido = DIAGRAMAS_CONCURRENCIA[lenguajeDiagrama];
  porId('explicacion-concurrencia').textContent = elegido.explicacion;
  return dibujarEn('diagrama-concurrencia', elegido.diagrama);
}

async function dibujarDiagramas() {
  if (typeof mermaid === 'undefined') {
    // No cargó la librería (sin internet o CDN bloqueado): el resto de la página sigue funcionando.
    for (const id of ['diagrama-mvc', 'diagrama-login', 'diagrama-concurrencia']) {
      reemplazar(porId(id), crear('p', { class: 'aviso-libreria' }, 'No se pudo cargar Mermaid desde el CDN. Revisa tu conexión a internet y recarga la página.'));
    }
    return;
  }
  prepararMermaid();
  await dibujarEn('diagrama-mvc', DIAGRAMA_MVC);
  await dibujarEn('diagrama-login', DIAGRAMA_LOGIN);
  await dibujarConcurrencia();
}
