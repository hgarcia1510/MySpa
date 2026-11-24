import {
  calcularPorcentaje, calcularRetencion, calcularRoi, calcularVariacion, completarSerieDiaria,
  estatusReservacion, formatearFechaBd, obtenerFechaAltaCliente, resumirCalificaciones,
} from '@myspa/compartido';

/*
 * Dashboard administrativo.
 * consultar(sql, valores) debe devolver un arreglo de filas: así el mismo código funciona con
 * MySQL (la API) o con otra base (las pruebas usan SQLite). Por eso aquí solo hay SQL estándar
 * (sin CONCAT_WS, DATE_SUB, etc.): las fechas del periodo se calculan en JavaScript.
 */

const canalesReservacion = ['Web', 'Sucursal'];
const numero = (valor) => Number(valor) || 0;
const redondear = (valor) => Math.round(numero(valor) * 100) / 100;
const soloDia = (fecha) => formatearFechaBd(fecha).slice(0, 10);

/** Periodo actual = últimos `dias` días contando hoy; el anterior es del mismo tamaño, justo antes. */
export function calcularPeriodo(dias, ahora = new Date()) {
  const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1); // mañana 00:00 (excluido)
  const inicio = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() - dias);
  const inicioAnterior = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() - dias);
  const ultimoDia = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() - 1);
  return {
    inicio: formatearFechaBd(inicio),
    fin: formatearFechaBd(fin),
    inicioAnterior: formatearFechaBd(inicioAnterior),
    ahora: formatearFechaBd(ahora),
    desde: soloDia(inicio),
    hasta: soloDia(ultimoDia),
  };
}

