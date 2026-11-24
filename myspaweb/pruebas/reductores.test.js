import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  accionesAvisos, avisosReductor, estadoInicialAvisos,
  accionesCatalogo, catalogoReductor, estadoInicialCatalogo,
  accionesDashboard, dashboardReductor, estadoInicialDashboard, periodosDashboard,
  accionesFormulario, crearEstadoFormulario, formularioReductor,
  accionesMisReservaciones, estadoInicialMisReservaciones, misReservacionesReductor,
  accionesPwa, crearEstadoPwa, pwaReductor,
  accionesReservaciones, estadoInicialReservaciones, reservacionesReductor,
  accionesSalas, estadoInicialSalas, salasReductor,
  accionesServicios, estadoInicialServicios, serviciosReductor,
  accionesSesion, crearEstadoSesion, estadoInicialSesion, sesionReductor,
} from '../src/reductores/index.js';

const accionDesconocida = { type: 'otra/accion' };

test('todos los reductores devuelven el mismo estado ante una acción desconocida', () => {
  const casos = [
    [sesionReductor, estadoInicialSesion],
    [avisosReductor, estadoInicialAvisos],
    [catalogoReductor, estadoInicialCatalogo],
    [reservacionesReductor, estadoInicialReservaciones],
    [misReservacionesReductor, estadoInicialMisReservaciones],
    [salasReductor, estadoInicialSalas],
    [serviciosReductor, estadoInicialServicios],
    [formularioReductor, crearEstadoFormulario({ nombre: '' })],
    [pwaReductor, crearEstadoPwa()],
    [dashboardReductor, estadoInicialDashboard],
  ];
  for (const [reductor, estado] of casos) assert.equal(reductor(estado, accionDesconocida), estado);
});

test('los tipos de acción llevan prefijo', () => {
  assert.equal(accionesCatalogo.guardarError, 'catalogo/guardarError');
  assert.equal(accionesSesion.iniciar, 'sesion/iniciar');
});

test('sesión: iniciar, cerrar y leer de localStorage', () => {
  const sesion = { nombre: 'Ana', rol: 'Cliente' };
  const conSesion = sesionReductor(estadoInicialSesion, { type: accionesSesion.iniciar, sesion });
  assert.deepEqual(conSesion, { sesion });
  assert.deepEqual(sesionReductor(conSesion, { type: accionesSesion.cerrar }), { sesion: null });

  const almacen = { getItem: () => JSON.stringify(sesion) };
  assert.deepEqual(crearEstadoSesion(almacen), { sesion });
  assert.deepEqual(crearEstadoSesion({ getItem: () => null }), { sesion: null });
  assert.deepEqual(crearEstadoSesion({ getItem: () => '{roto' }), { sesion: null });
});

test('avisos: conserva solo los últimos 4 y quita por id', () => {
  let estado = estadoInicialAvisos;
  for (let idAviso = 1; idAviso <= 6; idAviso++) estado = avisosReductor(estado, { type: accionesAvisos.agregar, aviso: { idAviso } });
  assert.deepEqual(estado.avisos.map((aviso) => aviso.idAviso), [3, 4, 5, 6]);
  estado = avisosReductor(estado, { type: accionesAvisos.quitar, idAviso: 4 });
  assert.deepEqual(estado.avisos.map((aviso) => aviso.idAviso), [3, 5, 6]);
});

test('avisos: pedir y cerrar confirmación', () => {
  const confirmacion = { titulo: '¿Eliminar?' };
  const estado = avisosReductor(estadoInicialAvisos, { type: accionesAvisos.pedirConfirmacion, confirmacion });
  assert.equal(estado.confirmacion, confirmacion);
  assert.equal(avisosReductor(estado, { type: accionesAvisos.cerrarConfirmacion }).confirmacion, null);
});

test('catálogo: carga, búsqueda e inactivos', () => {
  let estado = catalogoReductor(estadoInicialCatalogo, { type: accionesCatalogo.cargaExitosa, registros: [{ id: 1 }] });
  assert.equal(estado.cargando, false);
  assert.deepEqual(estado.registros, [{ id: 1 }]);
  estado = catalogoReductor(estado, { type: accionesCatalogo.cambiarBusqueda, buscar: 'ana' });
  estado = catalogoReductor(estado, { type: accionesCatalogo.alternarInactivos });
  assert.equal(estado.buscar, 'ana');
  assert.equal(estado.mostrarInactivos, true);
  assert.equal(catalogoReductor({ ...estadoInicialCatalogo }, { type: accionesCatalogo.cargaFallida }).cargando, false);
});

