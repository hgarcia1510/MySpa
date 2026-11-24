// Sesión del usuario (quién inició sesión y con qué rol).
export const accionesSesion = {
  iniciar: 'sesion/iniciar',
  cerrar: 'sesion/cerrar',
};

export const estadoInicialSesion = { sesion: null };

/** Estado inicial leído de localStorage.sesionMySpa (si existe y es válido). */
export function crearEstadoSesion(almacen = globalThis.localStorage) {
  try {
    return { sesion: JSON.parse(almacen?.getItem('sesionMySpa') ?? 'null') };
  } catch {
    return estadoInicialSesion;
  }
}

export function sesionReductor(estado, accion) {
  switch (accion.type) {
    case accionesSesion.iniciar:
      return { ...estado, sesion: accion.sesion };
    case accionesSesion.cerrar:
      return { ...estado, sesion: null };
    default:
      return estado;
  }
}
