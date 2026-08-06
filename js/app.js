// Conecta la UI (index.html) con la lógica del proyecto: lee el textarea, dispara el
// parser, actualiza el estado y repinta el calendario. Es el único archivo con lógica
// de eventos del DOM.
import { EJEMPLO_EVENTOS } from "./data.js"; // js/data.js
import { renderCalendar } from "./render.js"; // js/render.js
import { parsearLocal } from "./local-parser.js"; // js/local-parser.js
import { setEventos } from "./state.js"; // js/state.js

// Referencias a los elementos del DOM usados por este archivo (definidos en index.html).
const weekInput = document.getElementById("week-input"); // index.html
const generateBtn = document.getElementById("generate-btn"); // index.html
const downloadBtn = document.getElementById("download-btn"); // index.html
const calendarCapture = document.getElementById("calendar-capture"); // index.html
const errorBanner = document.getElementById("error-banner"); // index.html
const errorBannerText = document.getElementById("error-banner-text"); // index.html

// Muestra el banner rojo de error con el mensaje indicado.
function showError(mensaje) {
  errorBannerText.textContent = mensaje; // escribe el texto del error
  errorBanner.classList.remove("hidden"); // dejar de estar oculto...
  errorBanner.classList.add("flex"); // ...y mostrarse como fila (ícono + texto)
}

// Oculta el banner de error (se llama antes de cada intento de generar el calendario).
function hideError() {
  errorBanner.classList.add("hidden"); // vuelve a ocultarse
  errorBanner.classList.remove("flex");
}

// Agranda el textarea para que quepa todo el texto escrito/pegado (hasta max-h, definido
// en index.html; de ahí en adelante aparece scroll en vez de seguir creciendo).
function autoResizeWeekInput() {
  weekInput.style.height = "auto"; // resetea antes de medir, si no scrollHeight solo crece
  weekInput.style.height = `${weekInput.scrollHeight}px`; // se ajusta al alto real del contenido
}
weekInput.addEventListener("input", autoResizeWeekInput); // cubre tanto escribir como pegar

// Flujo principal: texto del textarea -> parser por reglas -> estado -> render.
generateBtn.addEventListener("click", () => {
  hideError(); // limpia cualquier error del intento anterior
  const texto = weekInput.value.trim();

  if (!texto) {
    showError("Escribe las actividades de la semana antes de generar el calendario.");
    return; // no sigue si no hay texto que interpretar
  }

  const eventos = parsearLocal(texto);
  if (eventos.length === 0) {
    showError('No se reconoció ninguna actividad en el texto. Revisa el formato (ej. "lunes 13" seguido de "9 a 12hrs uso de extintores").');
    return; // no sigue si el parser no reconoció nada (evita vaciar el calendario actual)
  }

  setEventos(eventos); // guarda los eventos nuevos como estado actual
  renderCalendar(eventos); // repinta las 5 columnas con esos eventos
  weekInput.value = ""; // limpia el textarea para el próximo ingreso
  weekInput.style.height = ""; // vuelve a su alto mínimo (min-h de index.html)
});

// Exporta el título + la grilla (#calendar-capture) como una imagen PNG descargable.
// html-to-image (cargado vía CDN en index.html) genera el PNG directamente a partir
// del DOM; de ahí se saca un data URL que se dispara como descarga con un <a> temporal.
downloadBtn.addEventListener("click", async () => {
  hideError();
  try {
    // Espera a que las fuentes web (Hanken Grotesk/Work Sans) terminen de cargar, y
    // arma su CSS embebido (@font-face con el archivo de fuente incluido) para que el
    // PNG use la tipografía real en vez de caer a una fuente genérica del sistema.
    await document.fonts.ready;
    const fontEmbedCSS = await htmlToImage.getFontEmbedCSS(calendarCapture); // @font-face embebido
    const dataUrl = await htmlToImage.toPng(calendarCapture, { fontEmbedCSS }); // imagen en base64

    const link = document.createElement("a"); // <a> temporal, nunca se agrega al DOM
    link.download = "calendario-semanal.png"; // nombre del archivo al descargar
    link.href = dataUrl;
    link.click(); // dispara la descarga sin necesidad de mostrar el link en pantalla
  } catch {
    showError("No se pudo generar la imagen del calendario. Intenta de nuevo.");
  }
});

// Estado y render inicial al cargar la página (datos de ejemplo hardcoded).
setEventos(EJEMPLO_EVENTOS); // guarda el estado inicial (hoy: array vacío)
renderCalendar(EJEMPLO_EVENTOS); // pinta las 5 columnas apenas carga la página
