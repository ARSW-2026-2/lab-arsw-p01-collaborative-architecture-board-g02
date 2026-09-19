# ADR-002 — Client Boundaries (Límites y Desacoplamiento del Cliente Web)

## Status
Accepted

## Context
En la evolución del Laboratorio 5 ("Interactive Board"), la aplicación requiere un cliente web interactivo capaz de crear tableros, agregar elementos (`RECTANGLE`, `TEXT`, `CONNECTOR`), moverlos mediante drag-and-drop en un lienzo SVG, conectarlos, eliminarlos y persistir el estado completo en el backend REST desarrollado en el Lab 4.

Un enfoque ingenuo comúnmente acopla la manipulación directa del DOM/SVG con llamadas de red `fetch` dispersas y reglas de negocio en controladores de eventos HTML (código espagueti). Esto acarrea severos problemas:
1. **Falta de fuente única de verdad**: El DOM se convierte en el almacenamiento del estado, provocando inconsistencias visuales y de datos.
2. **Acoplamiento a la infraestructura de transporte**: La vista conoce URLs, headers HTTP y excepciones Java del backend.
3. **Condiciones de carrera y descontrol de red**: Peticiones concurrentes desordenadas sin control de estados de carga (`loading`), error o reintento (`retry`).
4. **Impedimento para evolución**: En el Lab 6 se incorporarán WebSockets/STOMP para colaboración en tiempo real. Un cliente acoplado obligaría a reescribir toda la interfaz.

## Decision
Se decide estructurar el cliente web en cuatro módulos con responsabilidades únicas y dependencias unidireccionales (sin ciclos), utilizando JavaScript nativo con ES Modules:

1. **`BoardApiClient` (`static/js/api/board-api-client.js`)**:
    - **Responsabilidad única**: Encapsular todas las interacciones HTTP (`fetch`).
    - **Contrato de errores**: Traduce códigos de error HTTP y payloads de falla (`ApiError`) en errores controlados de cliente con código y mensaje legibles.
    - **Aislamiento**: Ningún otro archivo del cliente realiza llamadas `fetch`.

2. **`BoardState` (`static/js/state/board-state.js`)**:
    - **Responsabilidad única**: Gestionar el estado local de la aplicación en memoria como **única fuente de verdad**.
    - **Contenido**: Mantiene el tablero actual (`board`), el elemento seleccionado (`selectedElementId`), el modo de interacción (`interactionMode`) y el estado de sincronización remota (`remoteState: IDLE, LOADING, SUCCESS, ERROR`).
    - **Operaciones puras**: Provee mutaciones predecibles (`addElement`, `removeElement`, `updateElementPosition`, etc.) sin interactuar con el DOM ni con la red.

3. **`BoardView` (`static/js/ui/board-view.js`)**:
    - **Responsabilidad única**: Proyección declarativa del estado en nodos SVG (`<rect>`, `<text>`, `<line>`) y captura de eventos de puntero y teclado.
    - **Aislamiento**: No almacena datos de negocio ni conoce endpoints HTTP ni excepciones del backend. Comunica interacciones de usuario mediante callbacks/eventos.

4. **`BoardApp` (`static/js/app.js`)**:
    - **Responsabilidad única**: Orquestador central. Coordina el flujo entre `BoardView`, `BoardState` y `BoardApiClient`.
    - **Manejo de estados remotos**: Controla las transiciones `loading -> success/error`, inhabilita controles durante operaciones remotas activas para evitar condiciones de carrera, y ofrece la acción de `Retry` preservando la última operación fallida.

## Positive consequences
- **Desacoplamiento estricto**: La vista puede cambiar drásticamente su diseño visual o paleta de colores sin tocar la lógica de negocio ni la capa de transporte HTTP.
- **Preparación directa para WebSockets (Lab 6)**: Cuando los eventos en tiempo real lleguen vía STOMP, simplemente actualizarán `BoardState` e invocarán `BoardView.render()`, sin requerir modificaciones en la vista.
- **Manejo uniforme de errores y red**: Todo fallo de red se canaliza a través de un único contrato en `BoardApiClient`, facilitando la retroalimentación al usuario.
- **Testeabilidad y mantenibilidad**: `BoardState` y `BoardApiClient` pueden ser probados de forma aislada sin requerir un navegador ni el DOM de SVG.

## Trade-off / Negative consequences
- **Indirección inicial**: Requiere definir contratos explícitos entre módulos y orquestación mediante eventos o callbacks en lugar de scripts lineales simples.
- **Mayor número de archivos**: Requiere mantener 4 módulos separados en lugar de un único script monolítico.

## Evidence / validation
- **Inspección de código**:
    - `grep -r "fetch" src/main/resources/static/` confirma que `fetch` se utiliza **únicamente** dentro de `static/js/api/board-api-client.js`.
    - `static/js/ui/board-view.js` no contiene referencias a URLs, endpoints REST ni estructuras de excepciones Java.
    - `static/js/state/board-state.js` es código JavaScript puro sin referencias a `document`, `window` ni `fetch`.
- **Comportamiento en ejecución**:
    - Durante las operaciones de guardado y carga, la interfaz refleja el estado `loading` y deshabilita los botones de acción para prevenir estados inconsistentes.
    - Si el backend no responde o devuelve 404/400, la interfaz muestra el error controlado y habilita el botón `Retry`.