# Automatización de pedidos de una tienda

Proyecto final (Problema 2). El mismo sistema está implementado tres veces, en
**Python**, **Java** y **JavaScript**, y las tres versiones producen exactamente
los mismos importes. Además incluye un **dashboard comparativo** y un análisis escrito.

**Equipo:** Ian Hernández Ibarra, Leonardo Damián Hernández Hernández, Edsson Einar Montijo Reyes y
Yurem Jesús Aco Luna.

## Contenido del repositorio

```
ProyectoFinalLenguajes/
├── dashboard/                                            # dashboard comparativo (HTML, CSS y JavaScript con Chart.js y Mermaid.js)
│   ├── css/                                              # estilos
│   │   └── estilos.css
│   ├── datos/                                            # datos que lee el dashboard
│   │   ├── datos-fijos.js                                # copia fija de las métricas (la genera exportar_estatico.js)
│   │   └── volumenes.json                                # mediciones con 5, 100, 200, 300 y 400 pedidos
│   ├── js/                                               # un archivo por tarea (tabla, gráficas, diagramas, tarjetas, carga de datos)
│   │   ├── datos.js
│   │   ├── definiciones.js
│   │   ├── diagramas.js
│   │   ├── graficas.js
│   │   ├── tabla.js
│   │   ├── tarjetas.js
│   │   └── utiles.js
│   ├── exportar_estatico.js                              # actualiza la copia de datos / arma el sitio estático
│   ├── index.html                                        # página del dashboard
│   └── medir_volumenes.js                                # mide los tiempos por volumen de pedidos
├── datos/                                                # datos de entrada que comparten los tres lenguajes
│   ├── catalogo.json                                     # productos del formulario
│   ├── solicitudes_pequenas.json                         # 5 pedidos de prueba
│   └── usuarios.json                                     # usuarios del login
├── documentos/                                           # documentación del proyecto
│   ├── ANALISIS_COMPARATIVO.html                         # fuente del análisis comparativo
│   ├── PLAN_GITHUB_GUI.md                                # plan de trabajo en GitHub (ramas, commits y reparto)
│   └── analisis-comparativo.pdf                          # análisis comparativo escrito (entregable)
├── java/                                                 # implementación en Java (Maven, Swing)
│   ├── .mvn/                                             # Maven Wrapper (no hace falta instalar Maven)
│   │   └── wrapper/
│   │       └── maven-wrapper.properties
│   ├── src/
│   │   ├── main/
│   │   │   └── java/
│   │   │       └── tienda/                               # paquete principal
│   │   │           ├── concurrencia/                     # despachador (ExecutorService) y cambio de estados
│   │   │           │   ├── Despachador.java
│   │   │           │   ├── DespachadorException.java
│   │   │           │   ├── EventoDespacho.java
│   │   │           │   ├── OyenteTransicion.java
│   │   │           │   ├── ProcesadorEstados.java
│   │   │           │   ├── ResultadoProcesamiento.java
│   │   │           │   ├── ResumenCorrida.java
│   │   │           │   └── TipoEvento.java
│   │   │           ├── controlador/                      # controladores (MVC)
│   │   │           │   ├── CamposIncompletosException.java
│   │   │           │   ├── ControladorConcurrencia.java
│   │   │           │   ├── ControladorDashboard.java
│   │   │           │   ├── ControladorFormulario.java
│   │   │           │   ├── ControladorLogin.java
│   │   │           │   ├── ErrorConcurrenciaException.java
│   │   │           │   ├── ErrorFormularioException.java
│   │   │           │   └── Etiquetas.java
│   │   │           ├── datos/                            # lectura de JSON y almacén de pedidos
│   │   │           │   ├── AlmacenPedidos.java
│   │   │           │   ├── Catalogo.java
│   │   │           │   ├── CatalogoException.java
│   │   │           │   ├── ItemCatalogo.java
│   │   │           │   └── LectorJson.java
│   │   │           ├── funcional/                        # consultas con streams
│   │   │           │   └── ConsultasPedidos.java
│   │   │           ├── modelo/                           # Pedido, Cliente, Producto y enumerados
│   │   │           │   ├── Cliente.java
│   │   │           │   ├── EstadoPedido.java
│   │   │           │   ├── Pedido.java
│   │   │           │   ├── Prioridad.java
│   │   │           │   ├── Producto.java
│   │   │           │   ├── TipoCliente.java
│   │   │           │   └── TipoEnvio.java
│   │   │           ├── negocio/                          # cálculos y validaciones
│   │   │           │   ├── CalculadoraPedido.java
│   │   │           │   ├── Desglose.java
│   │   │           │   ├── PedidoInvalidoException.java
│   │   │           │   └── ValidadorPedido.java
│   │   │           ├── seguridad/                        # login contra usuarios.json
│   │   │           │   ├── AutenticacionException.java
│   │   │           │   ├── ServicioAutenticacion.java
│   │   │           │   └── Usuario.java
│   │   │           ├── vista/                            # ventanas Swing
│   │   │           │   ├── AplicacionGui.java
│   │   │           │   ├── Estilos.java
│   │   │           │   ├── ModeloConEstado.java
│   │   │           │   ├── ModeloTablaCola.java
│   │   │           │   ├── ModeloTablaPedidos.java
│   │   │           │   ├── PanelConcurrencia.java
│   │   │           │   ├── PanelFormulario.java
│   │   │           │   ├── RenderizadorEstado.java
│   │   │           │   ├── VentanaLogin.java
│   │   │           │   └── VistaDashboard.java
│   │   │           ├── Main.java
│   │   │           └── MainGui.java
│   │   └── test/                                         # 8 pruebas con JUnit 5
│   │       └── java/
│   │           └── tienda/
│   │               ├── concurrencia/
│   │               │   └── DespachadorTest.java
│   │               ├── controlador/
│   │               │   └── FormularioTest.java
│   │               ├── seguridad/
│   │               │   └── LoginTest.java
│   │               └── PedidosTest.java
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml                                           # dependencias y compilación
│   └── resultados_metricas.json                          # salida de la consola de Java
├── javascript/                                           # implementación en JavaScript (Node.js, Express)
│   ├── public/                                           # interfaz web (lo que corre en el navegador)
│   │   ├── css/
│   │   │   ├── base.css
│   │   │   └── dashboard.css
│   │   ├── js/
│   │   │   ├── comun.js
│   │   │   ├── concurrencia.js
│   │   │   ├── dashboard.js
│   │   │   ├── formulario.js
│   │   │   ├── login.js
│   │   │   └── pedidos.js
│   │   ├── dashboard.html
│   │   └── index.html
│   ├── src/                                              # backend: modelo, controladores y API
│   │   ├── api/                                          # rutas de Express (traducen HTTP)
│   │   │   ├── errores.js
│   │   │   ├── rutasAcceso.js
│   │   │   ├── rutasDashboard.js
│   │   │   ├── rutasDespachador.js
│   │   │   ├── rutasFormulario.js
│   │   │   ├── rutasPedidos.js
│   │   │   └── sesiones.js
│   │   ├── controladores/                                # controladores (MVC)
│   │   │   ├── controladorConcurrencia.js
│   │   │   ├── controladorDashboard.js
│   │   │   ├── controladorFormulario.js
│   │   │   ├── controladorLogin.js
│   │   │   ├── errores.js
│   │   │   └── etiquetas.js
│   │   ├── almacen.js
│   │   ├── autenticacion.js
│   │   ├── catalogo.js
│   │   ├── concurrencia.js
│   │   ├── despachador.js
│   │   ├── formato.js
│   │   ├── funcional.js
│   │   ├── lectorJson.js
│   │   ├── metricasProyecto.js
│   │   ├── modelos.js
│   │   ├── negocio.js
│   │   └── servidor.js
│   ├── tests/                                            # 8 pruebas con Jest
│   │   ├── despachador.test.js
│   │   ├── formulario.test.js
│   │   ├── login.test.js
│   │   └── pedidos.test.js
│   ├── index.js                                          # versión de consola
│   ├── package-lock.json
│   ├── package.json
│   ├── resultados_metricas.json                          # salida de la consola de JavaScript
│   └── server.js                                         # arranque de la interfaz web
├── python/                                               # implementación en Python (Tkinter)
│   ├── gui/                                              # interfaz gráfica (vistas y controladores)
│   │   ├── __init__.py
│   │   ├── app.py
│   │   ├── controlador_concurrencia.py
│   │   ├── controlador_dashboard.py
│   │   ├── controlador_formulario.py
│   │   ├── controlador_login.py
│   │   ├── estilos.py
│   │   ├── etiquetas.py
│   │   ├── vista_concurrencia.py
│   │   ├── vista_dashboard.py
│   │   ├── vista_formulario.py
│   │   └── vista_login.py
│   ├── almacen.py
│   ├── autenticacion.py
│   ├── catalogo.py
│   ├── concurrencia.py
│   ├── despachador.py
│   ├── funcional.py
│   ├── lector_json.py
│   ├── main.py                                           # versión de consola
│   ├── main_gui.py                                       # arranque de la interfaz gráfica
│   ├── modelos.py
│   ├── negocio.py
│   ├── requirements.txt                                  # dependencias (pytest)
│   ├── resultados_metricas.json                          # salida de la consola de Python
│   ├── test_despachador.py
│   ├── test_formulario.py
│   ├── test_login.py
│   └── test_pedidos.py
├── .gitignore                                            # qué no se sube a Git
├── README.md                                             # este archivo
└── abrir_dashboard.bat                                   # doble clic: abre el dashboard comparativo sin servidor
```

