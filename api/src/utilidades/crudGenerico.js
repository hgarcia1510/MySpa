import { Router } from 'express';
import { conexionBd } from '../config/baseDatos.js';
import { verificarToken, permitirRoles } from '../middlewares/autenticacion.js';
import { lanzarSiHayErrores, ErrorNegocio } from './errores.js';
import { validarCamposRequeridos } from '@myspa/compartido';
import { subirImagen, asignarArchivo } from './subidas.js';

/**
 * Genera las rutas CRUD de un catálogo simple:
 *   GET    /?buscar=texto&inactivos=1   (RF búsqueda + despliegue)
 *   GET    /:id
 *   POST   /                            (alta)
 *   PUT    /:id                         (modificación)
 *   DELETE /:id                         (eliminación lógica o física)
 */
export function crearRutasCrud({
  tabla,
  alias = 't',
  llave,
  columnas,
  requeridos = [],
  consultaBase,
  columnasBusqueda,
  conEstatus = true,
  eliminacionFisica = false,
  lecturaPublica = false,
  orden,
  validar,
  imagen, // { campo: 'fotografia', columnaRuta: 'rutaFotografia' }
  filtros = {}, // { idSucursal: 's.idSucursal' }
}) {
  const rutas = Router();
  const seleccion = consultaBase ?? `SELECT ${alias}.* FROM ${tabla} ${alias}`;
  const busqueda = columnasBusqueda ?? columnas.map((columna) => `${alias}.${columna}`);
  const soloEmpleados = [verificarToken, permitirRoles('Empleado')];
  const lectura = lecturaPublica ? [] : [verificarToken];
  const subida = imagen ? [subirImagen.single(imagen.campo)] : [];

  const tomarColumnas = (cuerpo) =>
    Object.fromEntries(columnas.filter((columna) => cuerpo[columna] !== undefined).map((columna) => [columna, cuerpo[columna] === '' ? null : cuerpo[columna]]));

  rutas.get('/', ...lectura, async (peticion, respuesta) => {
    const { buscar = '', inactivos = '0' } = peticion.query;
    const condiciones = [];
    const valores = [];
    if (conEstatus && inactivos !== '1') condiciones.push(`${alias}.estatus = 'Activo'`);
    if (buscar.trim()) {
      condiciones.push(`CONCAT_WS(' ', ${busqueda.join(', ')}) LIKE ?`);
      valores.push(`%${buscar.trim()}%`);
    }
    for (const [parametro, columna] of Object.entries(filtros)) {
      if (peticion.query[parametro]) {
        condiciones.push(`${columna} = ?`);
        valores.push(peticion.query[parametro]);
      }
    }
    const donde = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
    const [filas] = await conexionBd.query(`${seleccion}${donde} ORDER BY ${orden ?? `${alias}.${llave} DESC`}`, valores);
    respuesta.json(filas);
  });

  rutas.get('/:id', ...lectura, async (peticion, respuesta) => {
    const [filas] = await conexionBd.query(`${seleccion} WHERE ${alias}.${llave} = ?`, [peticion.params.id]);
    if (!filas.length) throw new ErrorNegocio('Registro no encontrado', 404);
    respuesta.json(filas[0]);
  });

  rutas.post('/', ...soloEmpleados, ...subida, async (peticion, respuesta) => {
    let datos = tomarColumnas(peticion.body);
    if (imagen) datos = asignarArchivo(datos, peticion.file, imagen.campo, imagen.columnaRuta);
    lanzarSiHayErrores([...validarCamposRequeridos(datos, requeridos), ...(validar?.(datos) ?? [])]);
    const [resultado] = await conexionBd.query(`INSERT INTO ${tabla} SET ?`, [datos]);
    respuesta.status(201).json({ [llave]: resultado.insertId, ...datos });
  });

  rutas.put('/:id', ...soloEmpleados, ...subida, async (peticion, respuesta) => {
    let datos = tomarColumnas(peticion.body);
    if (imagen) datos = asignarArchivo(datos, peticion.file, imagen.campo, imagen.columnaRuta);
    delete datos[llave]; // la llave nunca se modifica (integridad referencial)
    lanzarSiHayErrores(validar?.(datos) ?? []);
    if (!Object.keys(datos).length) throw new ErrorNegocio('No hay datos para actualizar');
    await conexionBd.query(`UPDATE ${tabla} SET ? WHERE ${llave} = ?`, [datos, peticion.params.id]);
    respuesta.json({ mensaje: 'Registro actualizado' });
  });

  rutas.delete('/:id', ...soloEmpleados, async (peticion, respuesta) => {
    const sentencia = eliminacionFisica
      ? `DELETE FROM ${tabla} WHERE ${llave} = ?`
      : `UPDATE ${tabla} SET estatus = 'Inactivo' WHERE ${llave} = ?`;
    await conexionBd.query(sentencia, [peticion.params.id]);
    respuesta.json({ mensaje: eliminacionFisica ? 'Registro eliminado' : 'Registro marcado como Inactivo' });
  });

  return rutas;
}