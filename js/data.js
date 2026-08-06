// Esquema de evento:
// { dia: "lunes"|"martes"|"miercoles"|"jueves"|"viernes", fecha: string|null, inicio: "HH:MM",
//   fin: "HH:MM", curso: string, categoria: "normal"|"todo-el-dia"|"presencial", ubicacion: string|null }
// La categoría la calcula js/local-parser.js: "presencial" si el evento tiene ubicación,
// "todo-el-dia" si dura 6 horas o más, y "normal" en cualquier otro caso.

// Orden y etiqueta visual de las 5 columnas del calendario (lunes a viernes).
// "key" es el valor interno con el que se agrupan/buscan eventos (ver render.js), y
// "label" es el texto ya formateado (mayúsculas, con tilde) que se muestra en pantalla.
export const DIAS = [
  { key: "lunes", label: "LUNES" }, // primera columna
  { key: "martes", label: "MARTES" },
  { key: "miercoles", label: "MIÉRCOLES" }, // key sin tilde, label con tilde
  { key: "jueves", label: "JUEVES" },
  { key: "viernes", label: "VIERNES" }, // última columna
];

// Normaliza cualquier variante de escritura de un día ("Lunes", "LUNES ", "lúnes")
// al formato interno usado en todo el proyecto: minúscula, sin tildes, sin espacios.
export function normalizarDia(dia) {
  return (dia || "") // si viene undefined/null, arranca desde string vacío
    .toString() // por si llega un valor que no sea string (defensivo)
    .normalize("NFD") // separa cada letra de su tilde (ej. "é" -> "e" + acento)
    .replace(/[̀-ͯ]/g, "") // elimina los acentos ya separados por normalize()
    .toLowerCase() // "Lunes" -> "lunes"
    .trim(); // quita espacios sobrantes al inicio/final
}

// Estado inicial al cargar la página y al recargar el navegador: sin eventos, así que
// render.js muestra las 5 columnas vacías con el placeholder "Sin actividades".
export const EJEMPLO_EVENTOS = [];
