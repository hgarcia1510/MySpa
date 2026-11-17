import mysql from 'mysql2/promise';

export const conexionBd = mysql.createPool({
  host: process.env.BD_HOST ?? 'localhost',
  user: process.env.BD_USUARIO ?? 'root',
  password: process.env.BD_CONTRASENIA ?? '',
  database: process.env.BD_NOMBRE ?? 'mySpa',
  dateStrings: true,
  connectionLimit: 10,
});

export async function enTransaccion(funcion) {
  const conexion = await conexionBd.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await funcion(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}