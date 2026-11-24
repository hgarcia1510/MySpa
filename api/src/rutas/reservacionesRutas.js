import { Router } from 'express';
import { conexionBd } from '../config/baseDatos.js';
import { verificarToken, permitirRoles } from '../middlewares/autenticacion.js';
import { ErrorNegocio, lanzarSiHayErrores } from '../utilidades/errores.js';
import { enviarCorreoReservacion } from '../servicios/correoServicio.js';
import { obtenerDetalleServicio } from './serviciosRutas.js';
import { estatusReservacion, roles, tiposOperacionReservacion, validarCamposRequeridos } from '@myspa/compartido';

export const reservacionesRutas = Router();
reservacionesRutas.use(verificarToken);

const seleccion = `
  SELECT r.*, c.numeroUnico, c.correo,
         CONCAT_WS(' ', p.nombre, p.apellidoPaterno, p.apellidoMaterno) AS nombreCliente,
         s.nombre AS nombreSala, su.nombre AS nombreSucursal,
         sv.idServicio, sv.costo AS costoServicio,
         re.calificacion, re.comentario AS comentarioResena
  FROM reservacion r
  JOIN cliente c   ON c.idCliente = r.idCliente
  JOIN persona p   ON p.idPersona = c.idPersona
  JOIN sala s      ON s.idSala = r.idSala
  JOIN sucursal su ON su.idSucursal = s.idSucursal
  LEFT JOIN servicio sv ON sv.idReservacion = r.idReservacion
  LEFT JOIN resena re   ON re.idReservacion = r.idReservacion`;

const columnasBusqueda = ['r.idReservacion', 'r.fecha', 'r.estatus', 'c.numeroUnico', 'p.nombre', 'p.apellidoPaterno', 'p.apellidoMaterno', 's.nombre', 'su.nombre'];

async function obtenerReservacion(idReservacion) {
  const [filas] = await conexionBd.query(`${seleccion} WHERE r.idReservacion = ?`, [idReservacion]);
  if (!filas.length) throw new ErrorNegocio('Reservación no encontrada', 404);
  return filas[0];
}

/** Una sala no se puede reservar dos veces a la misma hora (las canceladas no cuentan). */
async function validarDisponibilidad(idSala, fecha, idReservacionActual = null) {
  const [ocupadas] = await conexionBd.query(
    `SELECT idReservacion FROM reservacion
     WHERE idSala = ? AND fecha = ? AND estatus <> ? AND idReservacion <> ?`,
    [idSala, fecha, estatusReservacion.cancelada, idReservacionActual ?? 0]
  );
  if (ocupadas.length) throw new ErrorNegocio('La sala ya está reservada en ese horario. Elige otra hora u otra sala.', 409);
}

/** Un cliente solo puede ver/cancelar sus propias reservaciones. */
function validarPropietario(peticion, reservacion) {
  if (peticion.sesion.rol === roles.cliente && reservacion.idCliente !== peticion.sesion.idCliente) {
    throw new ErrorNegocio('Esta reservación no te pertenece', 403);
  }
}

// RF 0705 - Despliegue (más reciente a más antigua) + RF 0702 Búsqueda — empleados
reservacionesRutas.get('/', permitirRoles(roles.empleado), async (peticion, respuesta) => {
  const { buscar = '', estatus } = peticion.query;
  const condiciones = [];
  const valores = [];
  if (buscar.trim()) {
    condiciones.push(`CONCAT_WS(' ', ${columnasBusqueda.join(', ')}) LIKE ?`);
    valores.push(`%${buscar.trim()}%`);
  }
  if (estatus) {
    condiciones.push('r.estatus = ?');
    valores.push(estatus);
  }
  const donde = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await conexionBd.query(`${seleccion}${donde} ORDER BY r.fecha DESC`, valores);
  respuesta.json(filas);
});

