export function crearClienteApi({ urlBase, obtenerToken }) {
  async function peticion(ruta, { metodo = 'GET', cuerpo } = {}) {
    const token = obtenerToken ? await obtenerToken() : null;
    const esFormulario = typeof FormData !== 'undefined' && cuerpo instanceof FormData;
    const encabezados = {};
    if (token) encabezados.Authorization = `Bearer ${token}`;
    if (cuerpo && !esFormulario) encabezados['Content-Type'] = 'application/json';

    const respuesta = await fetch(`${urlBase}${ruta}`, {
      method: metodo,
      headers: encabezados,
      body: cuerpo ? (esFormulario ? cuerpo : JSON.stringify(cuerpo)) : undefined,
    });
    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) throw new Error(datos?.mensaje || `Error ${respuesta.status}`);
    return datos;
  }

  const crearRecurso = (recurso) => ({
    listar: ({ buscar = '', inactivos = false, ...filtros } = {}) => {
      const parametros = new URLSearchParams({ buscar, inactivos: inactivos ? '1' : '0', ...filtros });
      return peticion(`/${recurso}?${parametros}`);
    },
    obtener: (id) => peticion(`/${recurso}/${id}`),
    crear: (datos) => peticion(`/${recurso}`, { metodo: 'POST', cuerpo: datos }),
    actualizar: (id, datos) => peticion(`/${recurso}/${id}`, { metodo: 'PUT', cuerpo: datos }),
    eliminar: (id) => peticion(`/${recurso}/${id}`, { metodo: 'DELETE' }),
  });

  return {
    peticion,
    autenticacion: {
      iniciarSesion: (nombreUsuario, contrasenia) =>
        peticion('/autenticacion/iniciarSesion', { metodo: 'POST', cuerpo: { nombreUsuario, contrasenia } }),
      registrarCliente: (datos) => peticion('/autenticacion/registro', { metodo: 'POST', cuerpo: datos }),
      obtenerMiPerfil: () => peticion('/autenticacion/miPerfil'),
      actualizarMiPerfil: (datos) => peticion('/autenticacion/miPerfil', { metodo: 'PUT', cuerpo: datos }),
    },
    empleados: crearRecurso('empleados'),
    clientes: crearRecurso('clientes'),
    productos: crearRecurso('productos'),
    sucursales: crearRecurso('sucursales'),
    horarios: crearRecurso('horarios'),
    tratamientos: crearRecurso('tratamientos'),
    salas: {
      ...crearRecurso('salas'),
      obtenerHorarios: (idSala) => peticion(`/salas/${idSala}/horarios`),
      asignarHorarios: (idSala, idsHorario) =>
        peticion(`/salas/${idSala}/horarios`, { metodo: 'PUT', cuerpo: { idsHorario } }),
    },
    reservaciones: {
      ...crearRecurso('reservaciones'),
      cancelar: (idReservacion) => peticion(`/reservaciones/${idReservacion}/cancelar`, { metodo: 'PATCH' }),
      listarMias: () => peticion('/reservaciones/mias'),
      obtenerDetalle: (idReservacion) => peticion(`/reservaciones/${idReservacion}/detalle`),
    },
    resenas: {
      crear: ({ idReservacion, calificacion, comentario }) =>
        peticion('/resenas', { metodo: 'POST', cuerpo: { idReservacion, calificacion, comentario } }),
    },
    dashboard: {
      obtener: ({ dias = 30, idSucursal = '' } = {}) => {
        const parametros = new URLSearchParams({ dias: String(dias), ...(idSucursal && { idSucursal: String(idSucursal) }) });
        return peticion(`/dashboard?${parametros}`);
      },
      registrarGasto: (datos) => peticion('/dashboard/gastos', { metodo: 'POST', cuerpo: datos }),
      eliminarGasto: (idGasto) => peticion(`/dashboard/gastos/${idGasto}`, { metodo: 'DELETE' }),
    },
    servicios: {
      ...crearRecurso('servicios'),
      obtenerDetalle: (idServicio) => peticion(`/servicios/${idServicio}/detalle`),
      agregarTratamiento: (idServicio, { idTratamiento, idsProducto }) =>
        peticion(`/servicios/${idServicio}/tratamientos`, {
          metodo: 'POST',
          cuerpo: { idTratamiento, idsProducto },
        }),
      quitarTratamiento: (idServicio, idServicioTratamiento) =>
        peticion(`/servicios/${idServicio}/tratamientos/${idServicioTratamiento}`, { metodo: 'DELETE' }),
    },
  };
}