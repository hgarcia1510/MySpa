// Reductores de las pantallas de listados: reservaciones (empleado), mis reservaciones (cliente),
// catálogo de salas y servicios.

// ---------- Reservaciones (empleado) ----------
export const accionesReservaciones = {
  cargadas: 'reservaciones/cargadas',
  cambiarBusqueda: 'reservaciones/cambiarBusqueda',
  cambiarEstatus: 'reservaciones/cambiarEstatus',
  editar: 'reservaciones/editar',
  cerrarEdicion: 'reservaciones/cerrarEdicion',
};

export const estadoInicialReservaciones = { reservaciones: null, buscar: '', estatus: '', editando: null };

export function reservacionesReductor(estado, accion) {
  switch (accion.type) {
    case accionesReservaciones.cargadas:
      return { ...estado, reservaciones: accion.reservaciones };
    case accionesReservaciones.cambiarBusqueda:
      return { ...estado, buscar: accion.buscar };
    case accionesReservaciones.cambiarEstatus:
      return { ...estado, estatus: accion.estatus };
    case accionesReservaciones.editar:
      return { ...estado, editando: accion.reservacion ?? {} };
    case accionesReservaciones.cerrarEdicion:
      return { ...estado, editando: null };
    default:
      return estado;
  }
}

// ---------- Mis reservaciones (cliente) ----------
export const accionesMisReservaciones = {
  cargadas: 'misReservaciones/cargadas',
  mostrarDetalle: 'misReservaciones/mostrarDetalle',
  cerrarDetalle: 'misReservaciones/cerrarDetalle',
  abrirCalificacion: 'misReservaciones/abrirCalificacion',
  cerrarCalificacion: 'misReservaciones/cerrarCalificacion',
  resenaGuardada: 'misReservaciones/resenaGuardada',
};

export const estadoInicialMisReservaciones = { reservaciones: null, detalle: null, calificando: null };

export function misReservacionesReductor(estado, accion) {
  switch (accion.type) {
    case accionesMisReservaciones.cargadas:
      return { ...estado, reservaciones: accion.reservaciones };
    case accionesMisReservaciones.mostrarDetalle:
      return { ...estado, detalle: accion.detalle };
    case accionesMisReservaciones.cerrarDetalle:
      return { ...estado, detalle: null };
    case accionesMisReservaciones.abrirCalificacion:
      return { ...estado, calificando: accion.reservacion };
    case accionesMisReservaciones.cerrarCalificacion:
      return { ...estado, calificando: null };
    case accionesMisReservaciones.resenaGuardada:
      // Pone la calificación en la reservación sin volver a pedir la lista a la API
      return {
        ...estado,
        calificando: null,
        reservaciones: (estado.reservaciones ?? []).map((reservacion) =>
          reservacion.idReservacion === accion.idReservacion
            ? { ...reservacion, calificacion: accion.calificacion, comentarioResena: accion.comentario ?? null }
            : reservacion
        ),
      };
    default:
      return estado;
  }
}

// ---------- Catálogo de salas ----------
export const accionesSalas = {
  sucursalesCargadas: 'salas/sucursalesCargadas',
  salasCargadas: 'salas/salasCargadas',
  cambiarSucursal: 'salas/cambiarSucursal',
  cambiarBusqueda: 'salas/cambiarBusqueda',
  abrirReservacion: 'salas/abrirReservacion',
  cerrarReservacion: 'salas/cerrarReservacion',
  abrirMapa: 'salas/abrirMapa',
  cerrarMapa: 'salas/cerrarMapa',
};

export const estadoInicialSalas = { sucursales: [], salas: null, idSucursal: '', buscar: '', salaReservando: null, salaMapa: null };

export function salasReductor(estado, accion) {
  switch (accion.type) {
    case accionesSalas.sucursalesCargadas:
      return { ...estado, sucursales: accion.sucursales };
    case accionesSalas.salasCargadas:
      return { ...estado, salas: accion.salas };
    case accionesSalas.cambiarSucursal:
      return { ...estado, idSucursal: accion.idSucursal };
    case accionesSalas.cambiarBusqueda:
      return { ...estado, buscar: accion.buscar };
    case accionesSalas.abrirReservacion:
      return { ...estado, salaReservando: accion.sala };
    case accionesSalas.cerrarReservacion:
      return { ...estado, salaReservando: null };
    case accionesSalas.abrirMapa:
      return { ...estado, salaMapa: accion.sala };
    case accionesSalas.cerrarMapa:
      return { ...estado, salaMapa: null };
    default:
      return estado;
  }
}

// ---------- Servicios (empleado) ----------
export const accionesServicios = {
  cargados: 'servicios/cargados',
  cambiarBusqueda: 'servicios/cambiarBusqueda',
  detalleInicio: 'servicios/detalleInicio',
  detalleCargado: 'servicios/detalleCargado',
  detalleFallido: 'servicios/detalleFallido',
};

export const estadoInicialServicios = { servicios: null, buscar: '', servicio: null, cargandoDetalle: false };

export function serviciosReductor(estado, accion) {
  switch (accion.type) {
    case accionesServicios.cargados:
      return { ...estado, servicios: accion.servicios };
    case accionesServicios.cambiarBusqueda:
      return { ...estado, buscar: accion.buscar };
    case accionesServicios.detalleInicio:
      return { ...estado, cargandoDetalle: true };
    case accionesServicios.detalleCargado:
      return { ...estado, servicio: accion.servicio, cargandoDetalle: false };
    case accionesServicios.detalleFallido:
      return { ...estado, servicio: null, cargandoDetalle: false };
    default:
      return estado;
  }
}
