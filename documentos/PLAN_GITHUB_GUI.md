# Plan de trabajo en GitHub — Fase 2 (interfaz gráfica) y sprint final (dashboard comparativo)

Equipo: Ian, Leonardo, Yurem y Edsson. En la fase 2 cada integrante aporta en los **tres lenguajes**
(Python, Java y Node.js) y cada lenguaje es un sprint. La lógica de negocio de la fase 1
**no se reescribe**: la GUI se agrega encima con el patrón MVC. Después viene el **sprint final** (sección 8):
una página web que compara los tres lenguajes, repartida también entre los cuatro.

El código está pensado para nivel de 3er semestre: se prefieren `if/else`, ciclos `for` y `try/catch` a las
abstracciones avanzadas. Las decisiones de simplicidad están en la sección 10.

## 0. Antes de empezar (una sola vez)

**Situación de esta carpeta.** `ProyectoFinalLenguajes/` ya contiene el resultado final de las dos fases y no
tiene repositorio propio: hoy cuelga de un repositorio vacío en `C:\Users\ian64` (sin commits ni remoto).
**No se hace `git add .` aquí**: subiría todo de golpe y no quedaría historial por integrante. En cambio, se
reconstruye el historial pasando a un clon **solo los archivos de cada commit**, en el orden de este plan.

**Paso 1: el commit base (fase 1).** Todo sprint parte de `main` con la fase 1:

- Si el repositorio de la fase 1 ya está en GitHub: `git clone <url> ProyectoEquipo` y se trabaja en ese clon.
- Si no existe: carpeta nueva, `git init -b main`, `git remote add origin <url>`, se copian **solo** estos archivos
  de esta carpeta y se hace el commit `chore: proyecto base de la fase 1 (consola)` (+ `git push -u origin main`):
  `.gitignore`, `datos/solicitudes_pequenas.json`, `python/` (`main.py`, `modelos.py`, `negocio.py`,
  `lector_json.py`, `funcional.py`, `concurrencia.py`, `test_pedidos.py`, `requirements.txt`), `java/` (`pom.xml`,
  `mvnw`, `mvnw.cmd`, `.mvn/` y las clases de la fase 1 de `src/`, incluidas `PedidosTest`) y `javascript/`
  (`index.js`, `src/{modelos,negocio,lectorJson,funcional,concurrencia}.js`, `tests/pedidos.test.js`).

**El `dashboard/` de la fase 1 ya no está en esta carpeta.** Era una página sencilla (`index.html` y `dashboard.js`) y la
reemplaza por completo el dashboard nuevo del sprint final (sección 8): no se sube en el commit base. Si el repositorio
de la fase 1 que ya está en GitHub todavía trae `dashboard/dashboard.js`, el primer commit del PR 1 del sprint final lo
borra con `git rm`.

**Archivos de la fase 1 que la fase 2 modifica.** Solo cuatro grupos, y todos con cambios aditivos:

| Archivo | Qué cambia | Dónde entra |
|---------|------------|-------------|
| `python/concurrencia.py`, `java/.../concurrencia/ProcesadorEstados.java`, `javascript/src/concurrencia.js` | un listener/callback **opcional** por transición (JS: también una señal de cancelación) | primer commit del PR 4 de cada lenguaje |
| `javascript/package.json` y `package-lock.json` | `express` y los scripts `start` (web) / `consola` (la de la fase 1) | PR 1 de Node |
| `README.md` | secciones de la GUI de los tres lenguajes | un solo commit en el PR 6 de Node |

Si de esos tres archivos de concurrencia solo se tiene la versión final (con el listener), se suben así en el
commit base y se **omite** el primer commit del PR 4 de cada lenguaje.

**Paso 2: identidad.** Cada integrante configura `git config user.name` / `user.email` para que sus commits
salgan con su nombre.

**Paso 3: receta para subir un PR** (Git Bash; un `git commit` por fila de las tablas de los sprints):

```bash
ORIGEN=/ruta/a/ProyectoFinalLenguajes          # esta carpeta, con el resultado final
copiar() { for f in "$@"; do mkdir -p "$(dirname "$f")"; cp "$ORIGEN/$f" "$f"; git add "$f"; done; }

git checkout main && git pull
git checkout -b feat/py-login
copiar datos/usuarios.json
git commit -m "feat(datos): usuarios.json de prueba (usuario y password en texto plano)"
copiar python/autenticacion.py
git commit -m "feat(py/auth): servicio de autenticación con comparación directa de usuario y password"
# ...una pareja «copiar + commit» por cada fila de la tabla del PR...
git push -u origin feat/py-login               # y se abre el Pull Request
```

**Rutas abreviadas en las tablas.** Python: `gui/x.py` es `python/gui/x.py`. Java: `seguridad/X` es
`java/src/main/java/tienda/seguridad/X.java` y las pruebas están bajo `java/src/test/java/tienda/`. Node: `src/…`,
`public/…` y `tests/…` cuelgan de `javascript/`.

