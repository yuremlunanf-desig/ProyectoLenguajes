'use strict';

/**
 * Tarjetas de análisis cualitativo: ventajas y limitaciones de cada lenguaje, y tres preguntas para la clase.
 * Responsable: Edsson.
 *
 * Los textos están pensados para que un estudiante de 3er semestre los pueda explicar con sus palabras.
 * Algunas frases llevan datos reales del proyecto (LOC y tiempos): por eso son funciones que reciben los datos.
 * Si una función devuelve null (por ejemplo, porque falta un archivo de métricas), esa frase simplemente no se muestra.
 */

/** Busca en la lista el dato de un lenguaje: { lenguaje, metricas, loc, ... }. */
function datosDe(lenguajes, nombre) {
  for (const dato of lenguajes) {
    if (dato.lenguaje === nombre) {
      return dato;
    }
  }
  return null;
}

/** Último punto medido de un lenguaje en volumenes.json (el volumen más grande) o null. */
function ultimaMedicion(volumenes, nombre) {
  if (volumenes === null || !volumenes.resultados[nombre]) {
    return null;
  }
  const mediciones = volumenes.resultados[nombre];
  return mediciones[mediciones.length - 1];
}

const TARJETAS = [
  {
    lenguaje: 'Python',
    lema: 'El más corto de escribir',
    ventajas: [
      'Tipado dinámico: no declaras el tipo de cada variable (total = 0), así que escribes menos y pruebas más rápido.',
      'Se lee casi como español: no hay llaves ni punto y coma, la sangría marca los bloques.',
      'Tkinter normalmente viene incluido con Python: con una sola instalación ya tienes ventanas de escritorio.',
      'Decimal hace las cuentas de dinero exactas sin trucos.',
    ],
    limitaciones: [
      'Al ser dinámico, un error de tipo aparece hasta que corre esa línea. Por eso las pruebas con pytest son importantes.',
      'Tkinter solo se puede tocar desde el hilo principal: el despachador deja sus avisos en una cola (queue.Queue) y la ventana la revisa cada 50 ms con after().',
      'Las ventanas de Tkinter se ven más sencillas que una página web bien diseñada.',
      'En cálculo muy pesado suele ser más lento que Java. Aquí no se nota: casi todo el tiempo es la espera simulada de 100 ms.',
    ],
  },
  {
    lenguaje: 'Java',
    lema: 'El más estricto: el compilador te cuida',
    ventajas: [
      'Tipado estático: el compilador revisa los tipos antes de ejecutar. Si mezclas un texto con un número, ni compila.',
      'BigDecimal y los records dan dinero exacto y datos que no cambian por accidente.',
      'Hilos de verdad: un ExecutorService reparte las tareas entre varios hilos que pueden usar varios núcleos.',
      'Swing viene en el JDK, y Maven y JUnit ordenan la compilación y las pruebas.',
    ],
    limitaciones: [
      (datos) => {
        const java = datosDe(datos.lenguajes, 'Java');
        const python = datosDe(datos.lenguajes, 'Python');
        if (!java || !python) {
          return null;
        }
        return `Verboso: hay que declarar tipos, clases y excepciones aun para cosas simples, y cada clase va en su archivo (${java.loc.archivos} archivos contra ${python.loc.archivos} de Python).`;
      },
      'Swing no es seguro entre hilos: hay que acordarse de actualizar la pantalla con SwingUtilities.invokeLater. Además sus ventanas se ven anticuadas.',
      (datos) => {
        const java = datosDe(datos.lenguajes, 'Java');
        const python = datosDe(datos.lenguajes, 'Python');
        if (!java || !java.metricas || !python || !python.metricas) {
          return null;
        }
        return `Dato real: leer el JSON tomó ${numero(java.metricas.tiempos_ms.lectura_json, 1)} ms en Java y ${numero(python.metricas.tiempos_ms.lectura_json, 1)} ms en Python: la JVM necesita «calentarse» (cargar clases) antes de ir rápido.`;
      },
      (datos) => {
        const java = ultimaMedicion(datos.volumenes, 'Java');
        const python = ultimaMedicion(datos.volumenes, 'Python');
        if (!java || !python) {
          return null;
        }
        return (
          `Dato real: con ${numero(java.pedidos)} pedidos, el cambio concurrente tardó ${numero(java.concurrente_ms / 1000, 1)} s en Java ` +
          `(el pool tiene un tope de 16 hilos) y ${numero(python.concurrente_ms / 1000, 1)} s en Python.`
        );
      },
    ],
  },
  {
    lenguaje: 'JavaScript',
    lema: 'El más fácil de hacer visual',
    ventajas: [
      'Un solo lenguaje para el servidor (Node) y para el navegador.',
      'La interfaz web es lo más fácil de dejar bonita: HTML y CSS dan botones, tablas, colores y diseño adaptable sin librerías.',
      'async/await y Promise.all hacen muy natural esperar muchas cosas a la vez.',
      'Cualquiera la usa con solo abrir el navegador: no hay que instalar nada en su computadora.',
    ],
    limitaciones: [
      'Tipado dinámico y con conversiones raras: 0.1 + 0.2 no da 0.3. Por eso guardamos el dinero en centavos enteros.',
      'No tiene ventanas de escritorio propias: necesita un servidor (Express) y el navegador le pregunta cada 500 ms si algo cambió (polling).',
      'Tiene un solo hilo: una cuenta pesada detendría a todos. Aquí funciona porque casi todo es esperar.',
      (datos) => {
        const js = datosDe(datos.lenguajes, 'JavaScript');
        if (!js) {
          return null;
        }
        return `Son dos programas (servidor y navegador) que hay que mantener y proteger: ${numero(js.loc.codigo)} líneas en total, contando HTML y CSS.`;
      },
    ],
  },
];