`evidencias/` (capturas o videos) todavía no existe porque no hay ninguno en el proyecto. Las carpetas `node_modules/`,
`java/target/` y `__pycache__/` no se suben a Git: se regeneran solas (ver [Requisitos](#requisitos)).

## Qué hace

1. Registra pedidos a partir de `datos/solicitudes_pequenas.json`.
2. Valida cada pedido: rechaza los que no tienen productos o tienen cantidades `<= 0`.
3. Calcula subtotal, descuento, IVA, envío y total.
4. Consulta pedidos por cliente, los filtra por estado y los ordena por fecha o prioridad.
5. Cambia el estado de los pedidos de forma concurrente y lo compara con la versión secuencial.
6. Exporta los tiempos y totales a `resultados_metricas.json` (uno por lenguaje).
7. Compara los tres lenguajes en un dashboard web: resultado, líneas de código, gráficas de rendimiento, diagramas y análisis.

## Reglas de negocio

| Concepto  | Regla |
|-----------|-------|
| Descuento | 10% si el subtotal es >= $2,000. Si no, 5% si el cliente es frecuente. No se acumulan. |
| IVA       | 16% sobre (subtotal - descuento). |
| Envío     | Estándar $50, express $120. No causa IVA. |
| Total     | subtotal - descuento + IVA + envío. |
| Redondeo  | A centavos, mitad hacia arriba: `Decimal` en Python, `BigDecimal` en Java y centavos enteros en JavaScript. |

Resultado esperado con el archivo de prueba:

| Pedido  | Caso | Subtotal | Descuento | IVA | Envío | Total |
|---------|------|---------:|----------:|----:|------:|------:|
| PED-001 | Regular, subtotal >= $2,000 (10%) | 2,148.90 | 214.89 | 309.44 | 50.00 | 2,293.45 |
| PED-002 | Frecuente, subtotal < $2,000 (5%) | 885.30 | 44.27 | 134.56 | 120.00 | 1,095.59 |
| PED-003 | Frecuente, subtotal >= $2,000 (solo 10%) | 3,749.50 | 374.95 | 539.93 | 120.00 | 4,034.48 |
| PED-004 | Regular, subtotal < $2,000 (sin descuento) | 764.60 | 0.00 | 122.34 | 50.00 | 936.94 |
| PED-005 | Cantidad 0: se rechaza | - | - | - | - | - |

Total vendido: **$8,360.46**.

## Paradigmas

| Paradigma | Python | Java | JavaScript |
|-----------|--------|------|------------|
| Orientado a objetos | `modelos.py`, `negocio.py` | `tienda.modelo`, `tienda.negocio` | `src/modelos.js`, `src/negocio.js` |
| Funcional | `funcional.py` (`filter`, `map`, `reduce`, lambdas) | `tienda.funcional` (streams) | `src/funcional.js` (`filter`, `map`, `reduce`) |
| Concurrente / asíncrono | `concurrencia.py` (`asyncio.gather`) | `tienda.concurrencia` (`ExecutorService` + `CompletableFuture`) | `src/concurrencia.js` (`Promise.all`) |

## Requisitos

- Python 3.10 o superior
- JDK 17 o superior (Maven no hace falta: el proyecto incluye Maven Wrapper)
- Node.js 18 o superior (también lo usan el dashboard y `abrir_dashboard.bat`)

Después de clonar el repositorio hay que instalar las dependencias de cada lenguaje una vez:
`pip install -r requirements.txt` (en `python/`) y `npm install` (en `javascript/`). Java descarga Maven, Gson y
JUnit 5 la primera vez que se ejecuta.

## Cómo ejecutar

Resumen (cada comando se ejecuta desde la carpeta del lenguaje; los detalles están debajo):

| Lenguaje | Consola (genera `resultados_metricas.json`) | Interfaz gráfica | Pruebas |
|----------|---------------------------------------------|------------------|---------|
| Python | `python main.py` | `python main_gui.py` (Tkinter) | `python -m pytest -v` |
| Java | `.\mvnw.cmd -q compile exec:java` | `.\mvnw.cmd -q compile exec:java "-Dexec.mainClass=tienda.MainGui"` (Swing) | `.\mvnw.cmd test` |
| JavaScript | `npm run consola` | `npm start` y abrir <http://localhost:3000> (web con Express) | `npm test` |
| Dashboard comparativo | - | doble clic en `abrir_dashboard.bat` (en la raíz) o <http://localhost:3000/dashboard> con `npm start` | - |

### Python

```bash
cd python
pip install -r requirements.txt
python main.py          # consola
python main_gui.py      # interfaz gráfica (Tkinter)
python -m pytest -v     # 8 pruebas
```

### Java

En Windows:

```bash
cd java
.\mvnw.cmd -q compile exec:java                                          # consola
.\mvnw.cmd -q compile exec:java "-Dexec.mainClass=tienda.MainGui"        # interfaz gráfica (Swing)
.\mvnw.cmd test                                                          # 8 pruebas
```

En macOS o Linux se usa `sh mvnw` en lugar de `.\mvnw.cmd` (por ejemplo,
`sh mvnw -q compile exec:java -Dexec.mainClass=tienda.MainGui`). La primera vez descarga Maven y las dependencias
(Gson y JUnit 5).

### JavaScript

```bash
cd javascript
npm install
npm run consola         # consola (genera resultados_metricas.json)
npm start               # interfaz web: abre http://localhost:3000
npm test                # 8 pruebas
```

### Dashboard comparativo

Una página que compara las tres implementaciones: el resultado que produce cada una ($8,360.46 en las tres), una
tabla de características con las **líneas de código reales**, gráficas de rendimiento con Chart.js (secuencial frente a
concurrente y qué pasa al crecer el volumen de pedidos), diagramas de arquitectura MVC, de inicio de sesión y de
concurrencia con Mermaid.js, y tarjetas con las ventajas y limitaciones de cada lenguaje. Se puede ver de dos maneras:

**A) Sin servidor (la más rápida).** En Windows, doble clic en `abrir_dashboard.bat` (en la raíz del proyecto): actualiza
las métricas (resultados y líneas de código) y abre `dashboard/index.html` directamente en el navegador, sin `npm start`
ni `localhost`. En macOS o Linux: `node dashboard/exportar_estatico.js --solo-datos` y abrir `dashboard/index.html`.
Abrir `dashboard/index.html` a mano también funciona, pero muestra la última copia guardada de las métricas.

**B) Con el servidor de Node.js (datos en vivo).**

