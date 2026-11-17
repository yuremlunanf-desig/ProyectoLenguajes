'use strict';

/**
 * Texto de los diagramas de Mermaid.js. Aquí solo hay datos (texto); quien los dibuja es js/diagramas.js.
 * Responsable: Yurem.
 *
 * Mermaid convierte este texto en un dibujo SVG. Un diagrama de secuencia (sequenceDiagram) se lee de arriba
 * hacia abajo: cada flecha es un mensaje entre dos participantes. Un diagrama de flujo (flowchart) une cajas
 * con flechas. Todo lo que aparece aquí corresponde al código real del proyecto (nombres de clases y archivos).
 */

/** 1. Arquitectura MVC de las tres versiones. */
const DIAGRAMA_MVC = `
flowchart TB
  subgraph V["Vista"]
    VP["Python<br/>Tkinter<br/>carpeta gui/"]
    VJ["Java<br/>Swing<br/>paquete tienda.vista"]
    VW["JavaScript<br/>Navegador<br/>carpeta public/"]
  end
  subgraph C["Controlador"]
    CP["Python<br/>gui/controlador_XXX.py"]
    CJ["Java<br/>paquete<br/>tienda.controlador"]
    CW["JavaScript<br/>src/controladores<br/>y rutas Express (src/api)"]
  end
  M["Modelo<br/>Autenticación y almacén de pedidos<br/>Validación y cálculo de importes<br/>Consultas funcionales<br/>Concurrencia: cambio de estados"]
  D["Archivos JSON en datos/<br/>usuarios.json · catalogo.json · solicitudes_pequenas.json"]
  VP --> CP
  VJ --> CJ
  VW -- "fetch() cada 500 ms<br/>HTTP /api/..." --> CW
  CP --> M
  CJ --> M
  CW --> M
  M --> D
`;

/** 2. Inicio de sesión: igual en los tres lenguajes. */
const DIAGRAMA_LOGIN = `
sequenceDiagram
  autonumber
  actor U as Usuario
  participant V as Vista de login<br/>(Tkinter, Swing o web)
  participant C as ControladorLogin
  participant S as ServicioAutenticacion
  participant J as usuarios.json
  Note over S,J: Al arrancar, el servicio lee la lista de usuarios
  S->>J: leer usuarios
  J-->>S: usuario, password y nombre de cada uno
  U->>V: escribe usuario y password
  V->>C: iniciar sesión(usuario, password)
  alt algún campo está vacío
    C-->>V: error: faltan datos
    V-->>U: alerta (messagebox, JOptionPane o toast)
  else campos completos
    C->>S: autenticar(usuario, password)
    S->>S: compara el texto con cada usuario
    alt coincide con alguno
      S-->>C: el usuario y su nombre
      C-->>V: acceso concedido
      Note right of C: En la web el servidor crea además<br/>una sesión (cookie HttpOnly)
      V-->>U: abre el dashboard de pedidos
    else no coincide con ninguno
      S-->>C: error: credenciales inválidas
      C-->>V: error
      V-->>U: alerta «Acceso denegado»
    end
  end
`;

/** 3. Flujo de concurrencia al procesar la cola: uno por lenguaje, con una explicación corta. */
const DIAGRAMAS_CONCURRENCIA = {
  Python: {
    diagrama: `
sequenceDiagram
  participant T as Hilo principal<br/>(ventana Tkinter)
  participant D as Hilo del despachador<br/>(asyncio)
  participant W as Trabajadores<br/>(corrutinas)
  participant Q as queue.Queue
  T->>D: iniciar(pedidos, retardo, N)
  D->>W: crea N trabajadores
  loop cada cambio de estado (espera 100 ms)
    W->>Q: deja un EventoDespacho
  end
  loop after() cada 50 ms
    T->>Q: eventos_pendientes()
    Q-->>T: los eventos nuevos
    T->>T: actualiza la tabla y las barras
  end
`,
    explicacion:
      'Tkinter solo permite tocar la ventana desde el hilo principal. Por eso el despachador no la llama: deja sus avisos en una cola y la ventana la revisa cada 50 ms con after().',
  },
  Java: {
    diagrama: `
sequenceDiagram
  participant E as Hilo de eventos<br/>(Swing)
  participant C as Hilo coordinador<br/>(Despachador)
  participant P as ExecutorService<br/>(N hilos)
  E->>C: iniciar(pedidos, retardo, N)
  C->>P: envía una tarea por pedido
  loop cada cambio de estado (espera 100 ms)
    P-->>E: oyente avisa con SwingUtilities.invokeLater
    E->>E: actualiza la JTable
  end
`,
    explicacion:
      'Los hilos de trabajo avisan con un oyente (patrón Observer), pero la pantalla solo se modifica dentro de SwingUtilities.invokeLater, que lo ejecuta en el hilo de eventos de Swing.',
  },
  JavaScript: {
    diagrama: `
sequenceDiagram
  participant N as Navegador<br/>(public/js)
  participant S as Servidor Express
  participant W as Trabajadores async<br/>(promesas)
  N->>S: POST /api/despachador/iniciar
  S->>W: lanza N trabajadores (async/await)
  loop cada cambio de estado (espera 100 ms)
    W->>S: anota el nuevo estado (cola y eventos)
  end
  loop setInterval cada 500 ms
    N->>S: GET /api/pedidos y GET /api/despachador
    S-->>N: JSON con el estado actual
    N->>N: repinta la tabla y el panel
  end
`,
    explicacion:
      'El servidor no le avisa nada al navegador: el navegador le pregunta cada 500 ms con fetch() y setInterval() y dibuja lo que responde. Es consulta periódica (polling), sin conexiones abiertas.',
  },
};
