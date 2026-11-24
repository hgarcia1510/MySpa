import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { obtenerDashboard } from '../src/servicios/dashboardServicio.js';

/*
 * Prueba el Dashboard contra una base SQLite en memoria creada desde baseDatos/mySpa.sql.
 * Como obtenerDashboard solo usa SQL estándar, el mismo código corre en MySQL y en SQLite.
 * node:sqlite existe desde Node 22.5; si no está disponible las pruebas se omiten.
 */
let sqlite = null;
try {
  sqlite = await import('node:sqlite');
} catch {
  sqlite = null;
}
const opciones = { skip: sqlite ? false : 'node:sqlite no está disponible en esta versión de Node' };

const carpetaActual = path.dirname(fileURLToPath(import.meta.url));
const rutaScriptSql = path.resolve(carpetaActual, '../../baseDatos/mySpa.sql');

// "Hoy" fijo para que los resultados no dependan del día en que se corra la prueba
const ahora = new Date(2026, 5, 30, 12, 0, 0); // 30 de junio de 2026, 12:00 → periodo de 30 días: 1 al 30 de junio
const marcaTiempo = (anio, mes, dia) => new Date(anio, mes - 1, dia, 9, 0, 0).getTime();

let consultar;

async function crearBase() {
  const base = new sqlite.DatabaseSync(':memory:');
  const scriptMySql = await fs.readFile(rutaScriptSql, 'utf8');
  const scriptSqlite = scriptMySql
    .replace(/^\s*(CREATE DATABASE|USE)\b.*$/gim, '')
    .replace(/INT AUTO_INCREMENT PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/ENUM\([^)]*\)/g, 'TEXT');
  base.exec(scriptSqlite);

  // Ya existen: admin (usuario 1, persona 1, empleado 1) y la sucursal 1 "MySPA Centro"
  base.exec(`
    INSERT INTO sucursal (nombre, domicilio, latitud, longitud) VALUES ('MySPA Norte', 'Norte', 21.15, -101.69);
    INSERT INTO sala (nombre, idSucursal) VALUES ('Jade', 1), ('Loto', 2);
    INSERT INTO horario (horaInicio, horaFin) VALUES ('10:00:00', '11:00:00'), ('11:00:00', '12:00:00');
    INSERT INTO salaHorario (idSala, idHorario) VALUES (1, 1), (1, 2), (2, 2);

    INSERT INTO usuario (nombreUsuario, contrasenia, rol) VALUES ('ana', 'x', 'Cliente'), ('beto', 'x', 'Cliente'), ('carla', 'x', 'Cliente');
    INSERT INTO persona (nombre, apellidoPaterno, genero) VALUES ('Ana', 'López', 'Femenino'), ('Beto', 'Ruiz', 'Masculino'), ('Carla', 'Díaz', 'Femenino');
  `);
  const insertarCliente = base.prepare('INSERT INTO cliente (numeroUnico, correo, idPersona, idUsuario) VALUES (?, ?, ?, ?)');
  insertarCliente.run(`LOAA${marcaTiempo(2026, 6, 10)}`, 'ana@correo.com', 2, 2);   // nueva en el periodo
  insertarCliente.run(`RUXB${marcaTiempo(2026, 1, 15)}`, 'beto@correo.com', 3, 3);  // antigua
  insertarCliente.run(`DIXC${marcaTiempo(2026, 6, 20)}`, 'carla@correo.com', 4, 4); // nueva en el periodo

  base.exec(`
    INSERT INTO reservacion (idReservacion, fecha, estatus, canal, idCliente, idSala) VALUES
      (1, '2026-06-05 10:00:00', 'Atendida',  'Web',      1, 1),
      (2, '2026-06-12 10:00:00', 'Atendida',  'Web',      1, 1),
      (3, '2026-06-15 11:00:00', 'Atendida',  'Sucursal', 2, 2),
      (4, '2026-06-18 10:00:00', 'Cancelada', 'Web',      3, 1),
      (5, '2026-06-20 11:00:00', 'Pendiente', 'Web',      2, 2),  -- ya pasó y nadie llegó: inasistencia
      (6, '2026-07-05 10:00:00', 'Pendiente', 'Web',      3, 1),  -- próxima (fuera del periodo)
      (7, '2026-05-20 10:00:00', 'Atendida',  'Sucursal', 2, 2);  -- periodo anterior

    INSERT INTO servicio (idServicio, fecha, costo, idReservacion, idEmpleado) VALUES
      (1, '2026-06-05 10:30:00', 500, 1, 1),
      (2, '2026-06-12 10:30:00', 300, 2, 1),
      (3, '2026-06-15 11:30:00', 200, 3, 1),
      (4, '2026-05-20 10:30:00', 400, 7, 1);

    INSERT INTO tratamiento (nombre) VALUES ('Masaje relajante'), ('Facial');
    INSERT INTO producto (nombre, marca, precioUso) VALUES ('Aceite de lavanda', 'Natura', 150), ('Mascarilla', 'Derma', 200);
    INSERT INTO servicioTratamiento (idServicioTratamiento, costo, idServicio, idTratamiento) VALUES
      (1, 500, 1, 1), (2, 300, 2, 1), (3, 200, 3, 2);
    INSERT INTO servicioTratamientoProducto (idServicioTratamiento, idProducto, precioUso) VALUES
      (1, 1, 150), (1, 2, 350), (2, 1, 300), (3, 2, 200);

    INSERT INTO resena (calificacion, comentario, fecha, idReservacion) VALUES
      (5, 'Excelente masaje', '2026-06-06 09:00:00', 1),
      (4, NULL,               '2026-06-13 09:00:00', 2),
      (2, 'Llegaron tarde',   '2026-06-16 09:00:00', 3);

    INSERT INTO gastoMarketing (canal, concepto, monto, fecha) VALUES
      ('Facebook', 'Campaña junio', 200, '2026-06-10'),
      ('Google',   'Anuncios',      300, '2026-06-15'),
      ('Volantes', 'Mayo',          999, '2026-05-15');  -- fuera del periodo
  `);

  const insertarEvento = base.prepare('INSERT INTO eventoUso (tipo, enPwa, fecha) VALUES (?, ?, ?)');
  for (let indice = 0; indice < 10; indice++) insertarEvento.run('visita', indice < 4 ? 1 : 0, '2026-06-08 10:00:00');
  insertarEvento.run('instalacion', 1, '2026-06-08 10:05:00');
  insertarEvento.run('instalacion', 1, '2026-06-09 10:05:00');
  insertarEvento.run('visita', 0, '2026-05-01 10:00:00'); // fuera del periodo

  return async (sql, valores = []) => base.prepare(sql).all(...valores);
}

