/**
 * Cálculos del Dashboard administrativo (funciones puras).
 * Los usa la API para armar los indicadores y se pueden probar sin base de datos.
 */

const redondear = (valor, decimales = 2) => {
  const factor = 10 ** decimales;
  return Math.round((Number(valor) || 0) * factor) / factor;
};

/** Porcentaje con un decimal: calcularPorcentaje(1, 3) = 33.3. Si el total es 0 devuelve 0. */
export function calcularPorcentaje(parte, total) {
  const totalNumero = Number(total) || 0;
  if (!totalNumero) return 0;
  return redondear(((Number(parte) || 0) / totalNumero) * 100, 1);
}

/** Variación % contra el periodo anterior (un decimal). null si no hay base de comparación. */
export function calcularVariacion(actual, anterior) {
  const anteriorNumero = Number(anterior) || 0;
  if (!anteriorNumero) return null;
  return redondear((((Number(actual) || 0) - anteriorNumero) / anteriorNumero) * 100, 1);
}

/** Retorno de la inversión: (ingresos − gasto) / gasto con 2 decimales. null si no hubo gasto. */
export function calcularRoi(ingresos, gasto) {
  const gastoNumero = Number(gasto) || 0;
  if (!gastoNumero) return null;
  return redondear(((Number(ingresos) || 0) - gastoNumero) / gastoNumero, 2);
}

/**
 * Retención de clientes a partir de cuántos servicios recibió cada uno.
 * Acepta números ([2, 1, 3]) o filas ([{ servicios: 2 }, …]).
 */
export function calcularRetencion(serviciosPorCliente = []) {
  const conteos = serviciosPorCliente
    .map((elemento) => Number(typeof elemento === 'object' && elemento !== null ? elemento.servicios : elemento) || 0)
    .filter((servicios) => servicios > 0);
  const clientesAtendidos = conteos.length;
  const clientesRecurrentes = conteos.filter((servicios) => servicios >= 2).length;
  const totalServicios = conteos.reduce((suma, servicios) => suma + servicios, 0);
  return {
    clientesAtendidos,
    clientesRecurrentes,
    tasaRetencion: calcularPorcentaje(clientesRecurrentes, clientesAtendidos),
    frecuenciaPromedio: clientesAtendidos ? redondear(totalServicios / clientesAtendidos, 2) : 0,
  };
}

/**
 * RF 0202: el número único termina con el timestamp (13 dígitos) del alta del cliente.
 * Devuelve la fecha de alta o null si el número no lo trae.
 */
export function obtenerFechaAltaCliente(numeroUnico) {
  const coincidencia = String(numeroUnico ?? '').match(/(\d{13})$/);
  if (!coincidencia) return null;
  const fecha = new Date(Number(coincidencia[1]));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * Resumen de calificaciones (1 a 5). Acepta números o filas ({ calificacion }).
 * satisfaccion = % de calificaciones de 4 y 5 estrellas.
 */
export function resumirCalificaciones(lista = []) {
  const calificaciones = lista
    .map((elemento) => Number(typeof elemento === 'object' && elemento !== null ? elemento.calificacion : elemento))
    .filter((calificacion) => Number.isInteger(calificacion) && calificacion >= 1 && calificacion <= 5);
  const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  calificaciones.forEach((calificacion) => { distribucion[calificacion] += 1; });
  const total = calificaciones.length;
  const suma = calificaciones.reduce((acumulado, calificacion) => acumulado + calificacion, 0);
  return {
    total,
    promedio: total ? redondear(suma / total, 1) : 0,
    distribucion,
    satisfaccion: calcularPorcentaje(distribucion[4] + distribucion[5], total),
  };
}

const sumarDia = (diaTexto) => {
  const [anio, mes, dia] = diaTexto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + 1));
  return fecha.toISOString().slice(0, 10);
};

/**
 * Serie diaria completa entre desde y hasta (YYYY-MM-DD, ambos incluidos).
 * filas: [{ dia: 'YYYY-MM-DD', reservaciones: 3 }, …]; los días sin datos se rellenan con 0.
 */
export function completarSerieDiaria(filas = [], desde, hasta, campos = []) {
  const porDia = new Map(filas.map((fila) => [String(fila.dia).slice(0, 10), fila]));
  const serie = [];
  for (let dia = desde; dia <= hasta; dia = sumarDia(dia)) {
    const fila = porDia.get(dia);
    serie.push(Object.fromEntries([['dia', dia], ...campos.map((campo) => [campo, Number(fila?.[campo]) || 0])]));
  }
  return serie;
}
