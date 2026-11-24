// Estado de la PWA: conexión, instalación, actualizaciones y disponibilidad del servidor.
export const accionesPwa = {
  cambiarConexion: 'pwa/cambiarConexion',
  instalacionDisponible: 'pwa/instalacionDisponible',
  instalacionUsada: 'pwa/instalacionUsada',
  instalada: 'pwa/instalada',
  actualizacionDisponible: 'pwa/actualizacionDisponible',
  listaSinConexion: 'pwa/listaSinConexion',
  marcarServidor: 'pwa/marcarServidor',
};

export const estadoInicialPwa = {
  enLinea: true,
  instalable: false,
  instalada: false,
  actualizacionDisponible: false,
  funcionaSinConexion: false,
  servidorDisponible: true,
};

export function crearEstadoPwa({ enLinea = true, instalada = false } = {}) {
  return { ...estadoInicialPwa, enLinea, instalada };
}

export function pwaReductor(estado, accion) {
  switch (accion.type) {
    case accionesPwa.cambiarConexion:
      return { ...estado, enLinea: accion.enLinea };
    case accionesPwa.instalacionDisponible:
      return { ...estado, instalable: !estado.instalada };
    case accionesPwa.instalacionUsada:
      return { ...estado, instalable: false };
    case accionesPwa.instalada:
      return { ...estado, instalada: true, instalable: false };
    case accionesPwa.actualizacionDisponible:
      return { ...estado, actualizacionDisponible: true };
    case accionesPwa.listaSinConexion:
      return { ...estado, funcionaSinConexion: true };
    case accionesPwa.marcarServidor:
      return { ...estado, servidorDisponible: accion.disponible };
    default:
      return estado;
  }
}
