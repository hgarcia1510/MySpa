import { Router } from 'express';
import { conexionBd } from '../config/baseDatos.js';
import { ErrorNegocio } from '../utilidades/errores.js';

// Métricas de uso de la web/PWA (públicas: las manda la página aunque no haya sesión)
export const metricasRutas = Router();

const tiposEvento = ['visita', 'instalacion'];

metricasRutas.post('/eventos', async (peticion, respuesta) => {
  const { tipo, enPwa } = peticion.body ?? {};
  if (!tiposEvento.includes(tipo)) throw new ErrorNegocio("El tipo de evento debe ser 'visita' o 'instalacion'");
  await conexionBd.query('INSERT INTO eventoUso (tipo, enPwa) VALUES (?, ?)', [tipo, enPwa ? 1 : 0]);
  respuesta.status(201).json({ mensaje: 'Evento registrado' });
});
