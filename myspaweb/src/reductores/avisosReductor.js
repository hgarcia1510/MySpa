// Avisos (toasts) y diálogo de confirmación.
export const accionesAvisos = {
  agregar: 'avisos/agregar',
  quitar: 'avisos/quitar',
  pedirConfirmacion: 'avisos/pedirConfirmacion',
  cerrarConfirmacion: 'avisos/cerrarConfirmacion',
};

export const maximoAvisos = 4;

export const estadoInicialAvisos = { avisos: [], confirmacion: null };

export function avisosReductor(estado, accion) {
  switch (accion.type) {
    case accionesAvisos.agregar:
      return { ...estado, avisos: [...estado.avisos, accion.aviso].slice(-maximoAvisos) };
    case accionesAvisos.quitar:
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.idAviso !== accion.idAviso) };
    case accionesAvisos.pedirConfirmacion:
      return { ...estado, confirmacion: accion.confirmacion };
    case accionesAvisos.cerrarConfirmacion:
      return { ...estado, confirmacion: null };
    default:
      return estado;
  }
}
