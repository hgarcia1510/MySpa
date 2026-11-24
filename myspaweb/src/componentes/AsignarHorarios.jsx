import { useEffect, useReducer } from 'react';
import { api } from '../api';
import { useAvisos } from '../contexto/AvisosContexto';
import { accionesFormulario, crearEstadoFormulario, formularioReductor } from '../reductores';
import { BotonCarga, CargaSeccion, EstadoVacio } from './Cargando';
import { IconoReloj } from './Iconos';

/** Ventana para elegir qué horarios tiene una sala (relación Sala N:N Horario). */
export default function AsignarHorarios({ sala, alCerrar }) {
  const { avisarExito, avisarError } = useAvisos();
  const [{ datos, guardando, opciones }, despachar] = useReducer(formularioReductor, { idsHorario: [] }, crearEstadoFormulario);
  const horarios = opciones.horarios;

  useEffect(() => {
    Promise.all([api.horarios.listar(), api.salas.obtenerHorarios(sala.idSala)])
      .then(([todos, asignados]) => {
        despachar({ type: accionesFormulario.cargarOpciones, opciones: { horarios: todos } });
        despachar({ type: accionesFormulario.reiniciar, datosIniciales: { idsHorario: asignados.map((horario) => horario.idHorario) } });
      })
      .catch((error) => avisarError('No se pudieron cargar los horarios', error.message));
  }, [sala, avisarError]);

  async function guardar() {
    despachar({ type: accionesFormulario.enviar });
    try {
      await api.salas.asignarHorarios(sala.idSala, datos.idsHorario);
      despachar({ type: accionesFormulario.exito });
      avisarExito('Horarios guardados', `${sala.nombre} tiene ${datos.idsHorario.length} horario(s) disponibles.`);
      alCerrar();
    } catch (errorGuardar) {
      despachar({ type: accionesFormulario.fallo, error: errorGuardar.message });
      avisarError('No se pudieron guardar', errorGuardar.message);
    }
  }

  const formatearHora = (hora) => hora.slice(0, 5);

  return (
    <div className="fondoModal" onClick={alCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Horarios de {sala.nombre}</h2>
        <p className="textoTenue">Marca los horarios en los que los clientes pueden reservar esta sala.</p>
        {!horarios ? (
          <CargaSeccion texto="Cargando horarios…" />
        ) : horarios.length ? (
          <div className="listaCasillas">
            {horarios.map((horario) => (
              <label key={horario.idHorario} className="casilla">
                <input type="checkbox" checked={datos.idsHorario.includes(horario.idHorario)}
                  onChange={() => despachar({ type: accionesFormulario.alternarEnLista, campo: 'idsHorario', valor: horario.idHorario })} />
                {formatearHora(horario.horaInicio)} - {formatearHora(horario.horaFin)}
              </label>
            ))}
          </div>
        ) : (
          <EstadoVacio titulo="No hay horarios registrados" mensaje="Agrégalos desde el menú Horarios." Icono={IconoReloj} />
        )}
        <div className="accionesModal">
          <button type="button" className="botonSecundario" onClick={alCerrar}>Cancelar</button>
          <BotonCarga type="button" cargando={guardando} onClick={guardar}>Guardar horarios</BotonCarga>
        </div>
      </div>
    </div>
  );
}
