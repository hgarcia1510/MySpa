import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatearFechaBd, roles } from '@myspa/compartido';
import { api, urlServidor } from '../api';
import { useSesion } from '../contexto/SesionContexto';
import { useAvisos } from '../contexto/AvisosContexto';
import Logotipo from '../componentes/Logotipo';
import { BotonCarga, CargaSeccion, EstadoVacio } from '../componentes/Cargando';
import { IconoAlerta, IconoBuscar, IconoCalendario, IconoMasaje, IconoUbicacion } from '../componentes/Iconos';
import { FondosCarrusel, PuntosCarrusel, useCarrusel } from '../componentes/Carrusel';
import { fotoParaSala, fotosSpa, urlFotoSpa } from '../fotosSpa';

// Fotos del carrusel de la portada (distintas a las del login)
const fotosPortada = [6, 3, 1, 9, 10].map((indice) => ({
  ...fotosSpa[indice],
  fondo: `url('${urlFotoSpa(fotosSpa[indice], 1800, 700)}')`,
}));

/** Portada "Encuentra tu sala ideal" con carrusel de fotos. */
function PortadaSalas() {
  const [fotoActual, setFotoActual] = useCarrusel(fotosPortada.length, 5);
  return (
    <div className="heroSalas">
      <FondosCarrusel fotos={fotosPortada} actual={fotoActual} />
      <div className="contenidoHero">
        <h1>Encuentra tu sala ideal</h1>
        <p>Elige la sucursal más cercana, conoce nuestras salas y reserva tu próxima sesión de relajación.</p>
      </div>
      <div className="pieCarrusel contenidoHero">
        <p key={fotoActual} className="tituloFoto">{fotosPortada[fotoActual].titulo}</p>
        <PuntosCarrusel fotos={fotosPortada} actual={fotoActual} alCambiar={setFotoActual} />
      </div>
    </div>
  );
}

/** Foto de la sala: la que subió el empleado o, si no tiene, una del banco distinta para cada sala. */
function FotoSala({ sala }) {
  const [fallo, setFallo] = useState(false);
  const url = sala.rutaFotografia ? `${urlServidor}${sala.rutaFotografia}` : urlFotoSpa(fotoParaSala(sala.idSala), 700, 460);
  if (fallo) return <div className="imagenVacia"><Logotipo tamanio={64} /></div>;
  return <img src={url} alt={sala.nombre} loading="lazy" onError={() => setFallo(true)} />;
}

