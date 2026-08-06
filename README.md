# CalenD-AI

Generador de planificaciones corporativas — Proyecto final, Bootcamp IA Lab
(Skillnest). MVP 100% frontend: pega un texto describiendo las actividades de la semana
y un parser por reglas (RegEx) lo transforma en un calendario de 5 columnas con el diseño
corporativo.

## Alcance (Fase 1 — lo que hace hoy)

- Sin base de datos ni backend: todo corre en el navegador.
- Sin dependencias de red ni de IA: el texto se interpreta 100% en el cliente con
  expresiones regulares.
- Un solo flujo: cada "Actualizar Calendario" reemplaza la semana completa (no hay
  edición manual de tarjetas individuales).
- Si recargas la página, el calendario vuelve a los datos de ejemplo iniciales.

No incluye (quedó para una fase futura, ver el PDF del proyecto): localStorage,
exportar a PDF, drag & drop de tarjetas, edición manual, ni navegación entre semanas.
(Exportar a imagen PNG sí está implementado — ver "Descargar como imagen" más abajo.)

## Estructura del proyecto

```
CalenD-AI/
  index.html          # UI completa (calendario, textarea de input)
  css/styles.css       # estilos custom (tarjetas por categoría, scrollbar, spinner)
  js/data.js           # esquema de evento + DIAS + datos de ejemplo hardcoded
  js/render.js         # renderCalendar(eventos): limpia y repinta las 5 columnas
  js/local-parser.js   # parsearLocal(texto): interpreta el texto libre por reglas/regex
  js/state.js          # estado en memoria (eventos actuales)
  js/app.js            # conecta la UI: botón, banner de error, descarga de imagen
  package.json         # solo para el servidor local de desarrollo (ver más abajo)
```

## Lógica por archivo

**`index.html`** — Banner de error, `#calendar-capture` (título + grilla; es justo lo
que se exporta a PNG), botón "Descargar como imagen" y la sección "Nueva Información"
(textarea + botón). Carga por CDN Tailwind, Google Fonts (con `crossorigin`, necesario
para poder incrustarlas en el PNG) y `html-to-image`.

**`css/styles.css`** — Color de borde/fondo por categoría (`course-card-normal` /
`todo-el-dia` / `presencial`) y detalles menores (ícono, scrollbar, spinner).

**`js/data.js`** — `DIAS` (orden/etiquetas de las columnas), `normalizarDia()` (día a
minúscula sin tilde) y `EJEMPLO_EVENTOS` (estado inicial, hoy vacío).

**`js/local-parser.js`** — Único motor de interpretación de texto, sin IA.
`parsearLocal()` recorre línea por línea; `detectarCategoria()` decide
presencial/todo-el-día/normal por horario y ubicación; `extraerUbicacion()` separa el
lugar (Calama/Chuqui) del nombre del curso.

**`js/render.js`** — `renderCalendar()` agrupa los eventos por día y repinta
`#calendar-grid`; `columnaHtml()`/`tarjetaHtml()` arman ese HTML y ordenan las tarjetas
por `inicio` (y por `fin` si empatan).

**`js/state.js`** — `getEventos()`/`setEventos()`, el único punto de estado en memoria.

**`js/app.js`** — Conecta todo: listener de "Actualizar Calendario" (valida → parsea →
guarda estado → renderiza), listener de "Descargar como imagen" (`html-to-image`), y el
auto-resize del textarea al escribir/pegar texto.

**`package.json`** — Solo para desarrollo local (`npm run dev` levanta `serve` en el
puerto 8877); no afecta el sitio ya desplegado, que sigue siendo 100% estático.

### Esquema de un evento

```json
{
  "dia": "lunes",
  "fecha": null,
  "inicio": "09:00",
  "fin": "13:00",
  "curso": "Trabajo en altura teórico",
  "categoria": "normal",
  "ubicacion": null
}
```

- `dia`: `lunes | martes | miercoles | jueves | viernes` (sin tildes, minúscula).
- `fecha`: string o `null`. Si el texto trae el día seguido de un número (ej. "martes
  14"), ese número se muestra junto al nombre del día en el header de la columna (ej.
  "MARTES 14"). Si el día viene solo (ej. "Lunes"), queda en `null` y no se muestra nada.
- `categoria`: `presencial` (el evento tiene `ubicacion`, color morado), `todo-el-dia`
  (dura 6 horas o más, color amarillo/mostaza), `normal` (el resto, color coral). No
  depende de palabras clave en el nombre del curso, solo de horario y ubicación.
- `ubicacion`: string o `null`. Se usa para prácticos con lugar (ej. "Chuqui", "Calama").

## Cómo correrlo localmente

Como usa módulos ES6 (`<script type="module">`), no se puede abrir `index.html` con
doble clic (los navegadores bloquean imports por `file://`). Hay que servirlo con
cualquier servidor estático. `node_modules`/`package.json` son solo una herramienta de
desarrollo (el servidor local) — no agregan nada al sitio en sí, que sigue siendo HTML +
Tailwind (CDN) + JS Vainilla sin build step.

```bash
# Opción principal (usa el servidor ya configurado en package.json)
cd CalenD-AI
npm install
npm run dev
# abrir http://localhost:8877/index.html
```

```bash
# Alternativas sin instalar nada en el proyecto
npx serve .              # Node, sin package.json propio
python -m http.server 8877   # Python, ya viene instalado en este equipo
```

## Cómo usarlo

1. Escribir en el textarea "Nueva Información" un texto libre describiendo la semana,
   un día por bloque, por ejemplo:
   ```
   lunes 13
   9 a 12hrs uso de extintores
   12:00 a 15:00 hrs Práctico 4x4 Calama

   martes 14
   9 a 12hrs uso de extintores
   14 a 18hrs Manejo a la defensiva
   ```
2. Presionar "Actualizar Calendario". El parser interpreta el texto y repinta las 5
   columnas con los eventos extraídos.

### El parser (`js/local-parser.js`) maneja automáticamente

- Horas en formatos mixtos ("9 a 12hrs", "09:00 a 18:00", "9-12", "de 9 hasta 12 hrs")
  → normalizadas a `HH:MM`.
- Día implícito: si un bloque no repite el nombre del día, se asume que sigue
  perteneciendo al día anterior en el texto.
- Categoría del curso según horario/ubicación: si tiene ubicación → `presencial`; si dura
  6 horas o más → `todo-el-dia`; el resto → `normal`.
- Ubicación pegada al nombre del curso (ej. "práctico Chuqui") se separa al campo
  `ubicacion` en vez de quedar en `curso`, si está en la lista de ubicaciones conocidas
  dentro del archivo (`calama`, `chuqui`).

## Manejo de errores

Los siguientes casos se muestran en un banner rojo (no solo en consola):

- Texto de la semana vacío.
- Texto que no calza con ningún patrón reconocido por el parser (ninguna línea de día
  ni de horario detectada).