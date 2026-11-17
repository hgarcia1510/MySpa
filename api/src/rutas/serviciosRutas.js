import { Router } from 'express';
import { conexionBd, enTransaccion } from '../config/baseDatos.js';
import { verificarToken, permitirRoles } from '../middlewares/autenticacion.js';
import { ErrorNegocio, lanzarSiHayErrores } from '../utilidades/errores.js';
import { calcularCostoServicio, calcularCostoTratamiento, estatusReservacion, roles, validarCamposRequeridos } from '@myspa/compartido';

export const serviciosRutas = Router();
serviciosRutas.use(verificarToken, permitirRoles(roles.empleado));

const seleccion = `
  SELECT sv.*, r.fecha AS fechaReservacion, r.estatus AS estatusReservacion,
         CONCAT_WS(' ', pc.nombre, pc.apellidoPaterno) AS nombreCliente, c.numeroUnico,
         CONCAT_WS(' ', pe.nombre, pe.apellidoPaterno) AS nombreEmpleado, e.numeroEmpleado,
         s.nombre AS nombreSala
  FROM servicio sv
  JOIN reservacion r ON r.idReservacion = sv.idReservacion
  JOIN cliente c     ON c.idCliente = r.idCliente
  JOIN persona pc    ON pc.idPersona = c.idPersona
  JOIN empleado e    ON e.idEmpleado = sv.idEmpleado
  JOIN persona pe    ON pe.idPersona = e.idPersona
  JOIN sala s        ON s.idSala = r.idSala`;

const columnasBusqueda = ['sv.idServicio', 'sv.fecha', 'sv.costo', 'pc.nombre', 'pc.apellidoPaterno', 'c.numeroUnico', 'pe.nombre', 'pe.apellidoPaterno', 'e.numeroEmpleado', 's.nombre'];

/**
 * RF 0905 - Maestro-Detalle: Servicio -> Tratamientos -> Productos, con costos en cada nivel.
 * Se exporta porque el histórico del cliente también lo usa.
 */
export async function obtenerDetalleServicio(idServicio, conexion = conexionBd) {
  const [servicios] = await conexion.query(`${seleccion} WHERE sv.idServicio = ?`, [idServicio]);
  if (!servicios.length) throw new ErrorNegocio('Servicio no encontrado', 404);

  const [tratamientos] = await conexion.query(
    `SELECT st.idServicioTratamiento, st.costo, t.idTratamiento, t.nombre, t.descripcion
     FROM servicioTratamiento st JOIN tratamiento t ON t.idTratamiento = st.idTratamiento
     WHERE st.idServicio = ?`,
    [idServicio]
  );
  const [productos] = await conexion.query(
    `SELECT stp.idServicioTratamiento, stp.precioUso, pr.idProducto, pr.nombre, pr.marca
     FROM servicioTratamientoProducto stp
     JOIN servicioTratamiento st ON st.idServicioTratamiento = stp.idServicioTratamiento
     JOIN producto pr ON pr.idProducto = stp.idProducto
     WHERE st.idServicio = ?`,
    [idServicio]
  );

  const tratamientosConProductos = tratamientos.map((tratamiento) => ({
    ...tratamiento,
    productos: productos.filter((producto) => producto.idServicioTratamiento === tratamiento.idServicioTratamiento),
  }));
  return { ...servicios[0], tratamientos: tratamientosConProductos };
}

async function recalcularCostoServicio(conexion, idServicio) {
  const { tratamientos } = await obtenerDetalleServicio(idServicio, conexion);
  await conexion.query('UPDATE servicio SET costo = ? WHERE idServicio = ?', [calcularCostoServicio(tratamientos), idServicio]);
}

// RF 0902 / 0905 / 1005 - Búsqueda y despliegue
serviciosRutas.get('/', async (peticion, respuesta) => {
  const { buscar = '' } = peticion.query;
  const donde = buscar.trim() ? ` WHERE CONCAT_WS(' ', ${columnasBusqueda.join(', ')}) LIKE ?` : '';
  const [filas] = await conexionBd.query(`${seleccion}${donde} ORDER BY sv.fecha DESC`, buscar.trim() ? [`%${buscar.trim()}%`] : []);
  respuesta.json(filas);
});

