import { Router } from 'express';
import { conexionBd } from '../config/baseDatos.js';
import { verificarToken, permitirRoles } from '../middlewares/autenticacion.js';
import { ErrorNegocio } from '../utilidades/errores.js';
import { estatusReservacion, roles } from '@myspa/compartido';

// Reseñas: el cliente califica (1 a 5) una reservación suya que ya fue atendida
export const resenasRutas = Router();
resenasRutas.use(verificarToken, permitirRoles(roles.cliente));

resenasRutas.post('/', async (peticion, respuesta) => {
  const idReservacion = Number(peticion.body.idReservacion);
  const calificacion = Number(peticion.body.calificacion);
  const comentario = String(peticion.body.comentario ?? '').trim() || null;

  if (!Number.isInteger(idReservacion) || idReservacion <= 0) throw new ErrorNegocio('La reservación es obligatoria');
  if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) throw new ErrorNegocio('La calificación debe ser de 1 a 5 estrellas');
  if (comentario && comentario.length > 500) throw new ErrorNegocio('El comentario admite máximo 500 caracteres');

  const [reservaciones] = await conexionBd.query(
    `SELECT r.idCliente, r.estatus, re.idResena
     FROM reservacion r LEFT JOIN resena re ON re.idReservacion = r.idReservacion
     WHERE r.idReservacion = ?`,
    [idReservacion]
  );
  const reservacion = reservaciones[0];
  if (!reservacion) throw new ErrorNegocio('Reservación no encontrada', 404);
  if (reservacion.idCliente !== peticion.sesion.idCliente) throw new ErrorNegocio('Esta reservación no te pertenece', 403);
  if (reservacion.estatus !== estatusReservacion.atendida) throw new ErrorNegocio('Solo puedes calificar reservaciones atendidas');
  if (reservacion.idResena) throw new ErrorNegocio('Ya calificaste esta reservación', 409);

  const [resultado] = await conexionBd.query('INSERT INTO resena SET ?', [{ idReservacion, calificacion, comentario }]);
  respuesta.status(201).json({ idResena: resultado.insertId, idReservacion, calificacion, comentario });
});
