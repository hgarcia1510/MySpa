import { useCallback, useEffect, useReducer } from 'react';
import { Link } from 'react-router-dom';
import { estatusReservacion, formatearFecha, formatearMoneda } from '@myspa/compartido';
import { api } from '../../api';
import { useAvisos } from '../../contexto/AvisosContexto';
import DetalleServicio from '../../componentes/DetalleServicio';
import { BotonCarga, CargaSeccion, EstadoVacio } from '../../componentes/Cargando';
import { IconoAlerta, IconoBrillo, IconoCalendario, IconoEstrella, IconoMas, IconoUbicacion } from '../../componentes/Iconos';
import {
  accionesFormulario, accionesMisReservaciones, crearEstadoFormulario, estadoInicialMisReservaciones, formularioReductor, misReservacionesReductor,
} from '../../reductores';

/** Muestra de 1 a 5 estrellas (solo lectura). */
export function Estrellas({ calificacion, tamanio = 16 }) {
  return (
    <span className="estrellas" aria-label={`${calificacion} de 5 estrellas`} title={`${calificacion} de 5`}>
      {[1, 2, 3, 4, 5].map((numero) => (
        <span key={numero} className={numero <= calificacion ? 'estrellaMarcada' : ''}><IconoEstrella tamanio={tamanio} relleno={numero <= calificacion} /></span>
      ))}
    </span>
  );
}

