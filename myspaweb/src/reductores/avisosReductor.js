export const avisosInicial = { avisos: [], confirmacion: null };
const maximoAvisos = 4;

/** Avisos (toasts) en pantalla y la ventana de confirmación abierta. */
export function avisosReductor(estado, accion) {
  switch (accion.tipo) {
    case 'agregar':
      return { ...estado, avisos: [...estado.avisos, accion.aviso].slice(-maximoAvisos) };
    case 'quitar':
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.idAviso !== accion.idAviso) };
    case 'pedirConfirmacion':
      return { ...estado, confirmacion: accion.confirmacion };
    case 'cerrarConfirmacion':
      return { ...estado, confirmacion: null };
    default:
      throw new Error(`Acción de avisos desconocida: ${accion.tipo}`);
  }
}
