import { Router } from 'express';
import { conexionBd, enTransaccion } from '../config/baseDatos.js';
import { verificarToken, permitirRoles } from '../middlewares/autenticacion.js';
import { ErrorNegocio, lanzarSiHayErrores } from '../utilidades/errores.js';
import { subirImagen, asignarArchivo } from '../utilidades/subidas.js';
import { crearCliente, crearEmpleado, actualizarPersonaCompleta } from '../servicios/personasServicio.js';
import { validarCliente, validarEmpleado } from '@myspa/compartido';

const columnasBusquedaPersona = ['p.nombre', 'p.apellidoPaterno', 'p.apellidoMaterno', 'p.genero', 'p.rfc', 'p.domicilio', 'p.telefono', 'u.nombreUsuario'];

/** Rutas de empleados y clientes: comparten Persona + Usuario. */
function crearRutasPersona({ tabla, alias, llave, columnasPropias, columnasBusqueda, crear, validar, imagen }) {
  const rutas = Router();
  rutas.use(verificarToken, permitirRoles('Empleado'));

  const seleccion = `SELECT ${alias}.*, p.nombre, p.apellidoPaterno, p.apellidoMaterno, p.genero, p.rfc,
                            p.domicilio, p.telefono, u.nombreUsuario
                     FROM ${tabla} ${alias}
                     JOIN persona p ON p.idPersona = ${alias}.idPersona
                     JOIN usuario u ON u.idUsuario = ${alias}.idUsuario`;
  const subida = imagen ? [subirImagen.single('foto')] : [];

  rutas.get('/', async (peticion, respuesta) => {
    const { buscar = '', inactivos = '0' } = peticion.query;
    const condiciones = [];
    const valores = [];
    if (inactivos !== '1') condiciones.push(`${alias}.estatus = 'Activo'`);
    if (buscar.trim()) {
      condiciones.push(`CONCAT_WS(' ', ${[...columnasBusquedaPersona, ...columnasBusqueda].join(', ')}) LIKE ?`);
      valores.push(`%${buscar.trim()}%`);
    }
    const donde = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
    const [filas] = await conexionBd.query(`${seleccion}${donde} ORDER BY p.apellidoPaterno, p.nombre`, valores);
    respuesta.json(filas);
  });

  rutas.get('/:id', async (peticion, respuesta) => {
    const [filas] = await conexionBd.query(`${seleccion} WHERE ${alias}.${llave} = ?`, [peticion.params.id]);
    if (!filas.length) throw new ErrorNegocio('Registro no encontrado', 404);
    respuesta.json(filas[0]);
  });

  rutas.post('/', ...subida, async (peticion, respuesta) => {
    const datos = imagen ? asignarArchivo(peticion.body, peticion.file, 'foto', 'rutaFoto') : peticion.body;
    lanzarSiHayErrores(validar(datos, { esAlta: true }));
    const resultado = await enTransaccion((conexion) => crear(conexion, datos));
    respuesta.status(201).json(resultado);
  });

  rutas.put('/:id', ...subida, async (peticion, respuesta) => {
    const datos = imagen ? asignarArchivo(peticion.body, peticion.file, 'foto', 'rutaFoto') : peticion.body;
    // En modificación el RFC del empleado no se envía (generó su número), por eso se ignora ese error
    lanzarSiHayErrores(validar(datos, { esAlta: false }).filter((error) => error !== 'El campo rfc es obligatorio'));
    const encontrado = await enTransaccion((conexion) =>
      actualizarPersonaCompleta(conexion, { tabla, llave, id: peticion.params.id, datos, columnasPropias })
    );
    if (!encontrado) throw new ErrorNegocio('Registro no encontrado', 404);
    respuesta.json({ mensaje: 'Registro actualizado' });
  });

  rutas.delete('/:id', async (peticion, respuesta) => {
    await conexionBd.query(`UPDATE ${tabla} SET estatus = 'Inactivo' WHERE ${llave} = ?`, [peticion.params.id]);
    respuesta.json({ mensaje: 'Registro marcado como Inactivo' });
  });

  return rutas;
}

// RF 01 - Empleados
export const empleadosRutas = crearRutasPersona({
  tabla: 'empleado',
  alias: 'e',
  llave: 'idEmpleado',
  columnasPropias: ['puesto', 'foto', 'rutaFoto', 'estatus'],
  columnasBusqueda: ['e.numeroEmpleado', 'e.puesto', 'e.estatus'],
  crear: crearEmpleado,
  validar: validarEmpleado,
  imagen: true,
});

// RF 02 - Clientes
export const clientesRutas = crearRutasPersona({
  tabla: 'cliente',
  alias: 'c',
  llave: 'idCliente',
  columnasPropias: ['correo', 'estatus'],
  columnasBusqueda: ['c.numeroUnico', 'c.correo', 'c.estatus'],
  crear: crearCliente,
  validar: validarCliente,
});