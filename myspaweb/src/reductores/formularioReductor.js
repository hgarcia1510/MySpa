// Reductor genérico de formularios: datos capturados, error y estado de guardado.
// Uso: const [formulario, despachar] = useReducer(formularioReductor, datosIniciales, crearEstadoFormulario);
export const accionesFormulario = {
  cambiarCampo: 'formulario/cambiarCampo',
  alternarEnLista: 'formulario/alternarEnLista',
  cargarOpciones: 'formulario/cargarOpciones',
  enviar: 'formulario/enviar',
  exito: 'formulario/exito',
  fallo: 'formulario/fallo',
  reiniciar: 'formulario/reiniciar',
};

export function crearEstadoFormulario(datosIniciales = {}) {
  return { datos: { ...datosIniciales }, datosIniciales, error: '', guardando: false, opciones: {} };
}

export function formularioReductor(estado, accion) {
  switch (accion.type) {
    case accionesFormulario.cambiarCampo:
      return { ...estado, datos: { ...estado.datos, [accion.campo]: accion.valor }, error: '' };
    case accionesFormulario.alternarEnLista: {
      // Para casillas: agrega el valor al arreglo o lo quita si ya estaba
      const lista = estado.datos[accion.campo] ?? [];
      const nuevaLista = lista.includes(accion.valor) ? lista.filter((valor) => valor !== accion.valor) : [...lista, accion.valor];
      return { ...estado, datos: { ...estado.datos, [accion.campo]: nuevaLista } };
    }
    case accionesFormulario.cargarOpciones:
      // Listas para los select/casillas (clientes, salas, productos…) que llegan de la API
      return { ...estado, opciones: { ...estado.opciones, ...accion.opciones } };
    case accionesFormulario.enviar:
      return { ...estado, guardando: true, error: '' };
    case accionesFormulario.exito:
      return { ...estado, guardando: false, error: '', datos: accion.reiniciar ? { ...estado.datosIniciales } : estado.datos };
    case accionesFormulario.fallo:
      return { ...estado, guardando: false, error: accion.error };
    case accionesFormulario.reiniciar: {
      const datosIniciales = accion.datosIniciales ?? estado.datosIniciales;
      return { ...estado, datos: { ...datosIniciales }, datosIniciales, error: '', guardando: false };
    }
    default:
      return estado;
  }
}
