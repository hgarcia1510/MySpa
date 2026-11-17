import bcrypt from 'bcryptjs';
import { generarNumeroCliente, generarNumeroEmpleado, roles } from '@myspa/compartido';

const columnasPersona = ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'genero', 'rfc', 'domicilio', 'telefono'];

const tomar = (datos, columnas) =>
  Object.fromEntries(columnas.filter((columna) => datos[columna] !== undefined).map((columna) => [columna, datos[columna] === '' ? null : datos[columna]]));

const esperar = (milisegundos) => new Promise((resolver) => setTimeout(resolver, milisegundos));

/** Intenta insertar con un número generado; si se repite, genera otro. */
async function insertarConNumeroUnico(conexion, tabla, columnaNumero, generarNumero, datos) {
  for (let intento = 0; intento < 5; intento++) {
    try {
      const numero = generarNumero();
      const [resultado] = await conexion.query(`INSERT INTO ${tabla} SET ?`, [{ ...datos, [columnaNumero]: numero }]);
      return { id: resultado.insertId, numero };
    } catch (error) {
      const esNumeroRepetido = error.code === 'ER_DUP_ENTRY' && error.message.includes(columnaNumero);
      if (!esNumeroRepetido) throw error;
      await esperar(2);
    }
  }
  throw new Error(`No se pudo generar un ${columnaNumero} único`);
}

async function insertarPersonaYUsuario(conexion, datos, rol) {
  const [resultadoPersona] = await conexion.query('INSERT INTO persona SET ?', [tomar(datos, columnasPersona)]);
  const contraseniaCifrada = await bcrypt.hash(datos.contrasenia, 10);
  const [resultadoUsuario] = await conexion.query('INSERT INTO usuario SET ?', [
    { nombreUsuario: datos.nombreUsuario, contrasenia: contraseniaCifrada, rol },
  ]);
  return { idPersona: resultadoPersona.insertId, idUsuario: resultadoUsuario.insertId };
}

export async function crearEmpleado(conexion, datos) {
  const { idPersona, idUsuario } = await insertarPersonaYUsuario(conexion, datos, roles.empleado);
  const { id, numero } = await insertarConNumeroUnico(conexion, 'empleado', 'numeroEmpleado', () => generarNumeroEmpleado(datos.rfc), {
    ...tomar(datos, ['puesto', 'foto', 'rutaFoto']),
    idPersona,
    idUsuario,
  });
  return { idEmpleado: id, numeroEmpleado: numero };
}

export async function crearCliente(conexion, datos) {
  const { idPersona, idUsuario } = await insertarPersonaYUsuario(conexion, datos, roles.cliente);
  const { id, numero } = await insertarConNumeroUnico(conexion, 'cliente', 'numeroUnico', () => generarNumeroCliente(datos), {
    correo: datos.correo,
    idPersona,
    idUsuario,
  });
  return { idCliente: id, numeroUnico: numero };
}

/** Actualiza persona + usuario + tabla propia (empleado/cliente). Nunca toca el número generado. */
export async function actualizarPersonaCompleta(conexion, { tabla, llave, id, datos, columnasPropias }) {
  const [filas] = await conexion.query(`SELECT idPersona, idUsuario FROM ${tabla} WHERE ${llave} = ?`, [id]);
  if (!filas.length) return false;
  const { idPersona, idUsuario } = filas[0];

  const datosPersona = tomar(datos, columnasPersona);
  if (tabla === 'empleado') delete datosPersona.rfc; // el RFC originó el número de empleado
  if (Object.keys(datosPersona).length) await conexion.query('UPDATE persona SET ? WHERE idPersona = ?', [datosPersona, idPersona]);

  const datosPropios = tomar(datos, columnasPropias);
  if (Object.keys(datosPropios).length) await conexion.query(`UPDATE ${tabla} SET ? WHERE ${llave} = ?`, [datosPropios, id]);

  const datosUsuario = {};
  if (datos.nombreUsuario) datosUsuario.nombreUsuario = datos.nombreUsuario;
  if (datos.contrasenia) datosUsuario.contrasenia = await bcrypt.hash(datos.contrasenia, 10);
  if (Object.keys(datosUsuario).length) await conexion.query('UPDATE usuario SET ? WHERE idUsuario = ?', [datosUsuario, idUsuario]);
  return true;
}