// RNF 0104 - Histórico del cliente
reservacionesRutas.get('/mias', permitirRoles(roles.cliente), async (peticion, respuesta) => {
  const [filas] = await conexionBd.query(`${seleccion} WHERE r.idCliente = ? ORDER BY r.fecha DESC`, [peticion.sesion.idCliente]);
  respuesta.json(filas);
});

reservacionesRutas.get('/:id', async (peticion, respuesta) => {
  const reservacion = await obtenerReservacion(peticion.params.id);
  validarPropietario(peticion, reservacion);
  respuesta.json(reservacion);
});

// Detalle con tratamientos, productos y costos (si ya se atendió)
reservacionesRutas.get('/:id/detalle', async (peticion, respuesta) => {
  const reservacion = await obtenerReservacion(peticion.params.id);
  validarPropietario(peticion, reservacion);
  const servicio = reservacion.idServicio ? await obtenerDetalleServicio(reservacion.idServicio) : null;
  respuesta.json({ ...reservacion, servicio });
});

// RF 0701 - Alta (cliente para sí mismo; empleado para cualquier cliente)
reservacionesRutas.post('/', async (peticion, respuesta) => {
  const esCliente = peticion.sesion.rol === roles.cliente;
  const datos = {
    fecha: peticion.body.fecha,
    idSala: peticion.body.idSala,
    idCliente: esCliente ? peticion.sesion.idCliente : peticion.body.idCliente,
    estatus: estatusReservacion.pendiente,
    canal: esCliente ? 'Web' : 'Sucursal', // Web = la hizo el cliente; Sucursal = la capturó un empleado
  };
  lanzarSiHayErrores(validarCamposRequeridos(datos, ['fecha', 'idSala', 'idCliente']));
  if (new Date(datos.fecha) < new Date()) throw new ErrorNegocio('La fecha de la reservación ya pasó');
  await validarDisponibilidad(datos.idSala, datos.fecha);

  const [resultado] = await conexionBd.query('INSERT INTO reservacion SET ?', [datos]);
  const reservacion = await obtenerReservacion(resultado.insertId);
  await enviarCorreoReservacion(reservacion, tiposOperacionReservacion.nueva);
  respuesta.status(201).json(reservacion);
});

// RF 0703 - Modificación: solo empleados
reservacionesRutas.put('/:id', permitirRoles(roles.empleado), async (peticion, respuesta) => {
  const permitidas = ['fecha', 'idSala', 'estatus'];
  const datos = Object.fromEntries(permitidas.filter((campo) => peticion.body[campo] !== undefined).map((campo) => [campo, peticion.body[campo]]));
  if (!Object.keys(datos).length) throw new ErrorNegocio('No hay datos para actualizar');
  const actual = await obtenerReservacion(peticion.params.id);
  const estatusFinal = datos.estatus ?? actual.estatus;
  if (estatusFinal !== estatusReservacion.cancelada) {
    await validarDisponibilidad(datos.idSala ?? actual.idSala, datos.fecha ?? actual.fecha, actual.idReservacion);
  }
  await conexionBd.query('UPDATE reservacion SET ? WHERE idReservacion = ?', [datos, peticion.params.id]);
  respuesta.json(await obtenerReservacion(peticion.params.id));
});

// RF 0704 - Cancelación (cliente dueño o empleado)
reservacionesRutas.patch('/:id/cancelar', async (peticion, respuesta) => {
  const reservacion = await obtenerReservacion(peticion.params.id);
  validarPropietario(peticion, reservacion);
  if (reservacion.estatus !== estatusReservacion.pendiente) {
    throw new ErrorNegocio(`No se puede cancelar una reservación ${reservacion.estatus.toLowerCase()}`);
  }
  await conexionBd.query('UPDATE reservacion SET estatus = ? WHERE idReservacion = ?', [estatusReservacion.cancelada, reservacion.idReservacion]);
  const reservacionCancelada = { ...reservacion, estatus: estatusReservacion.cancelada };
  await enviarCorreoReservacion(reservacionCancelada, tiposOperacionReservacion.cancelacion);
  respuesta.json(reservacionCancelada);
});