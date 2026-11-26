import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { estatusReservacion, formatearFecha, formatearMoneda } from '@myspa/compartido';
import { api } from '../../api';
import { useAvisos } from '../../contexto/AvisosContexto';
import DetalleServicio from '../../componentes/DetalleServicio';
import { CargaSeccion, EstadoVacio } from '../../componentes/Cargando';
import { IconoBrillo, IconoCalendario, IconoMas, IconoUbicacion } from '../../componentes/Iconos';

// RNF 0104 - Histórico de reservaciones del cliente, cancelación y detalle con costos
export default function MisReservaciones() {
  const { avisarExito, avisarError, confirmar } = useAvisos();
  const [reservaciones, setReservaciones] = useState(null);
  const [detalle, setDetalle] = useState(null);

  const cargar = () => api.reservaciones.listarMias().then(setReservaciones).catch((e) => avisarError('No se pudieron cargar', e.message));
  useEffect(() => { cargar(); }, []);

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
              <div className="tituloConEstatus">
                <h3>{reservacion.nombreSala}</h3>
                <span className={`etiqueta etiqueta${reservacion.estatus}`}>{reservacion.estatus}</span>
              </div>
              <span className="textoTenue conIcono"><IconoCalendario tamanio={14} /> {formatearFecha(reservacion.fecha)}</span>
              <span className="textoTenue conIcono"><IconoUbicacion tamanio={14} /> {reservacion.nombreSucursal}</span>
              {reservacion.costoServicio && <b className="costoTratamiento">Total: {formatearMoneda(reservacion.costoServicio)}</b>}
              <div className="accionesFila">
                {reservacion.idServicio && (
                  <button className="botonSecundario botonChico" onClick={() => api.reservaciones.obtenerDetalle(reservacion.idReservacion).then(setDetalle)}>
                    Ver detalle
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
        <div className="fondoModal" onClick={() => setDetalle(null)}>
          <div className="modal modalAncho" onClick={(e) => e.stopPropagation()}>
            <DetalleServicio servicio={detalle.servicio} />
            <div className="accionesModal"><button onClick={() => setDetalle(null)}>Cerrar</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