/** Datos de «En este proyecto» al pie de cada tarjeta. */
function datoDelProyecto(dato) {
  if (!dato) {
    return 'Todavía no hay datos de este lenguaje.';
  }
  const loc = dato.loc;
  let texto = `En este proyecto: ${numero(loc.codigo)} líneas de código en ${loc.archivos} archivos (${numero(loc.interfaz)} de interfaz) y ${numero(loc.pruebas)} de pruebas.`;
  if (dato.metricas) {
    texto += ` Aceleración concurrente de ${numero(dato.metricas.aceleracion_concurrencia, 2)}×.`;
  }
  return texto;
}

/** Quita las frases que no se pudieron calcular y evalúa las que son funciones. */
function frasesDe(lista, datos) {
  const frases = [];
  for (const item of lista) {
    const frase = typeof item === 'function' ? item(datos) : item;
    if (frase !== null) {
      frases.push(frase);
    }
  }
  return frases;
}

function listaDe(frases) {
  const lista = crear('ul', {});
  for (const frase of frases) {
    lista.append(crear('li', {}, frase));
  }
  return lista;
}

function dibujarTarjetas(datos) {
  const tarjetas = [];
  for (const contenido of TARJETAS) {
    tarjetas.push(
      crear(
        'article',
        { class: `tarjeta tarjeta-lenguaje ${idDe(contenido.lenguaje)}` },
        crear('h3', {}, contenido.lenguaje),
        crear('p', { class: 'secundario' }, contenido.lema),
        crear('h4', {}, 'Ventajas'),
        listaDe(frasesDe(contenido.ventajas, datos)),
        crear('h4', {}, 'Limitaciones'),
        listaDe(frasesDe(contenido.limitaciones, datos)),
        crear('p', { class: 'dato-real' }, datoDelProyecto(datosDe(datos.lenguajes, contenido.lenguaje)))
      )
    );
  }
  reemplazar(porId('tarjetas-lenguajes'), ...tarjetas);
}

/** Las tres preguntas que más salen en clase, con una respuesta corta y un dato del proyecto. */
function dibujarPreguntas(datos) {
  const python = datosDe(datos.lenguajes, 'Python');
  const java = datosDe(datos.lenguajes, 'Java');
  const js = datosDe(datos.lenguajes, 'JavaScript');
  const conDatos = python && java && js;

  const preguntas = [
    {
      titulo: '¿Tipado estático o dinámico?',
      texto:
        'En Java el compilador comprueba los tipos antes de ejecutar y te avisa de errores como sumar un texto con un número. ' +
        'Python y JavaScript no lo hacen (Python admite anotaciones de tipo, pero no las exige al ejecutar): escribes menos y avanzas rápido, ' +
        'pero un error de tipo puede esconderse hasta que se ejecuta esa línea. Para compensarlo, cada lenguaje tiene pruebas automáticas (8 en cada uno).',
    },
    {
      titulo: '¿Qué tan verboso es cada uno?',
      texto: conDatos
        ? `Sin contar la interfaz, la lógica del sistema ocupa ${numero(python.loc.logica)} líneas en Python, ${numero(java.loc.logica)} en Java y ${numero(js.loc.logica)} en JavaScript. ` +
          'Java pide más ceremonia (tipos, clases, excepciones). JavaScript suma líneas porque, además de las reglas, armamos el servidor: rutas, sesiones y errores en JSON.'
        : 'Faltan datos de algún lenguaje para comparar las líneas de código.',
    },
    {
      titulo: '¿Interfaz web o de escritorio?',
      texto: conDatos
        ? `En escritorio (Tkinter y Swing: ${numero(python.loc.interfaz)} y ${numero(java.loc.interfaz)} líneas de interfaz) la ventana y la lógica viven en el mismo programa, y hay que cuidar que solo un hilo toque la pantalla. ` +
          `En la web (${numero(js.loc.interfaz)} líneas de HTML, CSS y JavaScript) el diseño es más fácil de lograr y de compartir, pero hay dos partes que se hablan por HTTP y el navegador tiene que preguntar cada 500 ms para enterarse de los cambios.`
        : 'Faltan datos de algún lenguaje para comparar las interfaces.',
    },
  ];

  const tarjetas = [];
  for (const pregunta of preguntas) {
    tarjetas.push(crear('article', { class: 'tarjeta pregunta' }, crear('h4', {}, pregunta.titulo), crear('p', {}, pregunta.texto)));
  }
  reemplazar(porId('preguntas-clase'), ...tarjetas);
}

document.addEventListener('metricas-listas', (evento) => {
  dibujarTarjetas(evento.detail);
  dibujarPreguntas(evento.detail);
});
