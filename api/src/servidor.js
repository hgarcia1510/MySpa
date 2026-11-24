import express from 'express';
import cors from 'cors';
import { inicializarBaseDatos } from './config/inicializarBaseDatos.js';
import { carpetaSubidas } from './utilidades/subidas.js';
import { manejarErrores } from './utilidades/errores.js';
import { autenticacionRutas } from './rutas/autenticacionRutas.js';
import { empleadosRutas, clientesRutas } from './rutas/personasRutas.js';
import { productosRutas, sucursalesRutas, horariosRutas, tratamientosRutas, salasRutas } from './rutas/catalogosRutas.js';
import { reservacionesRutas } from './rutas/reservacionesRutas.js';
import { serviciosRutas } from './rutas/serviciosRutas.js';
import { dashboardRutas } from './rutas/dashboardRutas.js';
import { metricasRutas } from './rutas/metricasRutas.js';
import { resenasRutas } from './rutas/resenasRutas.js';

const aplicacion = express();
aplicacion.use(cors());
aplicacion.use(express.json());
aplicacion.use('/subidas', express.static(carpetaSubidas));

aplicacion.get('/api/estado', (peticion, respuesta) => respuesta.json({ estado: 'ok' }));
aplicacion.use('/api/autenticacion', autenticacionRutas);
aplicacion.use('/api/empleados', empleadosRutas);
aplicacion.use('/api/clientes', clientesRutas);
aplicacion.use('/api/productos', productosRutas);
aplicacion.use('/api/sucursales', sucursalesRutas);
aplicacion.use('/api/salas', salasRutas);
aplicacion.use('/api/horarios', horariosRutas);
aplicacion.use('/api/tratamientos', tratamientosRutas);
aplicacion.use('/api/reservaciones', reservacionesRutas);
aplicacion.use('/api/servicios', serviciosRutas);
aplicacion.use('/api/dashboard', dashboardRutas);
aplicacion.use('/api/metricas', metricasRutas);
aplicacion.use('/api/resenas', resenasRutas);

aplicacion.use(manejarErrores);

try {
  await inicializarBaseDatos();
} catch (error) {
  console.error(`No se pudo conectar/crear la base de datos: ${error.message}`);
  console.error('Revisa BD_HOST, BD_USUARIO y BD_CONTRASENIA en api/.env y que MySQL esté encendido.');
  process.exit(1);
}

const puerto = process.env.PUERTO ?? 3000;
aplicacion.listen(puerto, '0.0.0.0', () => console.log(`API MySPA en http://localhost:${puerto}/api`));