export const catalogoInicial = {
  registros: [],
  cargando: true,
  guardando: false,
  buscar: '',
  mostrarInactivos: false,
  registroEditado: null, // null = cerrado, {} = alta
  error: '',
  salaHorarios: null,
};

/** Estado de la pantalla genérica de catálogos (PaginaCatalogo). */
export function catalogoReductor(estado, accion) {
  switch (accion.tipo) {
    case 'cargaExitosa':
      return { ...estado, registros: accion.registros, cargando: false };
    case 'cargaFallida':
      return { ...estado, cargando: false };
    case 'buscar':
      return { ...estado, buscar: accion.texto };
    case 'mostrarInactivos':
      return { ...estado, mostrarInactivos: accion.valor };
    case 'abrirFormulario':
      return { ...estado, registroEditado: accion.registro, error: '' };
    case 'cambiarCampo':
      return { ...estado, registroEditado: { ...estado.registroEditado, [accion.nombre]: accion.valor } };
    case 'cerrarFormulario':
      return { ...estado, registroEditado: null };
    case 'guardar':
      return { ...estado, guardando: true, error: '' };
    case 'guardadoExitoso':
      return { ...estado, guardando: false, registroEditado: null };
    case 'guardadoFallido':
      return { ...estado, guardando: false, error: accion.mensaje };
    case 'abrirHorarios':
      return { ...estado, salaHorarios: accion.sala };
    case 'cerrarHorarios':
      return { ...estado, salaHorarios: null };
    default:
      throw new Error(`Acción de catálogo desconocida: ${accion.tipo}`);
  }
}