// RF 0505 - Catálogo de salas para clientes, con búsqueda por sucursal
export default function CatalogoSalas() {
  const { sesion } = useSesion();
  const { avisarInfo } = useAvisos();
  const navegar = useNavigate();
  const [sucursales, setSucursales] = useState([]);
  const [salas, setSalas] = useState(null);
  const [idSucursal, setIdSucursal] = useState('');
  const [buscar, setBuscar] = useState('');
  const [salaReservando, setSalaReservando] = useState(null);

  useEffect(() => { api.sucursales.listar().then(setSucursales); }, []);
  useEffect(() => {
    const temporizador = setTimeout(() => api.salas.listar({ buscar, ...(idSucursal && { idSucursal }) }).then(setSalas), 250);
    return () => clearTimeout(temporizador);
  }, [buscar, idSucursal]);

  function reservar(sala) {
    if (!sesion) {
      avisarInfo('Inicia sesión para reservar', 'Si aún no tienes cuenta, puedes crearla en un minuto.');
      return navegar('/iniciarSesion');
    }
    setSalaReservando(sala);
  }

  return (
    <section>
      <PortadaSalas />

      <div className="barraBusqueda">
        <select value={idSucursal} onChange={(e) => setIdSucursal(e.target.value)}>
          <option value="">Todas las sucursales</option>
          {sucursales.map((sucursal) => <option key={sucursal.idSucursal} value={sucursal.idSucursal}>{sucursal.nombre}</option>)}
        </select>
        <div className="campoBusqueda">
          <IconoBuscar />
          <input placeholder="Buscar sala…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        </div>
      </div>

      {!salas ? (
        <CargaSeccion texto="Buscando salas disponibles…" />
      ) : !salas.length ? (
        <EstadoVacio titulo="No encontramos salas" mensaje="Prueba con otra sucursal o con otra búsqueda." Icono={IconoMasaje} />
      ) : (
        <div className="rejillaTarjetas">
          {salas.map((sala) => (
            <article key={sala.idSala} className="tarjeta tarjetaInteractiva tarjetaSala">
              <div className="imagenSala">
                <FotoSala sala={sala} />
                <span className="insigniaSucursal"><IconoUbicacion tamanio={13} /> {sala.nombreSucursal}</span>
              </div>
              <div className="cuerpoSala">
                <h3>{sala.nombre}</h3>
                <p>{sala.descripcion || 'Un espacio diseñado para tu descanso.'}</p>
                <div className="pieSala">
                  <a href={`https://www.google.com/maps?q=${sala.latitud},${sala.longitud}`} target="_blank" rel="noreferrer">
                    <IconoUbicacion tamanio={15} /> Ver mapa
                  </a>
                  {sesion?.rol !== roles.empleado && <button className="botonChico" onClick={() => reservar(sala)}><IconoCalendario tamanio={15} /> Reservar</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {salaReservando && (
        <FormularioReservacion sala={salaReservando} alCerrar={() => setSalaReservando(null)}
          alReservar={() => navegar('/cliente/reservaciones')} />
      )}
    </section>
  );
}

function FormularioReservacion({ sala, alCerrar, alReservar }) {
  const { avisarExito, confirmar } = useAvisos();
  const [horarios, setHorarios] = useState(null);
  const [dia, setDia] = useState('');
  const [hora, setHora] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { api.salas.obtenerHorarios(sala.idSala).then(setHorarios); }, [sala]);

  async function confirmarReservacion(evento) {
    evento.preventDefault();
    const confirmado = await confirmar({
      titulo: '¿Confirmar reservación?',
      mensaje: `${sala.nombre} · ${dia.split('-').reverse().join('/')} a las ${hora.slice(0, 5)} hrs. Te enviaremos un correo con los datos.`,
      textoAceptar: 'Sí, reservar',
    });
    if (!confirmado) return;
    setGuardando(true);
    try {
      await api.reservaciones.crear({ idSala: sala.idSala, fecha: `${dia} ${hora}` });
      avisarExito('¡Reservación confirmada!', 'Revisa tu correo, te enviamos los detalles.');
      alReservar();
    } catch (errorReservar) {
      setError(errorReservar.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fondoModal" onClick={alCerrar}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={confirmarReservacion}>
        <h2>Reservar {sala.nombre}</h2>
        <p className="textoTenue conIcono"><IconoUbicacion tamanio={15} /> {sala.nombreSucursal}</p>
        {!horarios ? <CargaSeccion texto="Cargando horarios…" /> : (
          <div className="rejillaFormulario">
            <label className="campo"><span>Día</span>
              <input type="date" required value={dia} min={formatearFechaBd().slice(0, 10)} onChange={(e) => setDia(e.target.value)} />
            </label>
            <label className="campo"><span>Horario</span>
              {horarios.length ? (
                <select required value={hora} onChange={(e) => setHora(e.target.value)}>
                  <option value="">Selecciona…</option>
                  {horarios.map((horario) => (
                    <option key={horario.idHorario} value={horario.horaInicio}>{horario.horaInicio.slice(0, 5)} - {horario.horaFin.slice(0, 5)}</option>
                  ))}
                </select>
              ) : (
                <input type="time" required value={hora} onChange={(e) => setHora(e.target.value)} />
              )}
            </label>
          </div>
        )}
        {error && <p className="mensajeError"><IconoAlerta tamanio={16} /> {error}</p>}
        <div className="accionesModal">
          <button type="button" className="botonSecundario" onClick={alCerrar}>Cancelar</button>
          <BotonCarga type="submit" cargando={guardando}>Reservar</BotonCarga>
        </div>
      </form>
    </div>
  );
}
