import { Router } from 'express';
import { conexionBd } from '../config/baseDatos.js';
import { verificarToken, permitirRoles } from '../middlewares/autenticacion.js';
import { ErrorNegocio, lanzarSiHayErrores } from '../utilidades/errores.js';
import { obtenerDashboard } from '../servicios/dashboardServicio.js';
import { roles } from '@myspa/compartido';

// Dashboard administrativo: solo empleados
export const dashboardRutas = Router();
dashboardRutas.use(verificarToken, permitirRoles(roles.empleado));

const consultar = async (sql, valores) => (await conexionBd.query(sql, valores))[0];

// GET /api/dashboard?dias=30&idSucursal=1
dashboardRutas.get('/', async (peticion, respuesta) => {
  const { dias = 30, idSucursal } = peticion.query;
  respuesta.json(await obtenerDashboard(consultar, { dias, idSucursal: idSucursal || null }));
});

// Gastos de marketing (para ROI y costo por cliente nuevo)
dashboardRutas.post('/gastos', async (peticion, respuesta) => {
  const canal = String(peticion.body.canal ?? '').trim();
  const concepto = String(peticion.body.concepto ?? '').trim() || null;
  const monto = Number(peticion.body.monto);
  const fecha = String(peticion.body.fecha ?? '').trim();

  const errores = [];
  if (!canal) errores.push('El canal es obligatorio');
  if (canal.length > 40) errores.push('El canal admite máximo 40 caracteres');
  if (concepto && concepto.length > 120) errores.push('El concepto admite máximo 120 caracteres');
  if (!Number.isFinite(monto) || monto <= 0) errores.push('El monto debe ser mayor a 0');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(new Date(`${fecha}T00:00:00`).getTime())) errores.push('La fecha no es válida');
  lanzarSiHayErrores(errores);

  const [resultado] = await conexionBd.query('INSERT INTO gastoMarketing SET ?', [{ canal, concepto, monto, fecha }]);
  respuesta.status(201).json({ idGasto: resultado.insertId, canal, concepto, monto, fecha });
});

dashboardRutas.delete('/gastos/:id', async (peticion, respuesta) => {
  const [resultado] = await conexionBd.query('DELETE FROM gastoMarketing WHERE idGasto = ?', [peticion.params.id]);
  if (!resultado.affectedRows) throw new ErrorNegocio('Gasto no encontrado', 404);
  respuesta.json({ mensaje: 'Gasto eliminado' });
});