before(async () => {
  if (sqlite) consultar = await crearBase();
});

test('periodo e ingresos con variación contra el periodo anterior', opciones, async () => {
  const { periodo, indicadores } = await obtenerDashboard(consultar, { dias: 30, ahora });
  assert.deepEqual(periodo, { dias: 30, desde: '2026-06-01', hasta: '2026-06-30', idSucursal: null });
  assert.equal(indicadores.ingresos, 1000);
  assert.equal(indicadores.ingresosAnterior, 400);
  assert.equal(indicadores.variacionIngresos, 150);
  assert.equal(indicadores.servicios, 3);
  assert.equal(indicadores.ticketPromedio, 333.33);
  assert.equal(indicadores.reservaciones, 5);
  assert.equal(indicadores.variacionReservaciones, 400);
  assert.equal(indicadores.proximasReservaciones, 1);
});

test('cancelación e inasistencia', opciones, async () => {
  const { indicadores, reservaciones } = await obtenerDashboard(consultar, { dias: 30, ahora });
  assert.equal(indicadores.tasaCancelacion, 20); // 1 de 5
  assert.equal(indicadores.tasaInasistencia, 25); // 1 pendiente vencida de 4 citas pasadas no canceladas
  assert.deepEqual(reservaciones.porCanal, [
    { canal: 'Web', total: 4, porcentaje: 80 },
    { canal: 'Sucursal', total: 1, porcentaje: 20 },
  ]);
  assert.deepEqual(reservaciones.porEstatus.map((fila) => fila.total), [1, 3, 1]); // Pendiente, Atendida, Cancelada
});