// RNF 0104 - Histórico de reservaciones del cliente, cancelación, detalle con costos y reseñas
export default function MisReservaciones() {
  const { avisarExito, avisarError, confirmar } = useAvisos();
  const [{ reservaciones, detalle, calificando }, despachar] = useReducer(misReservacionesReductor, estadoInicialMisReservaciones);

  const cargar = useCallback(
    () => api.reservaciones.listarMias()
      .then((lista) => despachar({ type: accionesMisReservaciones.cargadas, reservaciones: lista }))
      .catch((e) => avisarError('No se pudieron cargar', e.message)),
    [avisarError]
  );
  useEffect(() => { cargar(); }, [cargar]);

  async function cancelar(reservacion) {
    const confirmado = await confirmar({
      titulo: '¿Cancelar tu reservación?',
      mensaje: `${reservacion.nombreSala} · ${formatearFecha(reservacion.fecha)}. Te enviaremos un correo de confirmación.`,
      textoAceptar: 'Sí, cancelar',
      textoCancelar: 'Conservarla',
      peligro: true,
    });
    if (!confirmado) return;
    try {
      await api.reservaciones.cancelar(reservacion.idReservacion);
      avisarExito('Reservación cancelada', 'Te enviamos un correo con la confirmación.');
      cargar();
    } catch (error) {
      avisarError('No se pudo cancelar', error.message);
    }
  }

  async function verDetalle(reservacion) {
    try {
      despachar({ type: accionesMisReservaciones.mostrarDetalle, detalle: await api.reservaciones.obtenerDetalle(reservacion.idReservacion) });
    } catch (error) {
      avisarError('No se pudo abrir el detalle', error.message);
    }
  }

  const cerrarDetalle = () => despachar({ type: accionesMisReservaciones.cerrarDetalle });

  return (
    <section>
      <div className="encabezadoPagina">
        <div>
          <h1>Mis reservaciones</h1>
          <p>Tu historial completo, de la más reciente a la más antigua.</p>
        </div>
        <Link to="/cliente/salas" className="boton"><IconoMas /> Nueva reservación</Link>
      </div>

      {!reservaciones ? <CargaSeccion texto="Cargando tus reservaciones…" /> : !reservaciones.length ? (
        <EstadoVacio titulo="Aún no tienes reservaciones" mensaje="Explora nuestras salas y reserva tu primera sesión." Icono={IconoBrillo} />
      ) : (
        <div className="rejillaTarjetas">
          {reservaciones.map((reservacion) => (
            <article key={reservacion.idReservacion} className="tarjeta tarjetaInteractiva">
              <div className="barraTitulo">
                <h3>{reservacion.nombreSala}</h3>
                <span className={`etiqueta etiqueta${reservacion.estatus}`}>{reservacion.estatus}</span>
              </div>
              <span className="textoTenue conIcono"><IconoCalendario tamanio={14} /> {formatearFecha(reservacion.fecha)}</span>
              <span className="textoTenue conIcono"><IconoUbicacion tamanio={14} /> {reservacion.nombreSucursal}</span>
              {reservacion.costoServicio && <b className="costoTratamiento">Total: {formatearMoneda(reservacion.costoServicio)}</b>}
              {reservacion.calificacion && <Estrellas calificacion={reservacion.calificacion} />}
              <div className="accionesFila">
                {reservacion.idServicio && (
                  <button className="botonSecundario botonChico" onClick={() => verDetalle(reservacion)}>Ver detalle</button>
                )}
                {reservacion.estatus === estatusReservacion.atendida && !reservacion.calificacion && (
                  <button className="botonChico" onClick={() => despachar({ type: accionesMisReservaciones.abrirCalificacion, reservacion })}>
                    <IconoEstrella tamanio={14} /> Calificar
                  </button>
                )}
                {reservacion.estatus === estatusReservacion.pendiente && (
                  <button className="botonPeligro botonChico" onClick={() => cancelar(reservacion)}>Cancelar</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {detalle?.servicio && (
        <div className="fondoModal" onClick={cerrarDetalle}>
          <div className="modal modalAncho" onClick={(e) => e.stopPropagation()}>
            <DetalleServicio servicio={detalle.servicio} />
            <div className="accionesModal"><button onClick={cerrarDetalle}>Cerrar</button></div>
          </div>
        </div>
      )}

      {calificando && (
        <FormularioResena
          reservacion={calificando}
          alCerrar={() => despachar({ type: accionesMisReservaciones.cerrarCalificacion })}
          alGuardar={(resena) => {
            despachar({ type: accionesMisReservaciones.resenaGuardada, ...resena });
            avisarExito('¡Gracias por tu opinión!', 'Tu calificación nos ayuda a mejorar.');
          }}
        />
      )}
    </section>
  );
}

/** Modal para calificar con 5 estrellas y comentario opcional. */
function FormularioResena({ reservacion, alCerrar, alGuardar }) {
  const [{ datos, error, guardando }, despachar] = useReducer(formularioReductor, { calificacion: 0, comentario: '' }, crearEstadoFormulario);

  async function guardar(evento) {
    evento.preventDefault();
    if (!datos.calificacion) return despachar({ type: accionesFormulario.fallo, error: 'Elige de 1 a 5 estrellas.' });
    despachar({ type: accionesFormulario.enviar });
    try {
      const resena = await api.resenas.crear({ idReservacion: reservacion.idReservacion, ...datos });
      despachar({ type: accionesFormulario.exito });
      alGuardar({ idReservacion: reservacion.idReservacion, calificacion: resena.calificacion, comentario: resena.comentario });
    } catch (errorGuardar) {
      despachar({ type: accionesFormulario.fallo, error: errorGuardar.message });
    }
  }

  return (
    <div className="fondoModal" onClick={alCerrar}>
      <form className="modal modalChico" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <h2>¿Cómo te fue en {reservacion.nombreSala}?</h2>
        <p>{formatearFecha(reservacion.fecha)}</p>
        <div className="selectorEstrellas" role="radiogroup" aria-label="Calificación">
          {[1, 2, 3, 4, 5].map((numero) => (
            <button key={numero} type="button" role="radio" aria-checked={datos.calificacion === numero} aria-label={`${numero} estrellas`}
              className={numero <= datos.calificacion ? 'estrellaMarcada' : ''}
              onClick={() => despachar({ type: accionesFormulario.cambiarCampo, campo: 'calificacion', valor: numero })}>
              <IconoEstrella tamanio={32} relleno={numero <= datos.calificacion} />
            </button>
          ))}
        </div>
        <label className="campo" style={{ width: '100%', textAlign: 'left' }}>
          <span>Comentario (opcional)</span>
          <textarea maxLength={500} value={datos.comentario}
            onChange={(e) => despachar({ type: accionesFormulario.cambiarCampo, campo: 'comentario', valor: e.target.value })} />
        </label>
        {error && <p className="mensajeError"><IconoAlerta tamanio={16} /> {error}</p>}
        <div className="accionesModal">
          <button type="button" className="botonSecundario" onClick={alCerrar}>Ahora no</button>
          <BotonCarga type="submit" cargando={guardando}>Enviar calificación</BotonCarga>
        </div>
      </form>
    </div>
  );
}