1. Genera los resultados de cada lenguaje (cada programa escribe su `resultados_metricas.json`):

   ```bash
   cd python && python main.py
   cd ../java && .\mvnw.cmd -q compile exec:java
   cd ../javascript && npm run consola
   ```

2. Arranca el servidor de Node.js (desde `javascript/`, y `npm install` solo la primera vez):

   ```bash
   cd javascript
   npm install
   npm start
   ```

3. Abre <http://localhost:3000/dashboard> en el navegador. No pide iniciar sesión.

Notas del dashboard:

- El servidor Express lo sirve para que el navegador pueda leer los `resultados_metricas.json` y el código sin errores de
  CORS: los lee y los entrega en `/dashboard/api/metricas`. Chart.js y Mermaid.js se descargan de internet (CDN), así que
  hace falta conexión; sin ella la página sigue mostrando la tabla y las tarjetas y avisa que faltan las gráficas y los
  diagramas.
- `/dashboard` es el dashboard **comparativo** (público). `/dashboard.html` es el de **pedidos** de la interfaz
  gráfica (pide iniciar sesión). No son la misma página.
- Si falta el `resultados_metricas.json` de algún lenguaje, la página lo dice y explica qué ejecutar.
- La gráfica por volumen usa `dashboard/datos/volumenes.json`, medido en esta computadora con 5, 100, 200, 300 y 400
  pedidos. Para repetir la medición (unos 4 minutos, porque las corridas son reales), desde la raíz del proyecto:
  `node dashboard/medir_volumenes.js`.
