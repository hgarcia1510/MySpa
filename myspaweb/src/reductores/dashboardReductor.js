// Dashboard administrativo: datos, filtros (periodo y sucursal) y modal de gasto de marketing.
export const periodosDashboard = [
  { dias: 7, etiqueta: 'Últimos 7 días' },
  { dias: 30, etiqueta: 'Últimos 30 días' },
  { dias: 90, etiqueta: 'Últimos 90 días' },
  { dias: 365, etiqueta: 'Último año' },
];

export const accionesDashboard = {
  cargaInicio: 'dashboard/cargaInicio',
  cargaExitosa: 'dashboard/cargaExitosa',
  cargaFallida: 'dashboard/cargaFallida',
  cambiarDias: 'dashboard/cambiarDias',
  cambiarSucursal: 'dashboard/cambiarSucursal',
  sucursalesCargadas: 'dashboard/sucursalesCargadas',
  abrirGasto: 'dashboard/abrirGasto',
  cerrarGasto: 'dashboard/cerrarGasto',
};

export const estadoInicialDashboard = {
  datos: null,
  cargando: true,
  error: '',
  dias: 30,
  idSucursal: '',
  sucursales: [],
  registrandoGasto: false,
};

export function dashboardReductor(estado, accion) {
  switch (accion.type) {
    case accionesDashboard.cargaInicio:
      return { ...estado, cargando: true, error: '' };
    case accionesDashboard.cargaExitosa:
      return { ...estado, datos: accion.datos, cargando: false, error: '' };
    case accionesDashboard.cargaFallida:
      return { ...estado, cargando: false, error: accion.error };
    case accionesDashboard.cambiarDias:
      return { ...estado, dias: Number(accion.dias) };
    case accionesDashboard.cambiarSucursal:
      return { ...estado, idSucursal: accion.idSucursal };
    case accionesDashboard.sucursalesCargadas:
      return { ...estado, sucursales: accion.sucursales };
    case accionesDashboard.abrirGasto:
      return { ...estado, registrandoGasto: true };
    case accionesDashboard.cerrarGasto:
      return { ...estado, registrandoGasto: false };
    default:
      return estado;
  }
}
