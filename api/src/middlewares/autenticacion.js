import jwt from 'jsonwebtoken';

const secreto = () => process.env.JWT_SECRETO ?? 'secretoDesarrollo';

export function generarToken(datosSesion) {
  return jwt.sign(datosSesion, secreto(), { expiresIn: '8h' });
}

export function verificarToken(peticion, respuesta, siguiente) {
  const [, token] = (peticion.headers.authorization ?? '').split(' ');
  if (!token) return respuesta.status(401).json({ mensaje: 'Debes iniciar sesión' });
  try {
    peticion.sesion = jwt.verify(token, secreto());
    siguiente();
  } catch {
    respuesta.status(401).json({ mensaje: 'Sesión expirada, inicia sesión de nuevo' });
  }
}

/** Uso: permitirRoles('Empleado') o permitirRoles('Empleado', 'Cliente') */
export const permitirRoles = (...rolesPermitidos) => (peticion, respuesta, siguiente) => {
  if (!rolesPermitidos.includes(peticion.sesion?.rol)) {
    return respuesta.status(403).json({ mensaje: 'No tienes permiso para esta operación' });
  }
  siguiente();
};