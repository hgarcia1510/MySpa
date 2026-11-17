import { generos } from './constantes.js';

const expresionRfc = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
const expresionCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const expresionTelefono = /^\d{10}$/;

export const validarRfc = (rfc) => expresionRfc.test(String(rfc ?? '').trim());
export const validarCorreo = (correo) => expresionCorreo.test(String(correo ?? '').trim());
export const validarTelefono = (telefono) => expresionTelefono.test(String(telefono ?? '').trim());

function estaVacio(valor) {
  return valor === undefined || valor === null || String(valor).trim() === '';
}

export function validarCamposRequeridos(datos, campos) {
  return campos.filter((campo) => estaVacio(datos[campo])).map((campo) => `El campo ${campo} es obligatorio`);
}

export function validarPersona(datos) {
  const errores = validarCamposRequeridos(datos, ['nombre', 'apellidoPaterno', 'genero']);
  if (datos.genero && !generos.includes(datos.genero)) errores.push('Género no válido');
  if (!estaVacio(datos.rfc) && !validarRfc(datos.rfc)) errores.push('RFC no válido');
  if (!estaVacio(datos.telefono) && !validarTelefono(datos.telefono)) errores.push('El teléfono debe tener 10 dígitos');
  return errores;
}

export function validarEmpleado(datos, { esAlta = true } = {}) {
  const errores = validarPersona(datos);
  errores.push(...validarCamposRequeridos(datos, ['rfc', 'puesto', 'nombreUsuario']));
  if (esAlta) errores.push(...validarCamposRequeridos(datos, ['contrasenia']));
  return errores;
}

export function validarCliente(datos, { esAlta = true } = {}) {
  const errores = validarPersona(datos);
  errores.push(...validarCamposRequeridos(datos, ['correo', 'nombreUsuario']));
  if (esAlta) errores.push(...validarCamposRequeridos(datos, ['contrasenia']));
  if (!estaVacio(datos.correo) && !validarCorreo(datos.correo)) errores.push('Correo no válido');
  return errores;
}

export function validarHorario({ horaInicio, horaFin }) {
  const errores = validarCamposRequeridos({ horaInicio, horaFin }, ['horaInicio', 'horaFin']);
  if (!errores.length && horaInicio >= horaFin) errores.push('La hora de inicio debe ser menor a la hora de término');
  return errores;
}