test('catálogo: formulario y guardado', () => {
  // cambiarCampo no hace nada si el formulario está cerrado
  assert.equal(catalogoReductor(estadoInicialCatalogo, { type: accionesCatalogo.cambiarCampo, campo: 'nombre', valor: 'x' }), estadoInicialCatalogo);

  let estado = catalogoReductor(estadoInicialCatalogo, { type: accionesCatalogo.abrirFormulario });
  assert.deepEqual(estado.registroEditado, {});
  estado = catalogoReductor(estado, { type: accionesCatalogo.cambiarCampo, campo: 'nombre', valor: 'Jade' });
  assert.equal(estado.registroEditado.nombre, 'Jade');
  estado = catalogoReductor(estado, { type: accionesCatalogo.guardarInicio });
  assert.equal(estado.guardando, true);
  estado = catalogoReductor(estado, { type: accionesCatalogo.guardarError, error: 'Falta sucursal' });
  assert.equal(estado.guardando, false);
  assert.equal(estado.error, 'Falta sucursal');
  assert.notEqual(estado.registroEditado, null);
  estado = catalogoReductor(estado, { type: accionesCatalogo.guardarExito });
  assert.equal(estado.registroEditado, null);
  estado = catalogoReductor(estado, { type: accionesCatalogo.abrirHorarios, sala: { idSala: 2 } });
  assert.deepEqual(estado.salaHorarios, { idSala: 2 });
  assert.equal(catalogoReductor(estado, { type: accionesCatalogo.cerrarHorarios }).salaHorarios, null);
});

test('reservaciones del empleado: filtros y edición', () => {
  let estado = reservacionesReductor(estadoInicialReservaciones, { type: accionesReservaciones.cargadas, reservaciones: [] });
  estado = reservacionesReductor(estado, { type: accionesReservaciones.cambiarEstatus, estatus: 'Pendiente' });
  estado = reservacionesReductor(estado, { type: accionesReservaciones.cambiarBusqueda, buscar: 'Jade' });
  estado = reservacionesReductor(estado, { type: accionesReservaciones.editar });
  assert.deepEqual(estado, { reservaciones: [], buscar: 'Jade', estatus: 'Pendiente', editando: {} });
  assert.equal(reservacionesReductor(estado, { type: accionesReservaciones.cerrarEdicion }).editando, null);
});

test('mis reservaciones: reseña guardada sin recargar', () => {
  let estado = misReservacionesReductor(estadoInicialMisReservaciones, {
    type: accionesMisReservaciones.cargadas,
    reservaciones: [{ idReservacion: 1 }, { idReservacion: 2 }],
  });
  estado = misReservacionesReductor(estado, { type: accionesMisReservaciones.abrirCalificacion, reservacion: { idReservacion: 2 } });
  estado = misReservacionesReductor(estado, { type: accionesMisReservaciones.resenaGuardada, idReservacion: 2, calificacion: 5, comentario: 'Excelente' });
  assert.equal(estado.calificando, null);
  assert.equal(estado.reservaciones[0].calificacion, undefined);
  assert.equal(estado.reservaciones[1].calificacion, 5);
  assert.equal(estado.reservaciones[1].comentarioResena, 'Excelente');
  estado = misReservacionesReductor(estado, { type: accionesMisReservaciones.mostrarDetalle, detalle: { idReservacion: 1 } });
  assert.equal(misReservacionesReductor(estado, { type: accionesMisReservaciones.cerrarDetalle }).detalle, null);
});

test('salas: filtros, reservar y mapa', () => {
  let estado = salasReductor(estadoInicialSalas, { type: accionesSalas.sucursalesCargadas, sucursales: [{ idSucursal: 1 }] });
  estado = salasReductor(estado, { type: accionesSalas.salasCargadas, salas: [{ idSala: 3 }] });
  estado = salasReductor(estado, { type: accionesSalas.cambiarSucursal, idSucursal: '1' });
  estado = salasReductor(estado, { type: accionesSalas.cambiarBusqueda, buscar: 'loto' });
  estado = salasReductor(estado, { type: accionesSalas.abrirMapa, sala: { idSala: 3 } });
  estado = salasReductor(estado, { type: accionesSalas.abrirReservacion, sala: { idSala: 3 } });
  assert.equal(estado.idSucursal, '1');
  assert.equal(estado.buscar, 'loto');
  assert.deepEqual(estado.salaMapa, { idSala: 3 });
  assert.deepEqual(estado.salaReservando, { idSala: 3 });
  estado = salasReductor(estado, { type: accionesSalas.cerrarMapa });
  estado = salasReductor(estado, { type: accionesSalas.cerrarReservacion });
  assert.equal(estado.salaMapa, null);
  assert.equal(estado.salaReservando, null);
});

