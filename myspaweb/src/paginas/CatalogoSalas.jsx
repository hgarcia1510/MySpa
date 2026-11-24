import { useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatearFechaBd, roles } from '@myspa/compartido';
import { api, urlServidor } from '../api';
import { useSesion } from '../contexto/SesionContexto';
import { useAvisos } from '../contexto/AvisosContexto';
import { usePwa } from '../contexto/PwaContexto';
import Logotipo from '../componentes/Logotipo';
import { BotonCarga, CargaSeccion, EstadoVacio } from '../componentes/Cargando';
import { IconoAlerta, IconoBuscar, IconoCalendario, IconoMasaje, IconoUbicacion } from '../componentes/Iconos';
import { FondosCarrusel, PuntosCarrusel, useCarrusel } from '../componentes/Carrusel';
import { fotoParaSala, fotosSpa, urlFotoSpa } from '../fotosSpa';
import {
  accionesFormulario, accionesSalas, crearEstadoFormulario, estadoInicialSalas, formularioReductor, salasReductor,
} from '../reductores';

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
  const [{ sucursales, salas, idSucursal, buscar, salaReservando, salaMapa }, despachar] = useReducer(salasReductor, estadoInicialSalas);

  useEffect(() => {
    api.sucursales.listar().then((lista) => despachar({ type: accionesSalas.sucursalesCargadas, sucursales: lista })).catch(() => {});
  }, []);
  useEffect(() => {
    const temporizador = setTimeout(
      () => api.salas.listar({ buscar, ...(idSucursal && { idSucursal }) })
        .then((lista) => despachar({ type: accionesSalas.salasCargadas, salas: lista }))
        .catch(() => despachar({ type: accionesSalas.salasCargadas, salas: [] })),
      250
    );
    return () => clearTimeout(temporizador);
  }, [buscar, idSucursal]);

  function reservar(sala) {
    if (!sesion) {
      avisarInfo('Inicia sesión para reservar', 'Si aún no tienes cuenta, puedes crearla en un minuto.');
      return navegar('/iniciarSesion');
    }
    despachar({ type: accionesSalas.abrirReservacion, sala });
  }

  return (
    <section>
      <PortadaSalas />

      <div className="barraBusqueda">
        <select value={idSucursal} onChange={(e) => despachar({ type: accionesSalas.cambiarSucursal, idSucursal: e.target.value })}>
          <option value="">Todas las sucursales</option>
          {sucursales.map((sucursal) => <option key={sucursal.idSucursal} value={sucursal.idSucursal}>{sucursal.nombre}</option>)}
        </select>
        <div className="campoBusqueda">
          <IconoBuscar />
          <input placeholder="Buscar sala…" value={buscar} onChange={(e) => despachar({ type: accionesSalas.cambiarBusqueda, buscar: e.target.value })} />
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
                  <button type="button" className="botonEnlace" onClick={() => despachar({ type: accionesSalas.abrirMapa, sala })}>
                    <IconoUbicacion tamanio={15} /> Ver mapa
                  </button>
                  {sesion?.rol !== roles.empleado && <button className="botonChico" onClick={() => reservar(sala)}><IconoCalendario tamanio={15} /> Reservar</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {salaReservando && (
        <FormularioReservacion sala={salaReservando} alCerrar={() => despachar({ type: accionesSalas.cerrarReservacion })}
          alReservar={() => navegar('/cliente/reservaciones')} />
      )}

      {salaMapa && <MapaSala sala={salaMapa} alCerrar={() => despachar({ type: accionesSalas.cerrarMapa })} />}
    </section>
  );
}

// RF 0406 - Ubicación de la sucursal en el mapa
function MapaSala({ sala, alCerrar }) {
  const { enLinea } = usePwa();
  const coordenadas = `${sala.latitud},${sala.longitud}`;
  return (
    <div className="fondoModal" onClick={alCerrar}>
      <div className="modal modalAncho" onClick={(e) => e.stopPropagation()}>
        <div className="barraTitulo">
          <div>
            <h2>{sala.nombreSucursal}</h2>
            <p className="textoTenue conIcono"><IconoUbicacion tamanio={15} /> {sala.nombre}</p>
          </div>
          <a className="boton botonChico" href={`https://www.google.com/maps/dir/?api=1&destination=${coordenadas}`} target="_blank" rel="noreferrer">
            Cómo llegar
          </a>
        </div>
        {enLinea ? (
          <iframe className="mapaSucursal" title={`Mapa de ${sala.nombreSucursal}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${coordenadas}&z=16&output=embed`} />
        ) : (
          <div className="mapaSucursal mapaSinConexion">
            <EstadoVacio titulo="Sin conexión" mensaje="El mapa necesita internet. Vuelve a intentarlo cuando tengas conexión." Icono={IconoUbicacion} />
          </div>
        )}
        <div className="accionesModal"><button type="button" className="botonSecundario" onClick={alCerrar}>Cerrar</button></div>
      </div>
    </div>
  );
}

function FormularioReservacion({ sala, alCerrar, alReservar }) {
  const { avisarExito, confirmar } = useAvisos();
  const [{ datos, error, guardando, opciones }, despachar] = useReducer(formularioReductor, { dia: '', hora: '' }, crearEstadoFormulario);
  const { horarios } = opciones;
  const { dia, hora } = datos;
  const cambiarCampo = (campo) => (e) => despachar({ type: accionesFormulario.cambiarCampo, campo, valor: e.target.value });

  useEffect(() => {
    api.salas.obtenerHorarios(sala.idSala).then((lista) => despachar({ type: accionesFormulario.cargarOpciones, opciones: { horarios: lista } }));
  }, [sala]);

  async function confirmarReservacion(evento) {
    evento.preventDefault();
    const confirmado = await confirmar({
      titulo: '¿Confirmar reservación?',
      mensaje: `${sala.nombre} · ${dia.split('-').reverse().join('/')} a las ${hora.slice(0, 5)} hrs. Te enviaremos un correo con los datos.`,
      textoAceptar: 'Sí, reservar',
    });
    if (!confirmado) return;
    despachar({ type: accionesFormulario.enviar });
    try {
      await api.reservaciones.crear({ idSala: sala.idSala, fecha: `${dia} ${hora}` });
      despachar({ type: accionesFormulario.exito });
      avisarExito('¡Reservación confirmada!', 'Revisa tu correo, te enviamos los detalles.');
      alReservar();
    } catch (errorReservar) {
      despachar({ type: accionesFormulario.fallo, error: errorReservar.message });
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
              <input type="date" required value={dia} min={formatearFechaBd().slice(0, 10)} onChange={cambiarCampo('dia')} />
            </label>
            <label className="campo"><span>Horario</span>
              {horarios.length ? (
                <select required value={hora} onChange={cambiarCampo('hora')}>
                  <option value="">Selecciona…</option>
                  {horarios.map((horario) => (
                    <option key={horario.idHorario} value={horario.horaInicio}>{horario.horaInicio.slice(0, 5)} - {horario.horaFin.slice(0, 5)}</option>
                  ))}
                </select>
              ) : (
                <input type="time" required value={hora} onChange={cambiarCampo('hora')} />
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
