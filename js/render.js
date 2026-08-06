import { DIAS, normalizarDia } from "./data.js"; // js/data.js

// Clases CSS/Tailwind aplicadas a cada tarjeta según la categoría del evento (mismos
// colores del diseño original: coral = normal, amarillo = todo el día, morado = presencial).
const CATEGORIA_CONFIG = {
  normal: { cardClass: "course-card-normal", badgeClass: "bg-primary text-on-primary" },
  "todo-el-dia": { cardClass: "course-card-todo-el-dia", badgeClass: "bg-tertiary-container text-on-tertiary-container" },
  presencial: { cardClass: "course-card-presencial", badgeClass: "bg-secondary text-on-secondary" },
};

// Arma el HTML de una tarjeta de curso individual.
function tarjetaHtml(evento) {
  const config = CATEGORIA_CONFIG[evento.categoria] || CATEGORIA_CONFIG.normal; // normal si la categoría no calza
  const horario = `${evento.inicio} - ${evento.fin}`; // ej. "09:00 - 13:00"

  // Con ubicación: curso + ubicación en dos líneas. Sin ubicación: solo el nombre del curso.
  const contenido = evento.ubicacion
    ? `<div class="text-center">
         <div class="font-headline-sm text-headline-sm text-on-surface">${evento.curso}</div>
         <div class="font-label-bold text-label-bold text-primary">${evento.ubicacion}</div>
       </div>`
    : `<span class="font-headline-sm text-headline-sm text-on-surface text-center">${evento.curso}</span>`;

  return `
    <div class="${config.cardClass} p-card-padding rounded-lg flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
      <span class="${config.badgeClass} px-3 py-1 rounded-full font-label-bold text-label-bold">${horario}</span>
      ${contenido}
    </div>`;
}

// Arma el HTML de una columna completa (encabezado del día + tarjetas ordenadas por hora).
function columnaHtml(dia, eventosDelDia) {
  const tarjetas = eventosDelDia
    .slice() // copia para no mutar el array original al ordenar
    .sort((a, b) => a.inicio.localeCompare(b.inicio) || a.fin.localeCompare(b.fin)) // por inicio, y si empatan, por fin (más corto primero)
    .map(tarjetaHtml) // evento -> HTML de su tarjeta
    .join(""); // une todas las tarjetas en un solo string

  const cuerpo = tarjetas || `<p class="font-body-md text-body-md text-on-surface-variant opacity-50 text-center py-4">Sin actividades</p>`;
  // Toma la fecha del primer evento que la tenga (todos los eventos del mismo día comparten fecha).
  const fecha = eventosDelDia.find((evento) => evento.fecha)?.fecha;
  // La fecha va en una línea aparte, debajo del recuadro de color (no dentro de él),
  // igual que en el diseño original; si no hay fecha, esa línea simplemente no aparece.
  const lineaFecha = fecha
    ? `<div class="text-on-surface-variant font-body-lg text-body-lg opacity-70">${fecha}</div>`
    : "";

  return `
    <div class="flex flex-col gap-4">
      <div class="text-center">
        <div class="bg-primary-container text-on-primary-container rounded-lg py-2 font-headline-sm text-headline-sm uppercase tracking-wider mb-1">${dia.label}</div>
        ${lineaFecha}
      </div>
      <div class="space-y-4">${cuerpo}</div>
    </div>`;
}

// Punto de entrada: recibe la lista completa de eventos de la semana, los agrupa por
// día y reemplaza el contenido de #calendar-grid con las 5 columnas ya armadas.
export function renderCalendar(eventos) {
  const grid = document.getElementById("calendar-grid"); // index.html
  if (!grid) return; // si el elemento no existe todavía, no hay nada que pintar

  // Un array vacío por día, para ir clasificando los eventos recibidos.
  const eventosPorDia = new Map(DIAS.map((d) => [d.key, []]));
  for (const evento of eventos) {
    const key = normalizarDia(evento.dia); // normaliza por si el día no viene ya normalizado
    if (eventosPorDia.has(key)) eventosPorDia.get(key).push(evento); // ignora días desconocidos
  }

  // Reemplaza todo el contenido de la grilla con las 5 columnas recién armadas.
  grid.innerHTML = DIAS.map((dia) => columnaHtml(dia, eventosPorDia.get(dia.key))).join("");
}
