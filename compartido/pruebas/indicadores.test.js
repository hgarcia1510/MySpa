import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularPorcentaje, calcularRetencion, calcularRoi, calcularVariacion,
  completarSerieDiaria, obtenerFechaAltaCliente, resumirCalificaciones,
} from '../src/indicadores.js';

test('porcentaje con un decimal y 0 si no hay total', () => {
  assert.equal(calcularPorcentaje(1, 3), 33.3);
  assert.equal(calcularPorcentaje(2, 8), 25);
  assert.equal(calcularPorcentaje(5, 0), 0);
});

test('variación contra el periodo anterior', () => {
  assert.equal(calcularVariacion(1000, 400), 150);
  assert.equal(calcularVariacion(300, 400), -25);
  assert.equal(calcularVariacion(500, 0), null);
});

test('ROI con 2 decimales y null sin gasto', () => {
  assert.equal(calcularRoi(1000, 500), 1);
  assert.equal(calcularRoi(500, 300), 0.67);
  assert.equal(calcularRoi(200, 400), -0.5);
  assert.equal(calcularRoi(1000, 0), null);
});

test('retención: clientes recurrentes y frecuencia', () => {
  assert.deepEqual(calcularRetencion([2, 1, 3, 1]), { clientesAtendidos: 4, clientesRecurrentes: 2, tasaRetencion: 50, frecuenciaPromedio: 1.75 });
  assert.deepEqual(calcularRetencion([{ servicios: 1 }]), { clientesAtendidos: 1, clientesRecurrentes: 0, tasaRetencion: 0, frecuenciaPromedio: 1 });
  assert.deepEqual(calcularRetencion([]), { clientesAtendidos: 0, clientesRecurrentes: 0, tasaRetencion: 0, frecuenciaPromedio: 0 });
});

test('fecha de alta desde el número único (RF 0202)', () => {
  const marca = new Date(2026, 5, 10, 9, 30).getTime();
  assert.equal(obtenerFechaAltaCliente(`GAMH${marca}`).getTime(), marca);
  assert.equal(obtenerFechaAltaCliente('SINFECHA'), null);
  assert.equal(obtenerFechaAltaCliente(null), null);
});

test('resumen de calificaciones', () => {
  const resumen = resumirCalificaciones([5, 4, 2, { calificacion: 5 }, 9]);
  assert.equal(resumen.total, 4);
  assert.equal(resumen.promedio, 4);
  assert.deepEqual(resumen.distribucion, { 1: 0, 2: 1, 3: 0, 4: 1, 5: 2 });
  assert.equal(resumen.satisfaccion, 75);
  assert.deepEqual(resumirCalificaciones([]), { total: 0, promedio: 0, distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, satisfaccion: 0 });
});

test('serie diaria rellena los días sin datos (también cambio de mes)', () => {
  const serie = completarSerieDiaria(
    [{ dia: '2026-06-29', reservaciones: 2, ingresos: '150.50' }, { dia: '2026-07-01', reservaciones: 1 }],
    '2026-06-29', '2026-07-01', ['reservaciones', 'ingresos']
  );
  assert.deepEqual(serie, [
    { dia: '2026-06-29', reservaciones: 2, ingresos: 150.5 },
    { dia: '2026-06-30', reservaciones: 0, ingresos: 0 },
    { dia: '2026-07-01', reservaciones: 1, ingresos: 0 },
  ]);
});