- La «dificultad percibida» de la tabla es una valoración del equipo, no una medición; se cambia en
  `dashboard/js/tabla.js`.
- **Publicarlo sin servidor** (por ejemplo, para que un profesor lo vea desde cualquier lugar): desde la raíz del
  proyecto, `node dashboard/exportar_estatico.js` guarda una copia fija de los datos y arma la carpeta
  `tablero-estatico/` (un sitio web completo con su `LEEME.txt`). Se abre con doble clic en `index.html` y se sube
  gratis a Netlify Drop, GitHub Pages o Cloudflare Pages. Cuando existe `api/metricas` la página usa los datos en vivo;
  si no, usa la copia de `dashboard/datos/datos-fijos.js`. Hay que volver a exportar y a subir la carpeta cada vez que
  cambien los resultados o el código.

## Interfaz gráfica y control de acceso (fase 2)

La GUI se agrega sobre la lógica de la fase 1 con el patrón MVC; la versión de consola sigue funcionando.
Detalle del reparto y de los commits en [documentos/PLAN_GITHUB_GUI.md](documentos/PLAN_GITHUB_GUI.md).

Usuarios de prueba (`datos/usuarios.json`):

| Usuario | Contraseña |
|---------|------------|
| `admin` | `1234` |
| `operador` | `ventas` |

