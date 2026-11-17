const vocales = 'AEIOU';

export function normalizarTexto(texto = '') {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * RF 0102 - Número de empleado: 'E' + 4 primeras letras del RFC + timestamp.
 * La unicidad se garantiza además con un UNIQUE en la BD y reintento en la API.
 */
export function generarNumeroEmpleado(rfc, marcaTiempo = Date.now()) {
  const rfcNormalizado = normalizarTexto(rfc);
  if (rfcNormalizado.length < 4) {
    throw new Error('El RFC debe tener al menos 4 caracteres para generar el número de empleado');
  }
  return `E${rfcNormalizado.slice(0, 4)}${marcaTiempo}`;
}

/**
 * RF 0202 - Letras del número único de cliente.
 * Con RFC: sus 4 primeras letras. Sin RFC:
 *  1. Primera letra del apellido paterno
 *  2. Primera vocal interna del apellido paterno (X si no hay)
 *  3. Primera letra del apellido materno (X si no hay)
 *  4. Primera letra del primer nombre
 */
export function obtenerLetrasCliente({ rfc, nombre, apellidoPaterno, apellidoMaterno }) {
  const rfcNormalizado = normalizarTexto(rfc);
  if (rfcNormalizado.length >= 4) return rfcNormalizado.slice(0, 4);

  const paterno = normalizarTexto(apellidoPaterno);
  const materno = normalizarTexto(apellidoMaterno);
  const primerNombre = normalizarTexto(nombre).split(/\s+/)[0] ?? '';

  const primeraVocalInterna = [...paterno.slice(1)].find((letra) => vocales.includes(letra)) ?? 'X';

  return `${paterno[0] ?? 'X'}${primeraVocalInterna}${materno[0] ?? 'X'}${primerNombre[0] ?? 'X'}`;
}

export function generarNumeroCliente(datosCliente, marcaTiempo = Date.now()) {
  return `${obtenerLetrasCliente(datosCliente)}${marcaTiempo}`;
}