test('servicios: carga del detalle', () => {
  let estado = serviciosReductor(estadoInicialServicios, { type: accionesServicios.detalleInicio });
  assert.equal(estado.cargandoDetalle, true);
  estado = serviciosReductor(estado, { type: accionesServicios.detalleCargado, servicio: { idServicio: 9 } });
  assert.deepEqual(estado.servicio, { idServicio: 9 });
  assert.equal(estado.cargandoDetalle, false);
  estado = serviciosReductor(estado, { type: accionesServicios.detalleFallido });
  assert.equal(estado.servicio, null);
  estado = serviciosReductor(estado, { type: accionesServicios.cargados, servicios: [] });
  estado = serviciosReductor(estado, { type: accionesServicios.cambiarBusqueda, buscar: 'Ana' });
  assert.deepEqual(estado.servicios, []);
  assert.equal(estado.buscar, 'Ana');
});

test('formulario: campos, casillas, envío y reinicio', () => {
  const iniciales = { idTratamiento: '', idsProducto: [] };
  let estado = crearEstadoFormulario(iniciales);
  estado = formularioReductor(estado, { type: accionesFormulario.cambiarCampo, campo: 'idTratamiento', valor: '4' });
  estado = formularioReductor(estado, { type: accionesFormulario.alternarEnLista, campo: 'idsProducto', valor: 1 });
  estado = formularioReductor(estado, { type: accionesFormulario.alternarEnLista, campo: 'idsProducto', valor: 2 });
  estado = formularioReductor(estado, { type: accionesFormulario.alternarEnLista, campo: 'idsProducto', valor: 1 });
  assert.deepEqual(estado.datos, { idTratamiento: '4', idsProducto: [2] });
  assert.deepEqual(iniciales.idsProducto, [], 'no muta los datos iniciales');

  estado = formularioReductor(estado, { type: accionesFormulario.enviar });
  assert.equal(estado.guardando, true);
  estado = formularioReductor(estado, { type: accionesFormulario.fallo, error: 'Sin conexión' });
  assert.deepEqual([estado.guardando, estado.error], [false, 'Sin conexión']);
  estado = formularioReductor(estado, { type: accionesFormulario.exito, reiniciar: true });
  assert.deepEqual(estado.datos, iniciales);

  estado = formularioReductor(estado, { type: accionesFormulario.cambiarCampo, campo: 'idTratamiento', valor: '7' });
  estado = formularioReductor(estado, { type: accionesFormulario.reiniciar });
  assert.equal(estado.datos.idTratamiento, '');
  estado = formularioReductor(estado, { type: accionesFormulario.cargarOpciones, opciones: { productos: [1] } });
  assert.deepEqual(estado.opciones, { productos: [1] });
});

test('pwa: conexión, instalación, actualización y servidor', () => {
  let estado = crearEstadoPwa({ enLinea: true });
  estado = pwaReductor(estado, { type: accionesPwa.cambiarConexion, enLinea: false });
  assert.equal(estado.enLinea, false);
  estado = pwaReductor(estado, { type: accionesPwa.instalacionDisponible });
  assert.equal(estado.instalable, true);
  estado = pwaReductor(estado, { type: accionesPwa.instalada });
  assert.deepEqual([estado.instalable, estado.instalada], [false, true]);
  // ya instalada: no se vuelve a ofrecer
  assert.equal(pwaReductor(estado, { type: accionesPwa.instalacionDisponible }).instalable, false);
  estado = pwaReductor(estado, { type: accionesPwa.actualizacionDisponible });
  estado = pwaReductor(estado, { type: accionesPwa.listaSinConexion });
  estado = pwaReductor(estado, { type: accionesPwa.marcarServidor, disponible: false });
  assert.deepEqual([estado.actualizacionDisponible, estado.funcionaSinConexion, estado.servidorDisponible], [true, true, false]);
});

test('dashboard: periodos, filtros, carga y modal de gasto', () => {
  assert.deepEqual(periodosDashboard.map((periodo) => periodo.dias), [7, 30, 90, 365]);
  let estado = dashboardReductor(estadoInicialDashboard, { type: accionesDashboard.cambiarDias, dias: '90' });
  assert.equal(estado.dias, 90);
  estado = dashboardReductor(estado, { type: accionesDashboard.cambiarSucursal, idSucursal: '2' });
  estado = dashboardReductor(estado, { type: accionesDashboard.sucursalesCargadas, sucursales: [{ idSucursal: 2 }] });
  estado = dashboardReductor(estado, { type: accionesDashboard.cargaFallida, error: 'Error 500' });
  assert.deepEqual([estado.cargando, estado.error], [false, 'Error 500']);
  estado = dashboardReductor(estado, { type: accionesDashboard.cargaInicio });
  assert.deepEqual([estado.cargando, estado.error], [true, '']);
  estado = dashboardReductor(estado, { type: accionesDashboard.cargaExitosa, datos: { indicadores: {} } });
  assert.deepEqual(estado.datos, { indicadores: {} });
  estado = dashboardReductor(estado, { type: accionesDashboard.abrirGasto });
  assert.equal(estado.registrandoGasto, true);
  assert.equal(dashboardReductor(estado, { type: accionesDashboard.cerrarGasto }).registrandoGasto, false);
});