El login es sencillo a propósito, para estudiar: `usuarios.json` guarda cada `usuario`, `password` y `nombre`
en texto plano y los tres lenguajes comparan el texto tal cual. En un sistema real nunca se guarda una
contraseña así (se guarda un hash). Para agregar otro usuario basta con escribir otra línea en el archivo.

| Lenguaje | Tecnología | Cómo ejecutarla | Estado |
|----------|------------|-----------------|--------|
| Python | Tkinter | `cd python` y `python main_gui.py` | Listo |
| Java | Swing | `cd java` y `.\mvnw.cmd -q compile exec:java "-Dexec.mainClass=tienda.MainGui"` | Listo |
| JavaScript | Express + web local | `cd javascript`, `npm install` y `npm start`; abrir <http://localhost:3000> | Listo |

**Python.** El login da acceso al dashboard: formulario de pedidos (selectores, carrito y vista previa de
importes), tabla con estado y prioridad (doble clic muestra el desglose) y el panel del despachador. «Procesar
cola» atiende los pedidos pendientes por prioridad con N trabajadores simultáneos y la tabla cambia en vivo.
Los errores (credenciales, cantidades inválidas, carrito vacío, archivos dañados) se muestran con `messagebox`.
`python -m pytest` corre 8 pruebas: las 5 de la fase 1 (cálculos, descuentos, validaciones y consultas) más una de
login (`test_login.py`), una de formulario (`test_formulario.py`) y una de concurrencia (`test_despachador.py`).

