import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const carpetaActual = path.dirname(fileURLToPath(import.meta.url));
const rutaScriptSql = path.resolve(carpetaActual, '../../../baseDatos/mySpa.sql');
const rutaExtensionesDashboard = path.resolve(carpetaActual, '../../../baseDatos/extensionesDashboard.sql');

/**
 * Actualiza una base de datos que ya existía con lo nuevo del Dashboard:
 * tablas eventoUso, gastoMarketing y resena, y la columna reservacion.canal.
 */
async function aplicarExtensionesDashboard(conexion, nombreBaseDatos) {
  await conexion.query(`USE \`${nombreBaseDatos}\``);
  await conexion.query(await fs.readFile(rutaExtensionesDashboard, 'utf8'));
  const [columnas] = await conexion.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservacion' AND COLUMN_NAME = 'canal'`,
    [nombreBaseDatos]
  );
  if (!columnas.length) {
    await conexion.query(`ALTER TABLE reservacion ADD COLUMN canal ENUM('Web','Sucursal') NOT NULL DEFAULT 'Web' AFTER estatus`);
    console.log('Columna reservacion.canal agregada');
  }
}

const datosConexion = () => ({
  host: process.env.BD_HOST ?? 'localhost',
  user: process.env.BD_USUARIO ?? 'root',
  password: process.env.BD_CONTRASENIA ?? '',
  multipleStatements: true, 
});


export async function inicializarBaseDatos({ reiniciar = false } = {}) {
  const nombreBaseDatos = process.env.BD_NOMBRE ?? 'mySpa';
  const conexion = await mysql.createConnection(datosConexion());
  try {
    if (reiniciar) {
      await conexion.query(`DROP DATABASE IF EXISTS \`${nombreBaseDatos}\``);
      console.log(`Base de datos ${nombreBaseDatos} eliminada`);
    }

    const [existentes] = await conexion.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [nombreBaseDatos]);
    if (existentes.length) {
      await aplicarExtensionesDashboard(conexion, nombreBaseDatos);
      console.log(`Base de datos ${nombreBaseDatos} lista`);
      return;
    }

    console.log(`Creando la base de datos ${nombreBaseDatos} por primera vez...`);
    const scriptSql = await fs.readFile(rutaScriptSql, 'utf8');
    const scriptSinBaseDatos = scriptSql.replace(/^\s*(CREATE DATABASE|USE)\b.*$/gim, '');

    await conexion.query(`CREATE DATABASE \`${nombreBaseDatos}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conexion.query(`USE \`${nombreBaseDatos}\``);
    try {
      await conexion.query(scriptSinBaseDatos);
    } catch (error) {
      await conexion.query(`DROP DATABASE IF EXISTS \`${nombreBaseDatos}\``);
      throw error;
    }
    console.log('Base de datos creada. Usuario inicial: admin / admin123');
  } finally {
    await conexion.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  inicializarBaseDatos({ reiniciar: process.argv.includes('--reiniciar') })
    .catch((error) => {
      console.error('No se pudo inicializar la base de datos:', error.message);
      process.exitCode = 1;
    });
}