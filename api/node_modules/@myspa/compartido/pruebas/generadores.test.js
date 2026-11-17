import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarNumeroEmpleado, generarNumeroCliente, obtenerLetrasCliente } from '../src/generadores.js';
import { calcularCostoServicio, calcularCostoTratamiento } from '../src/costos.js';

test('número de empleado: E + 4 letras del RFC + timestamp', () => {
  assert.equal(generarNumeroEmpleado('gamh900101abc', 1700000000000), 'EGAMH1700000000000');
});

test('número de cliente con RFC', () => {
  assert.equal(generarNumeroCliente({ rfc: 'LOPJ850505XY1' }, 123), 'LOPJ123');
});

test('número de cliente sin RFC', () => {
  assert.equal(obtenerLetrasCliente({ nombre: 'Hugo Alexis', apellidoPaterno: 'García', apellidoMaterno: 'Medina' }), 'GAMH');
  assert.equal(obtenerLetrasCliente({ nombre: 'Ana', apellidoPaterno: 'Wynn', apellidoMaterno: '' }), 'WXXA');
});

test('costos maestro-detalle', () => {
  const tratamientos = [
    { productos: [{ precioUso: 10.5 }, { precioUso: 20 }] },
    { productos: [{ precioUso: 5.25 }] },
  ];
  assert.equal(calcularCostoTratamiento(tratamientos[0].productos), 30.5);
  assert.equal(calcularCostoServicio(tratamientos), 35.75);
});