**Java.** Mismo diseño y mismas pantallas que la versión de Python, con `javax.swing`. El despachador usa un
`ExecutorService` con N hilos trabajadores y avisa cada transición a sus observadores desde esos hilos; el panel
de concurrencia los pasa al hilo de eventos con `SwingUtilities.invokeLater` antes de tocar la tabla. Todos los
errores de usuario (login, campos vacíos, cantidad inválida, carrito vacío) salen en `JOptionPane`, sin
trazas en la consola. `.\mvnw.cmd test` corre 8 pruebas: las 5 de `PedidosTest` (fase 1) más
`LoginTest`, `FormularioTest` y `DespachadorTest`, una cada una.

**JavaScript.** Como Node no tiene ventanas de escritorio, la GUI es una página web local servida por Express
(arquitectura cliente-servidor). `npm start` levanta el servidor en `127.0.0.1:3000` (solo acepta tráfico de esta
computadora; `$env:PORT = 3001; npm start` cambia el puerto en PowerShell) y se usa desde el navegador:

- **Backend** (`javascript/src/`): los controladores (`controladores/`) reutilizan los módulos de la fase 1 y
  las rutas de Express (`api/`) solo traducen HTTP: `/api/login`, `/api/pedidos`, `/api/catalogo`,
  `/api/despachador/*`. `/dashboard.html` y toda la API exigen sesión (cookie `HttpOnly` y `SameSite=Strict`).
- **Frontend** (`javascript/public/`): HTML, CSS y JavaScript sin librerías. Los datos de los clientes se
  muestran siempre como texto, nunca como HTML.
- **Tiempo real:** el navegador le pregunta al servidor cada 500 ms con `fetch()` y `setInterval()`
  (`GET /api/pedidos` para la tabla y `GET /api/despachador` para el panel) y dibuja lo que responde, así que la
  tabla se actualiza sola sin recargar la página. El despachador del servidor solo va anotando su estado.
- **Alertas:** los errores de captura (campos vacíos, login erróneo, carrito vacío, cantidad inválida) salen como
  alertas tipo toast en el navegador; el servidor responde `400`, `401`, `422` en JSON y no se cae ni escribe trazas.
- **Cambio en la fase 1:** `npm start` ahora abre la web; la consola de antes es `npm run consola`.

`npm test` corre 8 pruebas: las 5 de `pedidos.test.js` (fase 1) más `login.test.js`, `formulario.test.js` y
`despachador.test.js`, una cada una.

## Documentos

| Archivo | Qué es |
|---------|--------|
| [documentos/analisis-comparativo.pdf](documentos/analisis-comparativo.pdf) | Análisis comparativo escrito de los tres lenguajes (entregable) |
| [documentos/ANALISIS_COMPARATIVO.html](documentos/ANALISIS_COMPARATIVO.html) | Fuente del análisis; el PDF se genera abriéndolo con Edge o Chrome: `msedge --headless --no-pdf-header-footer --print-to-pdf=analisis-comparativo.pdf documentos/ANALISIS_COMPARATIVO.html` |
| [documentos/PLAN_GITHUB_GUI.md](documentos/PLAN_GITHUB_GUI.md) | Plan de trabajo en GitHub: ramas, commits, reparto y sprint final del dashboard |

## Responsabilidades individuales

