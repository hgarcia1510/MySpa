export class ErrorNegocio extends Error {
  constructor(mensaje, codigoEstado = 400) {
    super(mensaje);
    this.codigoEstado = codigoEstado;
  }
}

/** Valida y lanza un ErrorNegocio con todos los mensajes juntos. */
export function lanzarSiHayErrores(errores) {
  if (errores.length) throw new ErrorNegocio(errores.join('. '));
}

export function manejarErrores(error, peticion, respuesta, siguiente) {
  if (error.code === 'ER_DUP_ENTRY') {
    return respuesta.status(409).json({ mensaje: 'Ya existe un registro con ese dato (por ejemplo, el nombre de usuario)' });
  }
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return respuesta.status(409).json({ mensaje: 'No se puede eliminar: el registro está en uso' });
  }
  const codigoEstado = error.codigoEstado ?? 500;
  if (codigoEstado === 500) console.error(error);
  respuesta.status(codigoEstado).json({ mensaje: codigoEstado === 500 ? 'Error interno del servidor' : error.message });
}