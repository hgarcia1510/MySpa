import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAvisos } from '../contexto/AvisosContexto';
import { BotonCarga, CargaSeccion, EstadoVacio } from './Cargando';
import { IconoReloj } from './Iconos';

/** Ventana para elegir qué horarios tiene una sala (relación Sala N:N Horario). */
export default function AsignarHorarios({ sala, alCerrar }) {
  const { avisarExito, avisarError } = useAvisos();
  const [horarios, setHorarios] = useState(null);
  const [idsSeleccionados, setIdsSeleccionados] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([api.horarios.listar(), api.salas.obtenerHorarios(sala.idSala)])
      .then(([todos, asignados]) => {
        setHorarios(todos);
        setIdsSeleccionados(asignados.map((horario) => horario.idHorario));
      })
      .catch((error) => avisarError('No se pudieron cargar los horarios', error.message));
  }, [sala, avisarError]);

  const alternar = (idHorario) =>
    setIdsSeleccionados((actuales) => (actuales.includes(idHorario) ? actuales.filter((id) => id !== idHorario) : [...actuales, idHorario]));

  async function guardar() {
    setGuardando(true);
    try {
      await api.salas.asignarHorarios(sala.idSala, idsSeleccionados);
      avisarExito('Horarios guardados', `${sala.nombre} tiene ${idsSeleccionados.length} horario(s) disponibles.`);
      alCerrar();
    } catch (errorGuardar) {
      avisarError('No se pudieron guardar', errorGuardar.message);
    } finally {
      setGuardando(false);
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
                <input type="checkbox" checked={idsSeleccionados.includes(horario.idHorario)} onChange={() => alternar(horario.idHorario)} />
                {formatearHora(horario.horaInicio)} - {formatearHora(horario.horaFin)}
              </label>
            ))}
          </div>
        ) : (
          <EstadoVacio titulo="No hay horarios registrados" mensaje="Se dan de alta desde la app móvil." Icono={IconoReloj} />
        )}
        <div className="accionesModal">
          <button type="button" className="botonSecundario" onClick={alCerrar}>Cancelar</button>
          <BotonCarga type="button" cargando={guardando} onClick={guardar}>Guardar horarios</BotonCarga>
        </div>
      </div>
    </div>
  );
}
