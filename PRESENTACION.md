# Guía para exponer CalenD-AI

Documento de apoyo para ensayar la presentación. No es documentación técnica (para eso
está el `README.md`) — es un resumen pensado para hablar del proyecto en voz alta:
qué es, con qué está hecho, por qué se tomó cada decisión, y preguntas que probablemente
te hagan.

---

## 1. El pitch (30 segundos)

> "CalenD-AI es una app web para generar automáticamente el calendario semanal de
> capacitaciones de una empresa. En vez de armar el calendario a mano en Excel o
> Photoshop, la persona escribe un texto simple describiendo las actividades de la
> semana, y la app lo interpreta y dibuja el calendario de 5 columnas con el diseño
> corporativo, listo para descargar como imagen."

Problema que resuelve: armar y mantener estos calendarios a mano es lento y propenso a
errores. Solución: texto libre → estructura → diseño automático.

---

## 2. Qué usa el proyecto y para qué

| Tecnología | Para qué se usa | Por qué esa y no otra |
|---|---|---|
| **HTML5** | Estructura de la página (`index.html`) | Base de cualquier sitio web |
| **Tailwind CSS (vía CDN)** | Todo el diseño visual: colores, layout de 5 columnas, tarjetas, botones | Cero configuración, sin paso de build — se define un tema (colores/tipografías) una vez en `tailwind.config` y se usa como clases en el HTML |
| **JavaScript Vainilla (ES6, módulos)** | Toda la lógica: parser, render, estado, eventos de UI | El alcance del proyecto es "sin frameworks" (nada de React/Vue) — módulos ES6 (`import`/`export`) alcanzan para mantener el código ordenado en archivos separados |
| **Expresiones regulares (RegEx)** | El parser que interpreta el texto libre y lo convierte en eventos estructurados | Reemplaza lo que originalmente se pensó hacer con la API de Gemini (IA) — ver sección 4 |
| **html-to-image (vía CDN)** | Botón "Descargar como imagen": convierte el calendario en un PNG descargable | Se probó primero con `html2canvas`, pero tenía un bug real (texto duplicado/borroso); `html-to-image` lo resuelve |
| **Google Fonts** | Tipografías (Hanken Grotesk, Work Sans) e íconos (Material Symbols) | Parte del diseño corporativo definido para el proyecto |
| **npm + `serve`** | Solo para levantar un servidor local mientras se desarrolla (`npm run dev`) | Los módulos ES6 no funcionan abriendo el `index.html` directo (`file://`), necesitan servirse por `http://` |
| **Git + GitHub** | Control de versiones y hosting del sitio final | GitHub Pages permite publicar un sitio 100% estático gratis, sin backend |

**Dato clave para la exposición**: el proyecto **no usa ninguna IA en producción**. El
enunciado original pedía integrar la API de Gemini, pero se decidió reemplazarla
completamente por un parser de reglas (RegEx) — ver sección 4 para el argumento.

---

## 3. Qué tiene la app (funcionalidades)

- **Textarea de texto libre**: la persona escribe algo como `"lunes 13 / 9 a 12hrs uso
  de extintores"` y la app lo interpreta sola (sin plantillas rígidas ni formularios).
- **Reconocimiento flexible de horarios**: entiende `"9 a 12hrs"`, `"09:00 a 18:00"`,
  `"9-12"`, `"de 9 hasta 12 hrs"` — varios formatos de la misma idea.
- **Categorización automática por color**, sin que el usuario la indique:
  - 🟣 **Presencial** (morado) — el curso tiene una ubicación física (ej. "Calama").
  - 🟡 **Todo el día** (amarillo) — dura 6 horas o más.
  - 🟠 **Normal** (coral) — el resto.
- **Orden automático** de las tarjetas por hora de inicio (y por hora de término si dos
  empiezan igual).
- **Exportar el calendario como imagen PNG** con un clic, lista para enviar por
  WhatsApp/correo.
