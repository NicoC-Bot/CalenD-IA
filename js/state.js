// Estado en memoria de la aplicación: no persiste al recargar la página.
let eventosActuales = [];

// Reemplaza por completo la lista de eventos actual (no hay edición incremental).
export function setEventos(nuevosEventos) {
  eventosActuales = nuevosEventos;
}