**Verificado con un ensayo en seco.** Se reconstruyó cada lenguaje desde la fase 1 aplicando los 6 PR exactamente
en este orden y con estos archivos, y se corrieron las pruebas tras cada PR (todas en verde):

| Lenguaje | Pruebas tras PR 1 → 2 → 3 → 4 → 5 → 6 |
|----------|----------------------------------------|
| Python | 6 → 6 → 7 → 8 → 8 → **8** |
| Java | 6 → 6 → 7 → 8 → 8 → **8** |
| Node.js | 6 → 6 → 7 → 8 → 8 → **8** |

Cada lenguaje arranca con las 5 pruebas de la fase 1 y suma una por PR de Ian (login), Edsson (formulario) y
Yurem (concurrencia). Los PR 2, 5 y 6 no suman: aportan el almacén, la pantalla y el ensamblado.

## 1. Arquitectura MVC (igual en los tres lenguajes)

| Capa | Qué hace | Python | Java | Node.js |
|------|----------|--------|------|---------|
| **Modelo** (fase 1, intacto) | Dominio, reglas, JSON, consultas, concurrencia | `modelos`, `negocio`, `lector_json`, `funcional`, `concurrencia` | `tienda.modelo`, `.negocio`, `.datos`, `.funcional`, `.concurrencia` | `src/modelos`, `negocio`, `lectorJson`, `funcional`, `concurrencia` |
| **Modelo** (fase 2, nuevo) | Usuarios, catálogo, estado de la sesión, despachador | `autenticacion`, `catalogo`, `almacen`, `despachador` | `tienda.seguridad`, `.datos.Catalogo`, `.datos.AlmacenPedidos`, `.concurrencia.Despachador` | `src/autenticacion`, `catalogo`, `almacen`, `despachador` |
| **Vista** | Dibuja y muestra errores | `gui/vista_*.py` (Tkinter) | `tienda.vista.*` (Swing) | `public/*.html, css, js` (navegador) |
| **Controlador** | Traduce lo capturado a llamadas al modelo | `gui/controlador_*.py` | `tienda.controlador.*` | `src/controladores/*.js` (lógica) + `src/api/*.js` (rutas Express: solo traducen HTTP) |

Reglas del diseño:

- Los controladores **no importan** la librería gráfica, así que se prueban sin abrir ventanas.
- Los errores de negocio (`PedidoInvalidoError`, etc.) los captura la **vista** y los muestra con
  `messagebox` (Tkinter), `JOptionPane` (Swing) o un toast (web). Nunca llegan a la consola.
- Único cambio a la lógica de la fase 1: un parámetro **opcional** en `avanzarPedido` /
  `ProcesadorEstados.avanzarPedido` / `avanzarPedido` (JS) para avisar cada transición de estado
  (*callback / listener*). Sin él se comporta exactamente igual; las pruebas de la fase 1 siguen pasando.

## 2. Reparto por integrante

| Integrante | Responsabilidad en la fase 2 | Entrega en cada lenguaje |
|------------|------------------------------|---------------------------|
| **Ian** | Login y control de acceso + integración final | Servicio de autenticación (usuario y password en texto plano en `datos/usuarios.json`), ventana/pantalla de login, navegación login → dashboard, manejo de errores no previstos, una prueba de login (y el README, una vez, al cierre) |
| **Leonardo** | Dashboard principal | Almacén de pedidos, consultas y filtros (reusan lo funcional), tabla de pedidos con estado y prioridad, indicadores, layout general |
| **Edsson** | Formularios de captura | Catálogo (`datos/catalogo.json`), formulario con selectores, carrito, vista previa de importes, validaciones con alertas visuales, una prueba del formulario |
| **Yurem** | Concurrencia en la interfaz | Hook de transición, despachador en segundo plano (cola por prioridad, N trabajadores), panel que se actualiza en vivo, una prueba de concurrencia |

## 3. Flujo de ramas, commits y revisión

- **`main`** siempre estable (compila y sus pruebas pasan). No se hace push directo: todo entra por Pull Request.
- **Ramas:** `feat/<lenguaje>-<modulo>`, por ejemplo `feat/py-login`, `feat/java-dashboard`, `feat/js-concurrencia`.
- **Commits:** *Conventional Commits* en español, con el lenguaje como ámbito: `feat(py/auth): …`,
  `feat(java/login): …`, `test(js/login): …`, `docs: …`. Un commit = un cambio con sentido, que compila.
- **Merge:** *merge commit* (sin *squash*) para que el historial conserve los commits de cada integrante.
- **Revisión cruzada** (mínimo 1 aprobación, nunca el propio autor): Ian → revisa a Leonardo, Leonardo → a Edsson,
  Edsson → a Yurem, Yurem → a Ian.
- **Antes de abrir el PR:** pruebas en verde (`python -m pytest`, `.\mvnw.cmd test`, `npm test`), sin
  `node_modules/`, `target/` ni `__pycache__/` (ya están en `.gitignore`), y probar la ventana a mano.
- **Contenido del PR:** qué cambia, cómo probarlo (usuario `admin` / `1234`) y captura de pantalla.

## 4. Orden de integración (dependencias reales)

