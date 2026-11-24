// Pantalla genérica de catálogo (PaginaCatalogo): listado, búsqueda, formulario y horarios de sala.
export const accionesCatalogo = {
  cargaExitosa: 'catalogo/cargaExitosa',
  cargaFallida: 'catalogo/cargaFallida',
  cambiarBusqueda: 'catalogo/cambiarBusqueda',
  alternarInactivos: 'catalogo/alternarInactivos',
  abrirFormulario: 'catalogo/abrirFormulario',
  cerrarFormulario: 'catalogo/cerrarFormulario',
  cambiarCampo: 'catalogo/cambiarCampo',
  guardarInicio: 'catalogo/guardarInicio',
  guardarExito: 'catalogo/guardarExito',
  guardarError: 'catalogo/guardarError',
  abrirHorarios: 'catalogo/abrirHorarios',
  cerrarHorarios: 'catalogo/cerrarHorarios',
};

export const estadoInicialCatalogo = {
  registros: [],
  cargando: true,
  guardando: false,
  buscar: '',
  mostrarInactivos: false,
  registroEditado: null, // null = formulario cerrado, {} = alta, registro = edición
  error: '',
  salaHorarios: null,
};

export function catalogoReductor(estado, accion) {
  switch (accion.type) {
    case accionesCatalogo.cargaExitosa:
      return { ...estado, registros: accion.registros, cargando: false };
    case accionesCatalogo.cargaFallida:
      return { ...estado, cargando: false };
    case accionesCatalogo.cambiarBusqueda:
      return { ...estado, buscar: accion.buscar };
    case accionesCatalogo.alternarInactivos:
      return { ...estado, mostrarInactivos: !estado.mostrarInactivos };
    case accionesCatalogo.abrirFormulario:
      return { ...estado, registroEditado: accion.registro ?? {}, error: '', guardando: false };
    case accionesCatalogo.cerrarFormulario:
      return { ...estado, registroEditado: null, error: '', guardando: false };
    case accionesCatalogo.cambiarCampo:
      if (!estado.registroEditado) return estado;
      return { ...estado, registroEditado: { ...estado.registroEditado, [accion.campo]: accion.valor } };
    case accionesCatalogo.guardarInicio:
      return { ...estado, guardando: true, error: '' };
    case accionesCatalogo.guardarExito:
      return { ...estado, guardando: false, registroEditado: null, error: '' };
    case accionesCatalogo.guardarError:
      return { ...estado, guardando: false, error: accion.error };
    case accionesCatalogo.abrirHorarios:
      return { ...estado, salaHorarios: accion.sala };
    case accionesCatalogo.cerrarHorarios:
      return { ...estado, salaHorarios: null };
    default:
      return estado;
  }
}
