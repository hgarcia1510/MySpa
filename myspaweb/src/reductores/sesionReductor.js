/** Estado de la sesión: null = sin sesión, o los datos del usuario que entró. */
export function sesionReductor(sesion, accion) {
  switch (accion.tipo) {
    case 'iniciar':
      return accion.sesion;
    case 'cerrar':
      return null;
    default:
      throw new Error(`Acción de sesión desconocida: ${accion.tipo}`);
  }
}