El dashboard compone el formulario y el panel de concurrencia, y estos dos necesitan el almacén de
pedidos. Por eso Leonardo entra **dos veces** y el orden no es el de la lista de arriba:

```
PR 1  Ian       login + infraestructura de la GUI + prueba de login
PR 2  Leonardo  almacén + controlador del dashboard          (lo necesitan 3 y 4)
PR 3  Edsson    formulario  ┐ en paralelo, ambos parten del PR 2
PR 4  Yurem     concurrencia┘
PR 5  Leonardo  vista del dashboard (compone 3 y 4)
PR 6  Ian       aplicación: login → dashboard, errores no previstos (el README, solo en el de Node)
```

Los mismos 6 PR se repiten en cada lenguaje. Un sprint termina cuando el PR 6 está en `main`.

## 5. Sprint 1 — Python (Tkinter)

Todos los archivos ya existen en `python/`. Se suben así, uno por commit:

### PR 1 · Ian · `feat/py-login`

| Commit | Archivos |
|--------|----------|
| `feat(datos): usuarios.json de prueba (usuario y password en texto plano)` | `datos/usuarios.json` |
| `feat(py/auth): servicio de autenticación con comparación directa de usuario y password` | `python/autenticacion.py` |
| `feat(py/gui): paquete gui, estilos y etiquetas compartidas` | `python/gui/__init__.py`, `gui/estilos.py`, `gui/etiquetas.py` |
| `feat(py/login): controlador y ventana de login con messagebox` | `python/gui/controlador_login.py`, `gui/vista_login.py` |
| `test(py/login): prueba de login (válido, inválido y campos vacíos)` | `python/test_login.py` |

### PR 2 · Leonardo · `feat/py-dashboard-modelo`

| Commit | Archivos |
|--------|----------|
| `feat(py/almacen): almacén de pedidos con validación y ids consecutivos` | `python/almacen.py` |
| `feat(py/dashboard): controlador con filtros, orden, resumen y detalle (reusa funcional.py)` | `python/gui/controlador_dashboard.py` |

### PR 3 · Edsson · `feat/py-formulario`

| Commit | Archivos |
|--------|----------|
| `feat(datos): catalogo.json con los 9 productos` | `datos/catalogo.json` |
| `feat(py/catalogo): lectura del catálogo` | `python/catalogo.py` |
| `feat(py/formulario): controlador del carrito y registro de pedidos` | `python/gui/controlador_formulario.py` |
| `feat(py/formulario): vista con selectores, carrito y alertas try/except` | `python/gui/vista_formulario.py` |
| `test(py/formulario): prueba del carrito, las validaciones y el registro` | `python/test_formulario.py` |

### PR 4 · Yurem · `feat/py-concurrencia`

| Commit | Archivos |
|--------|----------|
| `feat(py/concurrencia): callback opcional por transición de estado (retrocompatible)` | `python/concurrencia.py` |
| `feat(py/despachador): despachador asyncio en hilo aparte, cola por prioridad y N trabajadores` | `python/despachador.py` |
| `feat(py/concurrencia): controlador del panel` | `python/gui/controlador_concurrencia.py` |
| `feat(py/concurrencia): panel en tiempo real (cola, progreso y registro de eventos)` | `python/gui/vista_concurrencia.py` |
| `test(py/despachador): prueba de la cola con varios trabajadores` | `python/test_despachador.py` |

### PR 5 · Leonardo · `feat/py-dashboard-vista`

| Commit | Archivos |
|--------|----------|
| `feat(py/dashboard): vista principal (indicadores, filtros, tabla coloreada por estado, detalle)` | `python/gui/vista_dashboard.py` |

### PR 6 · Ian · `feat/py-app`

| Commit | Archivos |
|--------|----------|
| `feat(py/app): ventana única con navegación login → dashboard y errores no previstos en diálogo` | `python/gui/app.py`, `python/main_gui.py` |

**Criterios de aceptación (Python):** `python -m pytest` en verde (8 pruebas; las 5 de la fase 1 siguen intactas);
`python main.py` sigue funcionando; `python main_gui.py` abre el login; `admin` / `1234` entra; una contraseña
mala, un campo vacío, una cantidad `0` o `abc` y un carrito vacío muestran un diálogo y no una traza en consola;
«Procesar cola» actualiza la tabla en vivo hasta dejar los pedidos en *Entregado*.

## 6. Sprint 2 — Java (Swing)

Mismos 6 PR, mismos responsables y mismo orden que en Python. Todos los archivos ya existen en
`java/src/main/java/tienda/` (pruebas en `java/src/test/java/tienda/`). El único cambio a la fase 1 es
`ProcesadorEstados.avanzarPedido`, que gana una sobrecarga con un `OyenteTransicion` opcional (patrón Observer).
Las ventanas llaman a `JOptionPane` directamente.

### PR 1 · Ian · `feat/java-login`

