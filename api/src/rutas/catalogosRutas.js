import { Router } from 'express';
import { crearRutasCrud } from '../utilidades/crudGenerico.js';
import { conexionBd, enTransaccion } from '../config/baseDatos.js';
import { verificarToken, permitirRoles } from '../middlewares/autenticacion.js';
import { validarHorario } from '@myspa/compartido';

// RF 03 - Productos
export const productosRutas = crearRutasCrud({
  tabla: 'producto',
  llave: 'idProducto',
  columnas: ['nombre', 'marca', 'precioUso', 'fotografia', 'rutaFotografia', 'estatus'],
  columnasBusqueda: ['t.nombre', 't.marca', 't.precioUso', 't.estatus'],
  requeridos: ['nombre', 'marca', 'precioUso'],
  imagen: { campo: 'fotografia', columnaRuta: 'rutaFotografia' },
});

// RF 04 - Sucursales (lectura pública: los clientes buscan salas por sucursal)
export const sucursalesRutas = crearRutasCrud({
  tabla: 'sucursal',
  llave: 'idSucursal',
  columnas: ['nombre', 'domicilio', 'latitud', 'longitud', 'estatus'],
  requeridos: ['nombre', 'latitud', 'longitud'],
  lecturaPublica: true,
});

// RF 06 - Horarios (eliminación física)
export const horariosRutas = crearRutasCrud({
  tabla: 'horario',
  llave: 'idHorario',
  columnas: ['horaInicio', 'horaFin'],
  conEstatus: false,
  eliminacionFisica: true,
  lecturaPublica: true,
  orden: 't.horaInicio',
  validar: (datos) => (datos.horaInicio && datos.horaFin ? validarHorario(datos) : []),
});

// RF 08 - Tratamientos
export const tratamientosRutas = crearRutasCrud({
  tabla: 'tratamiento',
  llave: 'idTratamiento',
  columnas: ['nombre', 'descripcion', 'estatus'],
  requeridos: ['nombre'],
});

// RF 05 - Salas (con fotografía y sucursal)
export const salasRutas = Router();

salasRutas.get('/:idSala/horarios', async (peticion, respuesta) => {
  const [filas] = await conexionBd.query(
    `SELECT h.* FROM horario h JOIN salaHorario sh ON sh.idHorario = h.idHorario
     WHERE sh.idSala = ? ORDER BY h.horaInicio`,
    [peticion.params.idSala]
  );
  respuesta.json(filas);
});

salasRutas.put('/:idSala/horarios', verificarToken, permitirRoles('Empleado'), async (peticion, respuesta) => {
  const { idSala } = peticion.params;
  const idsHorario = peticion.body.idsHorario ?? [];
  await enTransaccion(async (conexion) => {
    await conexion.query('DELETE FROM salaHorario WHERE idSala = ?', [idSala]);
    if (idsHorario.length) {
      await conexion.query('INSERT INTO salaHorario (idSala, idHorario) VALUES ?', [idsHorario.map((idHorario) => [idSala, idHorario])]);
    }
  });
  respuesta.json({ mensaje: 'Horarios asignados' });
});

salasRutas.use(
  crearRutasCrud({
    tabla: 'sala',
    alias: 's',
    llave: 'idSala',
    columnas: ['nombre', 'descripcion', 'fotografia', 'rutaFotografia', 'estatus', 'idSucursal'],
    requeridos: ['nombre', 'idSucursal'],
    consultaBase: `SELECT s.*, su.nombre AS nombreSucursal, su.latitud, su.longitud
                   FROM sala s JOIN sucursal su ON su.idSucursal = s.idSucursal`,
    columnasBusqueda: ['s.nombre', 's.descripcion', 's.estatus', 'su.nombre'],
    filtros: { idSucursal: 's.idSucursal' },
    lecturaPublica: true,
    imagen: { campo: 'fotografia', columnaRuta: 'rutaFotografia' },
  })
);