Los cuatro integrantes participaron activamente en **Python, Java, JavaScript y el Dashboard Comparativo**. Cada uno
se hizo responsable de las mismas áreas en los tres lenguajes (así las tres versiones tienen la misma estructura) y de
una parte del dashboard. La fuente de esta tabla son los encabezados «Responsable» de cada archivo; los commits y las
ramas de cada quien están en [documentos/PLAN_GITHUB_GUI.md](documentos/PLAN_GITHUB_GUI.md).

| Integrante | Python | Java | JavaScript | Dashboard comparativo |
|------------|:------:|:----:|:----------:|:---------------------:|
| Ian Hernández Ibarra | ✔ | ✔ | ✔ | ✔ |
| Leonardo Damián Hernández Hernández | ✔ | ✔ | ✔ | ✔ |
| Edsson Einar Montijo Reyes | ✔ | ✔ | ✔ | ✔ |
| Yurem Jesús Aco Luna | ✔ | ✔ | ✔ | ✔ |

Qué hizo cada quien en cada parte:

| Integrante | Área | Python | Java | JavaScript | Dashboard comparativo |
|------------|------|--------|------|------------|-----------------------|
| **Ian** | Modelos y datos, login | `modelos.py`, `lector_json.py`, `autenticacion.py`, login (`controlador_login.py`, `vista_login.py`), `app.py`, `test_login.py` | paquete `modelo`, `LectorJson`, paquete `seguridad`, `ControladorLogin`, `VentanaLogin`, `AplicacionGui`, `LoginTest` | `modelos.js`, `lectorJson.js`, `autenticacion.js`, login web (`rutasAcceso.js`, `sesiones.js`, `login.js`), `servidor.js`, `login.test.js` | Estructura de `index.html`, estilos (`estilos.css`), tabla comparativa interactiva (`tabla.js`, `utiles.js`) |
| **Leonardo** | Negocio y validaciones, dashboard de pedidos | `negocio.py`, `almacen.py`, dashboard de pedidos (`controlador_dashboard.py`, `vista_dashboard.py`), `estilos.py` | `CalculadoraPedido`, `ValidadorPedido`, `Desglose`, `AlmacenPedidos`, `ControladorDashboard`, `VistaDashboard` | `negocio.js`, `almacen.js`, `controladorDashboard.js`, `rutasPedidos.js`, página de pedidos (`public/js/dashboard.js`, `pedidos.js` y `dashboard.css`) | Gráficas de tiempos y de volumen con Chart.js (`graficas.js`) y el script que mide los volúmenes (`medir_volumenes.js`) |
| **Yurem** | Funcional, pruebas y concurrencia en la interfaz | `funcional.py`, `despachador.py`, `controlador_concurrencia.py`, `vista_concurrencia.py`, `test_pedidos.py`, `test_despachador.py` | `ConsultasPedidos`, `Despachador` y sus eventos, `ControladorConcurrencia`, `PanelConcurrencia`, `PedidosTest`, `DespachadorTest` | `funcional.js`, `despachador.js`, `controladorConcurrencia.js`, `rutasDespachador.js`, `public/js/concurrencia.js`, `pedidos.test.js`, `despachador.test.js` | Diagramas de arquitectura MVC, login y concurrencia con Mermaid.js (`definiciones.js`, `diagramas.js`) |
| **Edsson** | Concurrencia base, `main` y formularios | `concurrencia.py` (`asyncio`), `main.py` (consola y métricas), `catalogo.py`, formulario (`controlador_formulario.py`, `vista_formulario.py`), `test_formulario.py` | `ProcesadorEstados` (`ExecutorService`), `Main`, `Catalogo`, `ControladorFormulario`, `PanelFormulario`, `FormularioTest` | `concurrencia.js` (promesas), `index.js` (consola), `catalogo.js`, `controladorFormulario.js`, `rutasFormulario.js`, `public/js/formulario.js`, `formulario.test.js` | Carga de las métricas (`datos.js`, `exportar_estatico.js`, `metricasProyecto.js` en el servidor) y tarjetas de análisis (`tarjetas.js`) |