| Commit | Archivos |
|--------|----------|
| `feat(java/auth): servicio de autenticación con comparación directa de usuario y password` | `seguridad/ServicioAutenticacion`, `Usuario`, `AutenticacionException` |
| `feat(java/gui): infraestructura de la GUI: estilos y etiquetas` | `vista/Estilos`, `controlador/Etiquetas` |
| `feat(java/login): controlador y pantalla de login con JOptionPane` | `controlador/ControladorLogin`, `controlador/CamposIncompletosException`, `vista/VentanaLogin` |
| `test(java/login): prueba de login (válido, inválido y campos vacíos)` | `seguridad/LoginTest` |

### PR 2 · Leonardo · `feat/java-dashboard-modelo`

| Commit | Archivos |
|--------|----------|
| `feat(java/almacen): almacén de pedidos con validación y ids consecutivos` | `datos/AlmacenPedidos` |
| `feat(java/dashboard): controlador con filtros, orden, resumen y detalle (reusa ConsultasPedidos)` | `controlador/ControladorDashboard` |
| `feat(java/gui): coloreado de filas por estado para las JTable` | `vista/ModeloConEstado`, `vista/RenderizadorEstado` |

### PR 3 · Edsson · `feat/java-formulario`

| Commit | Archivos |
|--------|----------|
| `feat(java/catalogo): lectura de catalogo.json` | `datos/Catalogo`, `ItemCatalogo`, `CatalogoException` |
| `feat(java/formulario): controlador del carrito y registro de pedidos` | `controlador/ControladorFormulario`, `ErrorFormularioException` |
| `feat(java/formulario): panel con selectores, carrito en JTable y alertas try/catch con JOptionPane` | `vista/PanelFormulario` |
| `test(java/formulario): prueba del carrito, las validaciones y el registro` | `controlador/FormularioTest` |

### PR 4 · Yurem · `feat/java-concurrencia`

| Commit | Archivos |
|--------|----------|
| `feat(java/concurrencia): listener opcional por transición de estado (retrocompatible)` | `concurrencia/OyenteTransicion`, `concurrencia/ProcesadorEstados` (sobrecarga de `avanzarPedido`) |
| `feat(java/despachador): ExecutorService con N hilos, cola por prioridad, eventos y cancelación` | `concurrencia/Despachador`, `EventoDespacho`, `TipoEvento`, `ResumenCorrida`, `DespachadorException` |
| `feat(java/concurrencia): controlador del panel` | `controlador/ControladorConcurrencia`, `ErrorConcurrenciaException` |
| `feat(java/concurrencia): panel en tiempo real con SwingUtilities.invokeLater (cola, progreso y registro)` | `vista/ModeloTablaCola`, `vista/PanelConcurrencia` |
| `test(java/despachador): prueba de la cola con varios hilos` | `concurrencia/DespachadorTest` |

### PR 5 · Leonardo · `feat/java-dashboard-vista`

| Commit | Archivos |
|--------|----------|
| `feat(java/dashboard): vista principal (indicadores, filtros, JTable coloreada por estado, detalle)` | `vista/ModeloTablaPedidos`, `vista/VistaDashboard` |

### PR 6 · Ian · `feat/java-app`

| Commit | Archivos |
|--------|----------|
| `feat(java/app): ventana única con navegación login → dashboard y manejador global de errores no previstos` | `vista/AplicacionGui`, `MainGui` |

**Criterios de aceptación (Java):** `.\mvnw.cmd test` en verde (8 pruebas; las 5 de la fase 1 siguen intactas);
`.\mvnw.cmd -q compile exec:java` sigue corriendo la versión de consola; con
`"-Dexec.mainClass=tienda.MainGui"` abre el login; `admin` / `1234` entra; login erróneo, campos vacíos,
cantidad `0` o `abc` y carrito vacío muestran un `JOptionPane` y ninguna traza en la consola; «Procesar cola»
cambia la tabla en vivo, y los cambios de la interfaz ocurren siempre en el hilo de eventos (`invokeLater`).

## 7. Sprint 3 — Node.js (Express + web local)

Mismos 6 PR, mismos responsables y mismo orden. Todas las rutas cuelgan de `javascript/`. Arquitectura:
`src/` es el servidor (modelo y controladores reutilizan los módulos de la fase 1; `src/api/` solo traduce
HTTP) y `public/` es el navegador (HTML, CSS y JavaScript sin librerías). Cambios a la fase 1: el *hook* de
`src/concurrencia.js` (un observador y una señal de cancelación, ambos opcionales) y `package.json`: `express` y
los scripts `start` (web) y `consola` (la de la fase 1).

**Tiempo real con consultas periódicas (polling).** No hay conexiones abiertas ni eventos empujados: el navegador
llama con `fetch()` y `setInterval()` cada 500 ms a `GET /api/pedidos` (la tabla) y a `GET /api/despachador` (el
panel), y dibuja lo que responde el servidor. El despachador solo va anotando su estado.

### PR 1 · Ian · `feat/js-login`