export async function obtenerDashboard(consultar, { dias = 30, idSucursal = null, ahora = new Date() } = {}) {
  const diasPeriodo = Math.min(Math.max(Math.trunc(numero(dias)) || 30, 1), 365);
  const sucursal = idSucursal ? numero(idSucursal) : null;
  const periodo = calcularPeriodo(diasPeriodo, ahora);
  const { inicio, fin, inicioAnterior } = periodo;

  // Filtro de sucursal: se aplica a todo lo que pasa por una sala (alias s)
  const filtro = sucursal ? ' AND s.idSucursal = ?' : '';
  const conFiltro = (...valores) => (sucursal ? [...valores, sucursal] : valores);

  const desdeServicios = `
    FROM servicio sv
    JOIN reservacion r ON r.idReservacion = sv.idReservacion
    JOIN sala s ON s.idSala = r.idSala`;
  const desdeReservaciones = `
    FROM reservacion r
    JOIN sala s ON s.idSala = r.idSala`;

  const [
    ingresosActuales, ingresosAnteriores, reservacionesAgrupadas, reservacionesAnteriores, citasPasadas, proximas,
    clientes, ventasSucursal, serieReservaciones, serieIngresos, serviciosPorCliente, topClientes,
    topTratamientos, topProductos, ocupacion, eventos, gastosPorCanal, gastosRecientes, calificaciones, comentarios,
  ] = await Promise.all([
    consultar(`SELECT COALESCE(SUM(sv.costo), 0) AS ingresos, COUNT(sv.idServicio) AS servicios ${desdeServicios}
      WHERE sv.fecha >= ? AND sv.fecha < ?${filtro}`, conFiltro(inicio, fin)),
    consultar(`SELECT COALESCE(SUM(sv.costo), 0) AS ingresos ${desdeServicios}
      WHERE sv.fecha >= ? AND sv.fecha < ?${filtro}`, conFiltro(inicioAnterior, inicio)),
    consultar(`SELECT r.estatus, r.canal, COUNT(*) AS total ${desdeReservaciones}
      WHERE r.fecha >= ? AND r.fecha < ?${filtro} GROUP BY r.estatus, r.canal`, conFiltro(inicio, fin)),
    consultar(`SELECT COUNT(*) AS total ${desdeReservaciones}
      WHERE r.fecha >= ? AND r.fecha < ?${filtro}`, conFiltro(inicioAnterior, inicio)),
    // Inasistencia: citas ya pasadas (no canceladas) que siguen Pendientes
    consultar(`SELECT COUNT(*) AS citasPasadas, COALESCE(SUM(CASE WHEN r.estatus = ? THEN 1 ELSE 0 END), 0) AS vencidas ${desdeReservaciones}
      WHERE r.fecha >= ? AND r.fecha < ? AND r.estatus <> ?${filtro}`,
    conFiltro(estatusReservacion.pendiente, inicio, periodo.ahora, estatusReservacion.cancelada)),
    consultar(`SELECT COUNT(*) AS total ${desdeReservaciones}
      WHERE r.estatus = ? AND r.fecha >= ?${filtro}`, conFiltro(estatusReservacion.pendiente, periodo.ahora)),
    consultar(`SELECT c.numeroUnico, c.estatus, p.genero FROM cliente c JOIN persona p ON p.idPersona = c.idPersona`, []),
    consultar(`SELECT su.idSucursal, su.nombre, COALESCE(SUM(sv.costo), 0) AS ingresos, COUNT(sv.idServicio) AS servicios ${desdeServicios}
      JOIN sucursal su ON su.idSucursal = s.idSucursal
      WHERE sv.fecha >= ? AND sv.fecha < ?${filtro} GROUP BY su.idSucursal, su.nombre ORDER BY ingresos DESC`, conFiltro(inicio, fin)),
    consultar(`SELECT SUBSTRING(r.fecha, 1, 10) AS dia, COUNT(*) AS reservaciones ${desdeReservaciones}
      WHERE r.fecha >= ? AND r.fecha < ?${filtro} GROUP BY SUBSTRING(r.fecha, 1, 10)`, conFiltro(inicio, fin)),
    consultar(`SELECT SUBSTRING(sv.fecha, 1, 10) AS dia, COALESCE(SUM(sv.costo), 0) AS ingresos ${desdeServicios}
      WHERE sv.fecha >= ? AND sv.fecha < ?${filtro} GROUP BY SUBSTRING(sv.fecha, 1, 10)`, conFiltro(inicio, fin)),
    consultar(`SELECT r.idCliente, COUNT(*) AS servicios ${desdeServicios}
      WHERE sv.fecha >= ? AND sv.fecha < ?${filtro} GROUP BY r.idCliente`, conFiltro(inicio, fin)),
    consultar(`SELECT c.idCliente, c.numeroUnico, p.nombre, p.apellidoPaterno, COUNT(sv.idServicio) AS servicios, COALESCE(SUM(sv.costo), 0) AS importe
      ${desdeServicios}
      JOIN cliente c ON c.idCliente = r.idCliente
      JOIN persona p ON p.idPersona = c.idPersona
      WHERE sv.fecha >= ? AND sv.fecha < ?${filtro}
      GROUP BY c.idCliente, c.numeroUnico, p.nombre, p.apellidoPaterno ORDER BY importe DESC LIMIT 5`, conFiltro(inicio, fin)),
    consultar(`SELECT t.idTratamiento, t.nombre, COUNT(st.idServicioTratamiento) AS veces, COALESCE(SUM(st.costo), 0) AS importe
      FROM servicioTratamiento st
      JOIN tratamiento t ON t.idTratamiento = st.idTratamiento
      JOIN servicio sv ON sv.idServicio = st.idServicio
      JOIN reservacion r ON r.idReservacion = sv.idReservacion
      JOIN sala s ON s.idSala = r.idSala
      WHERE sv.fecha >= ? AND sv.fecha < ?${filtro}
      GROUP BY t.idTratamiento, t.nombre ORDER BY veces DESC, importe DESC LIMIT 5`, conFiltro(inicio, fin)),
    consultar(`SELECT pr.idProducto, pr.nombre, pr.marca, COUNT(*) AS usos, COALESCE(SUM(stp.precioUso), 0) AS importe
      FROM servicioTratamientoProducto stp
      JOIN producto pr ON pr.idProducto = stp.idProducto
      JOIN servicioTratamiento st ON st.idServicioTratamiento = stp.idServicioTratamiento
      JOIN servicio sv ON sv.idServicio = st.idServicio
      JOIN reservacion r ON r.idReservacion = sv.idReservacion
      JOIN sala s ON s.idSala = r.idSala
      WHERE sv.fecha >= ? AND sv.fecha < ?${filtro}
      GROUP BY pr.idProducto, pr.nombre, pr.marca ORDER BY usos DESC, importe DESC LIMIT 5`, conFiltro(inicio, fin)),
    // Ocupación = reservaciones no canceladas / (horarios asignados × días del periodo)
    consultar(`SELECT s.idSala, s.nombre, su.nombre AS nombreSucursal,
        (SELECT COUNT(*) FROM salaHorario sh WHERE sh.idSala = s.idSala) AS horarios,
        (SELECT COUNT(*) FROM reservacion rs WHERE rs.idSala = s.idSala AND rs.estatus <> ? AND rs.fecha >= ? AND rs.fecha < ?) AS reservaciones
      FROM sala s JOIN sucursal su ON su.idSucursal = s.idSucursal
      WHERE s.estatus = 'Activo'${filtro} ORDER BY s.nombre`, conFiltro(estatusReservacion.cancelada, inicio, fin)),
    consultar(`SELECT tipo, enPwa, COUNT(*) AS total FROM eventoUso WHERE fecha >= ? AND fecha < ? GROUP BY tipo, enPwa`, [inicio, fin]),
    consultar(`SELECT canal, COALESCE(SUM(monto), 0) AS total FROM gastoMarketing
      WHERE fecha >= ? AND fecha <= ? GROUP BY canal ORDER BY total DESC`, [periodo.desde, periodo.hasta]),
    consultar(`SELECT idGasto, canal, concepto, monto, fecha FROM gastoMarketing
      WHERE fecha >= ? AND fecha <= ? ORDER BY fecha DESC, idGasto DESC LIMIT 10`, [periodo.desde, periodo.hasta]),
    consultar(`SELECT re.calificacion FROM resena re
      JOIN reservacion r ON r.idReservacion = re.idReservacion
      JOIN sala s ON s.idSala = r.idSala
      WHERE re.fecha >= ? AND re.fecha < ?${filtro}`, conFiltro(inicio, fin)),
    consultar(`SELECT re.idResena, re.calificacion, re.comentario, re.fecha, p.nombre, p.apellidoPaterno, s.nombre AS nombreSala
      FROM resena re
      JOIN reservacion r ON r.idReservacion = re.idReservacion
      JOIN sala s ON s.idSala = r.idSala
      JOIN cliente c ON c.idCliente = r.idCliente
      JOIN persona p ON p.idPersona = c.idPersona
      WHERE re.fecha >= ? AND re.fecha < ? AND re.comentario IS NOT NULL AND re.comentario <> ''${filtro}
      ORDER BY re.fecha DESC, re.idResena DESC LIMIT 5`, conFiltro(inicio, fin)),
  ]);

  // ---------- Indicadores ----------
  const ingresos = redondear(ingresosActuales[0]?.ingresos);
  const ingresosAnterior = redondear(ingresosAnteriores[0]?.ingresos);
  const servicios = numero(ingresosActuales[0]?.servicios);

  const totalPor = (campo, valor) => reservacionesAgrupadas.filter((fila) => fila[campo] === valor).reduce((suma, fila) => suma + numero(fila.total), 0);
  const reservaciones = reservacionesAgrupadas.reduce((suma, fila) => suma + numero(fila.total), 0);
  const reservacionesAnterior = numero(reservacionesAnteriores[0]?.total);
  const canceladas = totalPor('estatus', estatusReservacion.cancelada);

  const inicioMs = new Date(inicio.replace(' ', 'T')).getTime();
  const finMs = new Date(fin.replace(' ', 'T')).getTime();
  const clientesNuevos = clientes.filter((cliente) => {
    const alta = obtenerFechaAltaCliente(cliente.numeroUnico)?.getTime();
    return alta >= inicioMs && alta < finMs;
  }).length;
  const clientesActivos = clientes.filter((cliente) => cliente.estatus === 'Activo');

  // ---------- Marketing ----------
  const totalEventos = (tipo, soloPwa = false) =>
    eventos.filter((fila) => fila.tipo === tipo && (!soloPwa || numero(fila.enPwa) === 1)).reduce((suma, fila) => suma + numero(fila.total), 0);
  const visitas = totalEventos('visita');
  const visitasPwa = totalEventos('visita', true);
  const reservacionesWeb = totalPor('canal', 'Web');
  const gastoTotal = redondear(gastosPorCanal.reduce((suma, fila) => suma + numero(fila.total), 0));

  return {
    periodo: { dias: diasPeriodo, desde: periodo.desde, hasta: periodo.hasta, idSucursal: sucursal },
    indicadores: {
      ingresos,
      ingresosAnterior,
      variacionIngresos: calcularVariacion(ingresos, ingresosAnterior),
      servicios,
      ticketPromedio: servicios ? redondear(ingresos / servicios) : 0,
      reservaciones,
      reservacionesAnterior,
      variacionReservaciones: calcularVariacion(reservaciones, reservacionesAnterior),
      tasaCancelacion: calcularPorcentaje(canceladas, reservaciones),
      tasaInasistencia: calcularPorcentaje(citasPasadas[0]?.vencidas, citasPasadas[0]?.citasPasadas),
      clientesActivos: clientesActivos.length,
      clientesNuevos,
      proximasReservaciones: numero(proximas[0]?.total),
    },
    reservaciones: {
      porEstatus: Object.values(estatusReservacion).map((estatus) => {
        const total = totalPor('estatus', estatus);
        return { estatus, total, porcentaje: calcularPorcentaje(total, reservaciones) };
      }),
      porCanal: canalesReservacion.map((canal) => {
        const total = totalPor('canal', canal);
        return { canal, total, porcentaje: calcularPorcentaje(total, reservaciones) };
      }),
    },
    ventas: {
      porSucursal: ventasSucursal.map((fila) => ({
        idSucursal: numero(fila.idSucursal),
        nombre: fila.nombre,
        ingresos: redondear(fila.ingresos),
        servicios: numero(fila.servicios),
        participacion: calcularPorcentaje(fila.ingresos, ingresos),
      })),
      serieDiaria: completarSerieDiaria(
        [...serieReservaciones, ...serieIngresos].reduce((dias, fila) => {
          const existente = dias.find((dia) => dia.dia === fila.dia);
          if (existente) Object.assign(existente, fila.reservaciones !== undefined ? { reservaciones: fila.reservaciones } : { ingresos: fila.ingresos });
          else dias.push({ ...fila });
          return dias;
        }, []),
        periodo.desde, periodo.hasta, ['reservaciones', 'ingresos']
      ),
    },
    clientes: {
      retencion: calcularRetencion(serviciosPorCliente),
      porGenero: ['Femenino', 'Masculino', 'Otro'].map((genero) => {
        const total = clientesActivos.filter((cliente) => cliente.genero === genero).length;
        return { genero, total, porcentaje: calcularPorcentaje(total, clientesActivos.length) };
      }),
      topClientes: topClientes.map((fila) => ({
        idCliente: numero(fila.idCliente),
        numeroUnico: fila.numeroUnico,
        nombre: [fila.nombre, fila.apellidoPaterno].filter(Boolean).join(' '),
        servicios: numero(fila.servicios),
        importe: redondear(fila.importe),
      })),
    },
    comportamiento: {
      tratamientos: topTratamientos.map((fila) => ({ idTratamiento: numero(fila.idTratamiento), nombre: fila.nombre, veces: numero(fila.veces), importe: redondear(fila.importe) })),
      productos: topProductos.map((fila) => ({ idProducto: numero(fila.idProducto), nombre: fila.nombre, marca: fila.marca, usos: numero(fila.usos), importe: redondear(fila.importe) })),
      ocupacionSalas: ocupacion.map((fila) => {
        const capacidad = numero(fila.horarios) * diasPeriodo;
        return {
          idSala: numero(fila.idSala),
          nombre: fila.nombre,
          nombreSucursal: fila.nombreSucursal,
          horarios: numero(fila.horarios),
          reservaciones: numero(fila.reservaciones),
          capacidad,
          ocupacion: Math.min(calcularPorcentaje(fila.reservaciones, capacidad), 100),
        };
      }),
    },
    marketing: {
      visitas,
      visitasPwa,
      porcentajeVisitasPwa: calcularPorcentaje(visitasPwa, visitas),
      instalaciones: totalEventos('instalacion'),
      reservacionesWeb,
      conversion: calcularPorcentaje(reservacionesWeb, visitas),
      gastoTotal,
      gastoPorCanal: gastosPorCanal.map((fila) => ({ canal: fila.canal, total: redondear(fila.total) })),
      gastosRecientes: gastosRecientes.map((fila) => ({ ...fila, idGasto: numero(fila.idGasto), monto: redondear(fila.monto), fecha: String(fila.fecha).slice(0, 10) })),
      roi: calcularRoi(ingresos, gastoTotal),
      costoPorClienteNuevo: clientesNuevos && gastoTotal ? redondear(gastoTotal / clientesNuevos) : null,
    },
    feedback: {
      ...resumirCalificaciones(calificaciones),
      comentarios: comentarios.map((fila) => ({
        idResena: numero(fila.idResena),
        calificacion: numero(fila.calificacion),
        comentario: fila.comentario,
        fecha: fila.fecha,
        nombreCliente: [fila.nombre, fila.apellidoPaterno].filter(Boolean).join(' '),
        nombreSala: fila.nombreSala,
      })),
    },
  };
}
