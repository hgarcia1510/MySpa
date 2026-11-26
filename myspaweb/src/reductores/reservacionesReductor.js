export const reservacionesInicial = {
  reservaciones: null, // null = aún no carga
  buscar: '',
  estatus: '',
  editando: null, // null = cerrado, {} = alta
};

/** Estado de la lista de reservaciones del empleado. */
export function reservacionesReductor(estado, accion) {
  switch (accion.tipo) {
    case 'cargaExitosa':
      return { ...estado, reservaciones: accion.reservaciones };
    case 'buscar':
      return { ...estado, buscar: accion.texto };
    case 'filtrarEstatus':
      return { ...estado, estatus: accion.estatus };
    case 'abrirFormulario':
      return { ...estado, editando: accion.reservacion };
    case 'cerrarFormulario':
      return { ...estado, editando: null };
    default:
      throw new Error(`Acción de reservaciones desconocida: ${accion.tipo}`);
  }
}