| Commit | Archivos |
|--------|----------|
| `chore(js): dependencia de la web (express) y scripts npm start / npm run consola` | `package.json`, `package-lock.json` |
| `feat(js/auth): servicio de autenticación con comparación directa de usuario y password` | `src/autenticacion.js` |
| `feat(js/api): infraestructura web: formato de dinero, etiquetas, errores de controladores, sesiones con cookie HttpOnly y traducción de errores a HTTP` | `src/formato.js`, `src/controladores/errores.js`, `src/controladores/etiquetas.js`, `src/api/sesiones.js`, `src/api/errores.js` |
| `feat(js/login): controlador y rutas POST /api/login, POST /api/logout y GET /api/sesion` | `src/controladores/controladorLogin.js`, `src/api/rutasAcceso.js` |
| `feat(js/login): pantalla de login con alertas tipo toast y estilos base` | `public/index.html`, `public/css/base.css`, `public/js/comun.js`, `public/js/login.js` |
| `test(js/login): prueba de login (válido, inválido y campos vacíos)` | `tests/login.test.js` |

### PR 2 · Leonardo · `feat/js-dashboard-modelo`

| Commit | Archivos |
|--------|----------|
| `feat(js/almacen): almacén de pedidos con validación y ids consecutivos` | `src/almacen.js` |
| `feat(js/dashboard): controlador con filtros, orden, resumen y detalle (reusa funcional.js)` | `src/controladores/controladorDashboard.js` |
| `feat(js/api): GET /api/opciones, GET /api/pedidos, GET /api/pedidos/:id/detalle y POST /api/datos/restablecer` | `src/api/rutasPedidos.js` |

### PR 3 · Edsson · `feat/js-formulario`

| Commit | Archivos |
|--------|----------|
| `feat(js/catalogo): lectura de catalogo.json` | `src/catalogo.js` |
| `feat(js/formulario): controlador de la vista previa y el registro de pedidos` | `src/controladores/controladorFormulario.js` |
| `feat(js/api): GET /api/catalogo, POST /api/pedidos/vista-previa y POST /api/pedidos` | `src/api/rutasFormulario.js` |
| `feat(js/formulario): carrito, validaciones en el navegador y alertas tipo toast` | `public/js/formulario.js` |
| `test(js/formulario): prueba del carrito, las validaciones y el registro` | `tests/formulario.test.js` |

### PR 4 · Yurem · `feat/js-concurrencia`

| Commit | Archivos |
|--------|----------|
| `feat(js/concurrencia): observador y señal de cancelación opcionales en avanzarPedido (retrocompatible)` | `src/concurrencia.js` |
| `feat(js/despachador): cola por prioridad, N trabajadores asíncronos, registro de eventos y cancelación` | `src/despachador.js` |
| `feat(js/concurrencia): controlador del panel` | `src/controladores/controladorConcurrencia.js` |
| `feat(js/api): rutas del despachador (GET /api/despachador, iniciar y detener)` | `src/api/rutasDespachador.js` |
| `feat(js/concurrencia): panel que se dibuja con lo que responde el servidor (cola, progreso y registro)` | `public/js/concurrencia.js` |
| `test(js/despachador): prueba de la cola con varios trabajadores` | `tests/despachador.test.js` |

### PR 5 · Leonardo · `feat/js-dashboard-vista`

| Commit | Archivos |
|--------|----------|
| `feat(js/dashboard): página principal y estilos (indicadores, tablas coloreadas por estado, diálogo de detalle)` | `public/dashboard.html`, `public/css/dashboard.css` |
| `feat(js/dashboard): tabla de pedidos, filtros e indicadores, y la pantalla que conecta todo y consulta al servidor cada 500 ms` | `public/js/pedidos.js`, `public/js/dashboard.js` |

### PR 6 · Ian · `feat/js-app`

| Commit | Archivos |
|--------|----------|
| `feat(js/app): servidor Express ensamblado: rutas protegidas por sesión, cabeceras de seguridad y errores en JSON` | `src/servidor.js` |
| `feat(js/app): punto de entrada con puerto configurable, errores de arranque legibles y apagado ordenado (npm start)` | `server.js` |
| `docs: README con la fase 2 (GUI en Python, Java y Node.js), usuarios de prueba y comandos de arranque` | `README.md` (**este es el único PR que lo toca**) |

**Criterios de aceptación (Node):** `npm test` en verde (8 pruebas; las 5 de la fase 1 siguen intactas);
`npm run consola` sigue corriendo la versión de consola; `npm start` imprime `http://localhost:3000`; sin sesión,
`/dashboard.html` redirige al login y la API responde 401; `admin` / `1234` entra; un login vacío o erróneo, un
campo vacío, una cantidad `0` o `abc` y un carrito vacío muestran un toast y el servidor responde 400, 401 o 422
en JSON sin caerse ni escribir trazas; «Procesar cola» cambia la tabla sola, sin recargar la página, porque el
navegador consulta cada 500 ms.

## 8. Sprint final — Dashboard comparativo (Chart.js + Mermaid.js)

**Qué es.** Una página en `dashboard/` que compara Python, Java y JavaScript: el resultado que produce cada uno
($8,360.46), una tabla de características con las **líneas de código reales** (las cuenta el servidor leyendo el
código al abrir la página), gráficas de rendimiento (secuencial frente a concurrente y qué pasa al crecer el volumen
de pedidos), diagramas de arquitectura y de concurrencia, y tarjetas con ventajas y limitaciones. HTML, CSS y
JavaScript puro, sin frameworks; solo Chart.js y Mermaid.js desde el CDN.