- **Textarea que crece solo** al escribir o pegar un texto largo.
- **Manejo de errores visible** (banner rojo) si el texto está vacío o no se reconoce
  ninguna actividad — nunca falla en silencio.
- **Datos de ejemplo / estado en memoria**: si recargas la página, vuelve a un
  calendario vacío (no hay base de datos, es intencional para el alcance del MVP).

---

## 4. Decisiones importantes que te pueden preguntar

**¿Por qué no usaron la IA (Gemini) que pedía el enunciado del proyecto?**
Se implementó primero con la API de Gemini (fetch + system prompt), y funcionaba. Se
decidió reemplazarlo por un parser de reglas (RegEx) por tres razones: (1) elimina la
dependencia de una API key y de cuota/facturación externa, (2) el resultado es 100%
determinístico y funciona sin internet, y (3) evita que cualquiera que abra el sitio en
GitHub Pages tenga que poner su propia key para que funcione. El costo: el parser es
menos flexible con frases muy libres que una IA — se compensó reforzando las reglas con
varios formatos de hora aceptados.

**¿Por qué Tailwind por CDN y no un proyecto con build (Vite, webpack, etc.)?**
El alcance definido para el proyecto era "sin build step, JS Vainilla" — Tailwind por
CDN compila las clases directo en el navegador, sin necesidad de instalar ni configurar
nada para poder editar el proyecto.

**¿Cómo decide la app la categoría/color de un curso?**
No usa palabras clave del texto — usa dos datos objetivos que ya tiene el evento: si
tiene una ubicación asociada (→ presencial) y cuánto dura (→ todo el día si son 6h o
más). Es más predecible que depender de que el usuario escriba una palabra específica.

**¿Por qué `html-to-image` y no `html2canvas` (que es lo que suele recomendarse)?**
Se probó `html2canvas` primero. Tenía un bug real: el texto en negrita de los horarios
salía duplicado/borroso por cómo esa librería dibuja el texto manualmente. Se comparó
con `html-to-image` (que usa el motor de renderizado nativo del navegador vía SVG) y el
problema desapareció — se cambió con evidencia, no por preferencia.

**¿Dónde vive el estado? ¿Se guarda en alguna base de datos?**
No — vive en memoria del navegador (`js/state.js`), se pierde al recargar. Es una
decisión de alcance del MVP (Fase 1), no una limitación técnica; persistencia con
`localStorage` quedó documentada como posible paso futuro.

**¿Cómo está desplegado?**
Repositorio público en GitHub, publicado gratis con GitHub Pages:
`https://nicoc-bot.github.io/CalenD-IA/`.

---

## 5. Demo en vivo — comandos

```bash
cd CalenD-AI
npm install     # solo la primera vez
npm run dev     # levanta el servidor local en :8877
# abrir http://localhost:8877/index.html
```

Guión sugerido para la demo:
1. Mostrar el calendario vacío al cargar ("Sin actividades").
2. Pegar un texto de ejemplo con varios días y horarios mixtos.
3. Presionar "Actualizar Calendario" — mostrar que ordena por hora y colorea solo.
4. Probar un texto vacío o inválido — mostrar el banner de error.
5. Presionar "Descargar como imagen" — mostrar el PNG resultante.

---

## 6. Estructura del código (por si preguntan "cómo está organizado")

```
index.html          → UI completa (HTML + Tailwind)
css/styles.css       → estilos que Tailwind no cubre (colores por categoría, scrollbar)
js/data.js           → esquema de evento + días de la semana
js/local-parser.js   → el "motor": interpreta el texto y decide la categoría
js/render.js         → dibuja el calendario en el DOM
js/state.js          → guarda los eventos actuales en memoria
js/app.js            → conecta todo con los botones/eventos de la UI
```

Flujo de datos: **texto del usuario → `local-parser.js` (RegEx) → `state.js` (memoria)
→ `render.js` (dibuja el HTML)**.
