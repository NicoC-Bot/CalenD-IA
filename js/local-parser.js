// Parser por reglas: interpreta el texto libre de la semana sin depender de ninguna IA.
import { normalizarDia } from "./data.js"; // js/data.js

// Detecta una línea que es solo un encabezado de día (ej. "lunes", "martes 14").
const DIA_RE = /^(lunes|martes|mi[eé]rcoles|jueves|viernes)\b/i;

// Piezas del regex de eventos, armadas por separado para que sean más fáciles de leer:
const HORA_RE = "\\d{1,2}(?::\\d{2})?"; // hora tipo "9" o "09:00"
const SUFIJO_HORA_RE = "(?:\\s*(?:hrs?\\.?|horas?))?"; // sufijo opcional "hrs"/"horas"
const CONECTOR_RE = "(?:a|hasta|-|–)"; // palabra/símbolo que une hora inicio y hora fin

// Línea de evento: "[de] HORA [hrs] CONECTOR HORA [hrs] [: o -] resto del texto".
// Cubre formatos como "9 a 12hrs uso de extintores", "9-12 uso de extintores"
// o "de 9 hasta 12 hrs: Manejo a la defensiva".
const EVENTO_RE = new RegExp(
  `^(?:de\\s+)?(${HORA_RE})${SUFIJO_HORA_RE}\\s*${CONECTOR_RE}\\s*(${HORA_RE})${SUFIJO_HORA_RE}\\s*[:\\-–]?\\s*(.+)$`,
  "i"
);

// Lista cerrada de lugares que se reconocen como "ubicación" del curso (ver extraerUbicacion).
const UBICACIONES_CONOCIDAS = ["calama", "chuqui"];

// Convierte "9" o "9:30" al formato "HH:MM" con ceros a la izquierda.
function normalizarHora(horaTexto) {
  const [horaStr, minStr] = horaTexto.split(":"); // "9:30" -> ["9", "30"]; "9" -> ["9", undefined]
  const hora = horaStr.padStart(2, "0"); // "9" -> "09"
  const min = (minStr || "00").padStart(2, "0"); // sin minutos -> "00"
  return `${hora}:${min}`;
}

// Umbral de duración para considerar un evento "todo el día" (en minutos).
const DURACION_TODO_EL_DIA_MIN = 6 * 60; // 6 horas

// Convierte "HH:MM" a minutos desde medianoche, para poder restar horarios entre sí.
function horaAMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

// Clasifica el evento en "presencial" (tiene ubicación física), "todo-el-dia" (dura 6
// horas o más) o "normal" (el resto) — ya no depende de palabras clave en el curso.
function detectarCategoria(inicio, fin, ubicacion) {
  if (ubicacion) return "presencial";
  if (horaAMinutos(fin) - horaAMinutos(inicio) >= DURACION_TODO_EL_DIA_MIN) return "todo-el-dia";
  return "normal";
}

// Si la última palabra del texto es una ubicación conocida (ej. "Práctico 4x4 Calama"),
// la separa del nombre del curso y la devuelve aparte; si no, deja el curso tal cual.
function extraerUbicacion(textoCurso) {
  const palabras = textoCurso.trim().split(/\s+/); // ["Práctico", "4x4", "Calama"]
  const ultima = (palabras[palabras.length - 1] || "").toLowerCase(); // "calama"
  if (UBICACIONES_CONOCIDAS.includes(ultima)) {
    const ubicacionRaw = palabras.pop(); // saca "Calama" del array de palabras del curso
    const ubicacion = ubicacionRaw.charAt(0).toUpperCase() + ubicacionRaw.slice(1).toLowerCase(); // "Calama"
    return { curso: palabras.join(" ").trim(), ubicacion }; // curso = "Práctico 4x4"
  }
  return { curso: textoCurso.trim(), ubicacion: null }; // no hay ubicación conocida al final
}

// Reconoce líneas tipo "9 a 12hrs uso de extintores", "12:00 a 15:00 hrs Práctico 4x4 Calama"
// o variantes con "-"/"hasta" como conector ("9-12 uso de extintores", "de 9 hasta 12hrs: ...").
// Si una línea de texto es solo un día (con o sin fecha, ej. "martes 14"), cambia el día
// activo; los eventos sin día explícito quedan en el último día visto (lunes por defecto).
export function parsearLocal(texto) {
  // Separa el texto en líneas no vacías, sin espacios sobrantes.
  const lineas = (texto || "") // si viene undefined/null, arranca desde string vacío
    .split(/\r?\n/) // corta por salto de línea (soporta \n y \r\n)
    .map((linea) => linea.trim()) // quita espacios sobrantes de cada línea
    .filter(Boolean); // descarta líneas que quedaron vacías

  // "Puntero" al día/fecha vigente mientras se recorren las líneas.
  let diaActual = "lunes";
  let fechaActual = null;
  const eventos = [];

  for (const linea of lineas) {
    // ¿La línea es solo un encabezado de día (con o sin número de fecha al final)?
    const matchDia = linea.match(DIA_RE);
    const restoLuegoDelDia = matchDia ? linea.slice(matchDia[0].length).trim() : null;

    if (matchDia && /^\d*$/.test(restoLuegoDelDia)) {
      // Actualiza el día/fecha activos y pasa a la siguiente línea (no es un evento).
      diaActual = normalizarDia(matchDia[1]);
      fechaActual = restoLuegoDelDia || null;
      continue;
    }

    // Si no es encabezado de día, intenta interpretarla como línea de horario + curso.
    const matchEvento = linea.match(EVENTO_RE);
    if (!matchEvento) continue; // línea que no calza con ningún patrón: se ignora

    // El primer elemento del match (la coincidencia completa) se descarta con la coma inicial.
    const [, inicioRaw, finRaw, restoRaw] = matchEvento;
    const { curso, ubicacion } = extraerUbicacion(restoRaw);
    if (!curso) continue;

    const inicio = normalizarHora(inicioRaw);
    const fin = normalizarHora(finRaw);

    // Arma el evento con el día/fecha vigentes al momento de leer esta línea.
    eventos.push({
      dia: diaActual,
      fecha: fechaActual,
      inicio,
      fin,
      curso,
      categoria: detectarCategoria(inicio, fin, ubicacion),
      ubicacion,
    });
  }

  return eventos;
}