**Cómo se sirve.** El servidor Express de Node la publica en <http://localhost:3000/dashboard> (público y de solo
lectura) y le entrega los datos en `GET /dashboard/api/metricas`. Como la página y los datos salen del mismo servidor,
no hay errores de CORS. `/dashboard` (comparativo) no es `/dashboard.html` (pedidos de la GUI, con sesión).

**Prerrequisito.** Los tres sprints de la fase 2 ya están en `main` (existe `javascript/src/servidor.js`).

### Contrato entre archivos

Cada integrante entrega uno o dos archivos que no se importan entre sí: se coordinan por **ids del HTML** y por un
evento del navegador. Así cada PR se puede revisar y probar por separado.

| Pieza | Quién la entrega | Qué espera de los demás |
|-------|------------------|--------------------------|
| `index.html` con un contenedor por sección (`#resumen-cifras`, `#tabla-comparativa`, `#grafica-modos`, `#grafica-etapas`, `#grafica-volumen`, `#diagrama-mvc`, `#diagrama-login`, `#diagrama-concurrencia`, `#tarjetas-lenguajes`, `#preguntas-clase`…) | Ian | nada |
| `js/utiles.js`: `porId`, `crear`, `reemplazar`, `pesos`, `numero`, `colorDe`, `leerColor`, `mostrarEstado` | Ian | nada |
| Evento `metricas-listas` en `document`, con `detail = { lenguajes: [{ lenguaje, metricas, aviso, loc }], volumenes }` | Edsson (`js/datos.js`) | `utiles.js` |
| `tabla.js`, `graficas.js`, `tarjetas.js` escuchan ese evento y dibujan en sus contenedores | Ian, Leonardo, Edsson | `utiles.js` y el evento |
| `definiciones.js` (texto de los diagramas) y `diagramas.js` (los dibuja con Mermaid) | Yurem | `utiles.js` |

### Reparto

| Integrante | Entrega | Archivos |
|------------|---------|----------|
| **Ian** | Estructura HTML base, estilos CSS y tabla interactiva de características | `index.html`, `css/estilos.css`, `js/utiles.js`, `js/tabla.js` |
| **Leonardo** | Gráficas de tiempos de ejecución y de concurrencia con Chart.js | `js/graficas.js`, `medir_volumenes.js`, `datos/volumenes.json` |
| **Yurem** | Diagramas de arquitectura MVC y de flujo concurrente con Mermaid.js | `js/definiciones.js`, `js/diagramas.js`, README |
| **Edsson** | Tarjetas de análisis cualitativo y lógica JS que carga las métricas JSON | `js/datos.js`, `js/tarjetas.js`, y en el servidor: `metricasProyecto.js`, `rutasDashboard.js`, `servidor.js` |

### Orden de integración

```
PR 1  Ian       estructura, estilos y tabla           (lo necesitan todos: utiles.js y los contenedores)
PR 2  Edsson    datos del servidor + carga + tarjetas (lo necesitan las gráficas)
PR 3  Leonardo  gráficas  ┐ en paralelo: ambos parten del PR 2 y no tocan los mismos archivos
PR 4  Yurem     diagramas ┘ (el README va en este: se integra el último)
```

Revisión cruzada, como en la fase 2 (mínimo 1 aprobación, nunca el autor):
Ian → Leonardo, Leonardo → Edsson, Edsson → Yurem, Yurem → Ian.

**Un detalle esperado.** `index.html` ya enlaza los scripts de todos. Mientras un PR no entra, su `<script>` da 404 en la
consola y su sección muestra «pendiente» (la tabla queda vacía hasta que entra la carga de datos del PR 2). No es un
error: cada módulo solo dibuja cuando llega su PR. Además, la ruta `/dashboard` del servidor llega con el PR 2, así que
el PR 1 se revisa abriendo `dashboard/index.html` directo en el navegador (el CSS y las utilidades sí cargan). Los
`resultados_metricas.json` no se suben a Git (cada quien los genera ejecutando los tres programas, ver README).

### PR 1 · Ian · `feat/dash-estructura`

Rutas desde la raíz del proyecto. `git rm` solo si el repositorio todavía trae el dashboard de la fase 1.

| Commit | Archivos |
|--------|----------|
| `refactor(dashboard): se retira el dashboard anterior; lo reemplaza la página nueva` | `git rm dashboard/dashboard.js` |
| `feat(dashboard): estructura HTML con secciones, CDN con integridad (SRI) y un contenedor por integrante` | `dashboard/index.html` |
| `feat(dashboard): estilos con paleta fija por lenguaje, modo oscuro y diseño para teléfono` | `dashboard/css/estilos.css` |
| `feat(dashboard): utilidades compartidas: crear elementos sin innerHTML, formatos y colores` | `dashboard/js/utiles.js` |
| `feat(dashboard): resultado producido y tabla comparativa con filtro por lenguaje y orden por columna` | `dashboard/js/tabla.js` |