test('ventas por sucursal y serie diaria', opciones, async () => {
  const { ventas } = await obtenerDashboard(consultar, { dias: 30, ahora });
  assert.deepEqual(ventas.porSucursal.map(({ nombre, ingresos, participacion }) => ({ nombre, ingresos, participacion })), [
    { nombre: 'MySPA Centro', ingresos: 800, participacion: 80 },
    { nombre: 'MySPA Norte', ingresos: 200, participacion: 20 },
  ]);
  assert.equal(ventas.serieDiaria.length, 30);
  assert.deepEqual(ventas.serieDiaria[4], { dia: '2026-06-05', reservaciones: 1, ingresos: 500 });
  assert.deepEqual(ventas.serieDiaria[1], { dia: '2026-06-02', reservaciones: 0, ingresos: 0 });
});

test('clientes nuevos, retención y top de clientes', opciones, async () => {
  const { indicadores, clientes } = await obtenerDashboard(consultar, { dias: 30, ahora });
  assert.equal(indicadores.clientesNuevos, 2);
  assert.equal(indicadores.clientesActivos, 3);
  assert.deepEqual(clientes.retencion, { clientesAtendidos: 2, clientesRecurrentes: 1, tasaRetencion: 50, frecuenciaPromedio: 1.5 });
  assert.deepEqual(clientes.topClientes[0], { idCliente: 1, numeroUnico: clientes.topClientes[0].numeroUnico, nombre: 'Ana López', servicios: 2, importe: 800 });
  assert.deepEqual(clientes.porGenero.map((fila) => fila.total), [2, 1, 0]);
});

test('comportamiento de compra y ocupación de salas', opciones, async () => {
  const { comportamiento } = await obtenerDashboard(consultar, { dias: 30, ahora });
  assert.deepEqual(comportamiento.tratamientos[0], { idTratamiento: 1, nombre: 'Masaje relajante', veces: 2, importe: 800 });
  // Los dos productos se usaron 2 veces: desempata el importe (Mascarilla 550 > Aceite 450)
  assert.deepEqual(comportamiento.productos.map(({ nombre, usos, importe }) => [nombre, usos, importe]), [
    ['Mascarilla', 2, 550],
    ['Aceite de lavanda', 2, 450],
  ]);
  const jade = comportamiento.ocupacionSalas.find((sala) => sala.nombre === 'Jade');
  assert.deepEqual([jade.reservaciones, jade.capacidad, jade.ocupacion], [2, 60, 3.3]); // 2 de 2 horarios × 30 días
});

test('marketing: conversión, ROI y costo por cliente nuevo', opciones, async () => {
  const { marketing } = await obtenerDashboard(consultar, { dias: 30, ahora });
  assert.equal(marketing.visitas, 10);
  assert.equal(marketing.visitasPwa, 4);
  assert.equal(marketing.instalaciones, 2);
  assert.equal(marketing.conversion, 40); // 4 reservaciones Web / 10 visitas
  assert.equal(marketing.gastoTotal, 500);
  assert.equal(marketing.roi, 1); // (1000 − 500) / 500
  assert.equal(marketing.costoPorClienteNuevo, 250); // 500 / 2 clientes nuevos
  assert.deepEqual(marketing.gastoPorCanal, [{ canal: 'Google', total: 300 }, { canal: 'Facebook', total: 200 }]);
  assert.equal(marketing.gastosRecientes.length, 2);
});

test('feedback: promedio, satisfacción y comentarios', opciones, async () => {
  const { feedback } = await obtenerDashboard(consultar, { dias: 30, ahora });
  assert.equal(feedback.total, 3);
  assert.equal(feedback.promedio, 3.7);
  assert.equal(feedback.satisfaccion, 66.7);
  assert.deepEqual(feedback.distribucion, { 1: 0, 2: 1, 3: 0, 4: 1, 5: 1 });
  assert.deepEqual(feedback.comentarios.map((comentario) => comentario.comentario), ['Llegaron tarde', 'Excelente masaje']);
});

test('filtro por sucursal', opciones, async () => {
  const { indicadores, ventas, feedback } = await obtenerDashboard(consultar, { dias: 30, idSucursal: 2, ahora });
  assert.equal(indicadores.ingresos, 200);
  assert.equal(indicadores.reservaciones, 2);
  assert.equal(indicadores.tasaCancelacion, 0);
  assert.equal(indicadores.tasaInasistencia, 50);
  assert.deepEqual(ventas.porSucursal.map((fila) => [fila.nombre, fila.participacion]), [['MySPA Norte', 100]]);
  assert.equal(feedback.promedio, 2);
});