serviciosRutas.get('/:id/detalle', async (peticion, respuesta) => {
  respuesta.json(await obtenerDetalleServicio(peticion.params.id));
});

serviciosRutas.get('/:id', async (peticion, respuesta) => {
  respuesta.json(await obtenerDetalleServicio(peticion.params.id));
});

// RF 0901 - Alta de servicio (marca la reservación como Atendida)
serviciosRutas.post('/', async (peticion, respuesta) => {
  const datos = {
    fecha: peticion.body.fecha,
    idReservacion: peticion.body.idReservacion,
    idEmpleado: peticion.body.idEmpleado ?? peticion.sesion.idEmpleado,
  };
  lanzarSiHayErrores(validarCamposRequeridos(datos, ['fecha', 'idReservacion', 'idEmpleado']));
  const idServicio = await enTransaccion(async (conexion) => {
    const [resultado] = await conexion.query('INSERT INTO servicio SET ?', [datos]);
    await conexion.query('UPDATE reservacion SET estatus = ? WHERE idReservacion = ?', [estatusReservacion.atendida, datos.idReservacion]);
    return resultado.insertId;
  });
  respuesta.status(201).json(await obtenerDetalleServicio(idServicio));
});

// RF 0903 / 1003 - Modificación (fecha y empleado; la reservación es integridad referencial)
serviciosRutas.put('/:id', async (peticion, respuesta) => {
  const datos = Object.fromEntries(['fecha', 'idEmpleado'].filter((campo) => peticion.body[campo]).map((campo) => [campo, peticion.body[campo]]));
  if (!Object.keys(datos).length) throw new ErrorNegocio('No hay datos para actualizar');
  await conexionBd.query('UPDATE servicio SET ? WHERE idServicio = ?', [datos, peticion.params.id]);
  respuesta.json(await obtenerDetalleServicio(peticion.params.id));
});

// RF 0904 / 1004 - Eliminación física (cascada a tratamientos y productos)
serviciosRutas.delete('/:id', async (peticion, respuesta) => {
  await conexionBd.query('DELETE FROM servicio WHERE idServicio = ?', [peticion.params.id]);
  respuesta.json({ mensaje: 'Servicio eliminado' });
});

// RF 1001 - Agregar tratamiento al servicio con sus productos
serviciosRutas.post('/:id/tratamientos', async (peticion, respuesta) => {
  const { idTratamiento, idsProducto = [] } = peticion.body;
  if (!idTratamiento) throw new ErrorNegocio('Selecciona un tratamiento');
  if (!idsProducto.length) throw new ErrorNegocio('Selecciona al menos un producto para el tratamiento');

  const detalle = await enTransaccion(async (conexion) => {
    // El precio de uso se copia al momento del servicio para conservar el histórico de costos
    const [productos] = await conexion.query('SELECT idProducto, precioUso FROM producto WHERE idProducto IN (?)', [idsProducto]);
    const [resultado] = await conexion.query('INSERT INTO servicioTratamiento SET ?', [
      { idServicio: peticion.params.id, idTratamiento, costo: calcularCostoTratamiento(productos) },
    ]);
    await conexion.query('INSERT INTO servicioTratamientoProducto (idServicioTratamiento, idProducto, precioUso) VALUES ?', [
      productos.map((producto) => [resultado.insertId, producto.idProducto, producto.precioUso]),
    ]);
    await recalcularCostoServicio(conexion, peticion.params.id);
    return obtenerDetalleServicio(peticion.params.id, conexion);
  });
  respuesta.status(201).json(detalle);
});

serviciosRutas.delete('/:id/tratamientos/:idServicioTratamiento', async (peticion, respuesta) => {
  const detalle = await enTransaccion(async (conexion) => {
    await conexion.query('DELETE FROM servicioTratamiento WHERE idServicioTratamiento = ? AND idServicio = ?', [
      peticion.params.idServicioTratamiento,
      peticion.params.id,
    ]);
    await recalcularCostoServicio(conexion, peticion.params.id);
    return obtenerDetalleServicio(peticion.params.id, conexion);
  });
  respuesta.json(detalle);
});