### PR 2 · Edsson · `feat/dash-datos`

| Commit | Archivos |
|--------|----------|
| `feat(js/dashboard): lectura de los resultados_metricas.json y conteo de líneas de código (LOC) reales` | `javascript/src/metricasProyecto.js` |
| `feat(js/api): ruta GET /dashboard/api/metricas` | `javascript/src/api/rutasDashboard.js` |
| `feat(js/app): el servidor Express sirve /dashboard con sus propias cabeceras (permiten el CDN)` | `javascript/src/servidor.js` |
| `feat(dashboard): carga de las métricas desde el servidor y evento «metricas-listas»` | `dashboard/js/datos.js` |
| `feat(dashboard): tarjetas de ventajas y limitaciones y tres preguntas para la clase` | `dashboard/js/tarjetas.js` |

`javascript/src/servidor.js` ya existe desde el PR 6 de Node (Ian): este commit solo le agrega la ruta de `/dashboard`
(la constante de carpetas, las cabeceras propias del dashboard y un `app.use('/dashboard', …)` antes de las cabeceras
generales). El resto del sitio conserva su política de seguridad estricta (sin CDN).

### PR 3 · Leonardo · `feat/dash-graficas`

| Commit | Archivos |
|--------|----------|
| `feat(dashboard): script que mide cada lenguaje con distintos volúmenes de pedidos` | `dashboard/medir_volumenes.js` |
| `feat(dashboard): mediciones reales de 5 a 400 pedidos en Python, Java y JavaScript` | `dashboard/datos/volumenes.json` |
| `feat(dashboard): gráficas con Chart.js: secuencial frente a concurrente, cómputo por etapa y volumen` | `dashboard/js/graficas.js` |

`volumenes.json` son mediciones **reales** (no inventadas): las genera `node dashboard/medir_volumenes.js` corriendo la
versión de consola de cada lenguaje con archivos de 5, 100, 200, 300 y 400 pedidos (unos 4 minutos, porque cada cambio
de estado espera 100 ms de verdad). El script restaura los `resultados_metricas.json` de antes al terminar. El archivo
del PR es el medido en la computadora de Leonardo; cada integrante puede volver a generarlo en la suya.

### PR 4 · Yurem · `feat/dash-diagramas`

| Commit | Archivos |
|--------|----------|
| `feat(dashboard): texto de los diagramas Mermaid (MVC, login y concurrencia por lenguaje)` | `dashboard/js/definiciones.js` |
| `feat(dashboard): dibujo de los diagramas con Mermaid.js y pestañas de concurrencia` | `dashboard/js/diagramas.js` |
| `docs: README con el sprint final: cómo abrir http://localhost:3000/dashboard` | `README.md` |

**Criterios de aceptación (dashboard).** Con los tres `resultados_metricas.json` generados, `cd javascript && npm start`
y <http://localhost:3000/dashboard>:

- Aparece **$8,360.46** y el aviso de que los tres lenguajes coinciden al centavo; la tabla tiene 3 filas, el filtro
  por lenguaje deja solo una y los encabezados ordenan.
- Hay 3 gráficas de Chart.js (cada una con su tabla gemela «Ver como tabla») y el selector de volumen cambia la línea.
- Hay 3 diagramas de Mermaid y las pestañas Python / Java / JavaScript cambian el de concurrencia.
- Hay 3 tarjetas de lenguaje y 3 preguntas para la clase.
- Sin errores en la consola del navegador. Sin internet, la tabla y las tarjetas siguen y la página avisa que faltan las
  gráficas y los diagramas. Si falta un `resultados_metricas.json`, la página lo dice y explica qué ejecutar.
- `npm test` sigue en 8 pruebas en verde (el sprint final no agrega pruebas) y `npm start` mantiene el login de la
  interfaz de pedidos (`/dashboard.html` sigue pidiendo sesión).

**Verificado con un ensayo en seco.** Se reconstruyó el repositorio desde un estado anterior al sprint (fase 2 completa,
sin el dashboard nuevo ni la ruta `/dashboard`) leyendo las tablas de esta misma sección, y se aplicaron los 4 PR con
la receta «copiar + commit» del paso 3 de la sección 0. Tras cada merge se comprobó la sintaxis de los scripts,
`npm test` y el servidor:

| Variante del ensayo | Resultado |
|---------------------|-----------|
| Base sin el dashboard anterior (se omite el `git rm`), PR 1 → 2 → 3 → 4 | 4 merges sin conflictos; **8 pruebas en verde** tras cada PR |
| Igual, pero el PR 4 entra **antes** que el PR 3 | sin conflictos: confirma que Leonardo y Yurem trabajan en paralelo |
| Base que sí trae el dashboard anterior (el PR 1 ejecuta `git rm dashboard/dashboard.js`) | sin conflictos |

Qué se vio en cada paso: tras el PR 1 `/dashboard` todavía no existe (404 esperado); desde el PR 2 el servidor entrega
`GET /dashboard/api/metricas` con los 3 lenguajes, sus líneas de código y $8360.46. Al final, `dashboard/`,
`servidor.js`, `metricasProyecto.js`, `rutasDashboard.js` y el README quedaron con el mismo contenido que esta carpeta,
`git status` limpio (salvo los `resultados_metricas.json`, que no se versionan) y los 4 integrantes con commits
(Ian 4 o 5, Edsson 5, Leonardo 3, Yurem 3). Sobre el repositorio reconstruido se corrió además la prueba completa en
Chrome (56 comprobaciones: tabla, filtro y orden, gráficas, diagramas, tarjetas, modo oscuro, teléfono, sin CDN, sin un
`resultados_metricas.json` y sin `volumenes.json`) y pasó completa.

Nota para Windows: Git con `core.autocrlf=true` convierte los fines de línea al cambiar de rama; por eso el ensayo
compara el contenido sin contar `CRLF`/`LF`. No es un cambio real.

## 9. Cierre de la fase

- [ ] Los tres lenguajes: login funcional con `usuarios.json` (usuario y password en texto plano, a propósito).
- [ ] Los tres: formulario con selectores, carrito, vista previa y alertas visuales de validación.
- [ ] Los tres: tabla con estado y prioridad, y panel de concurrencia que cambia en vivo.
- [ ] 8 pruebas por lenguaje en verde (las 5 de la fase 1 siguen intactas).
- [ ] La consola de los tres sigue dando $8,360.46 y el dashboard comparativo (`dashboard/`) sigue funcionando.
- [ ] README con la forma de ejecutar cada GUI y los usuarios de prueba (llega con el PR 6 de Node); el del dashboard llega con el PR 4 del sprint final.
- [ ] Etiqueta `v2.0-gui` en `main`.
- [ ] Sprint final: `/dashboard` muestra resultado, tabla, 3 gráficas, 3 diagramas y las tarjetas, y el README explica cómo abrirlo.
- [ ] Etiqueta `v3.0-dashboard` en `main`.

## 10. Decisiones de simplicidad (nivel 3er semestre)

Se simplificó el código interno sin quitar ninguna función visual ni de negocio:

1. **Login simple.** `datos/usuarios.json` guarda `usuario`, `password` y `nombre` en texto plano y se compara
   el texto tal cual. Se quitaron PBKDF2, la sal y las utilerías para generar hashes. Es solo para este
   proyecto académico: en un sistema real nunca se guarda una contraseña así.
2. **Node sin SSE.** En lugar de Server-Sent Events, el navegador consulta cada 500 ms con `fetch()` y
   `setInterval()`. Se quitó `GET /api/eventos`.
3. **Pruebas esenciales.** 8 por lenguaje (5 de la fase 1 + login + formulario + concurrencia). Java ya no tiene
   la interfaz `Dialogos`: las ventanas llaman a `JOptionPane` directamente.
4. **Legibilidad.** Ciclos `for` y `if/else` en lugar de cadenas de `stream`/`map`/`filter`, `Optional`, métodos
   genéricos con `Function`, fábricas de hilos y funciones anidadas con `nonlocal`. Se mantienen los hilos, las
   promesas y las tres interfaces gráficas.

5. **Dashboard sin frameworks.** HTML, CSS y JavaScript puro con `fetch()` y manipulación directa del DOM; solo
   Chart.js y Mermaid.js, con versión fija e integridad (SRI). Los módulos no se importan entre sí: escuchan un evento
   (`metricas-listas`), igual que se escucha un clic. Los textos de los datos entran siempre como texto (nunca
   `innerHTML`), salvo el SVG que genera Mermaid a partir de nuestro propio texto.

**Archivos que cambiaron respecto a la versión anterior de este plan** (para no subir los viejos por error):

| Lenguaje | Eliminados | Cambiados |
|----------|------------|-----------|
| Python | `test_dashboard.py`, `test_vistas.py` | `autenticacion.py` (sin hash ni utilería de alta), `despachador.py`, `test_login.py`, `test_formulario.py`, `test_despachador.py` |
| Java | `seguridad/CredencialesInvalidasException`, `seguridad/ArchivoUsuariosException`, `vista/Dialogos`, `vista/DialogosSwing`, `controlador/DashboardTest`, `vista/VistasTest` | `seguridad/ServicioAutenticacion`, `AutenticacionException`, `Despachador`, `EventoDespacho`, `Etiquetas`, `ControladorFormulario` y las vistas, más `LoginTest`, `FormularioTest`, `DespachadorTest` |
| Node.js | `tests/api.test.js`, `tests/dashboard.test.js`, el paquete `supertest` | `autenticacion.js`, `despachador.js`, `sesiones.js`, `rutasDespachador.js`, `public/js/concurrencia.js`, `pedidos.js`, `dashboard.js` y las 3 pruebas |
| Los tres | el PR 7 (pruebas de ventanas y de API) | `datos/usuarios.json` |
| Dashboard | `dashboard/dashboard.js` (el de la fase 1) | `dashboard/index.html` (rehecho), `javascript/src/servidor.js` (agrega `/dashboard`) y `README.md` |
