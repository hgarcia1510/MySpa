import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { estatusReservacion, formatearFecha, formatearFechaBd } from '@myspa/compartido';
import { api } from '../../api';
import { useAvisos } from '../../contexto/AvisosContexto';
import { BotonCarga, EsqueletoTabla, EstadoVacio } from '../../componentes/Cargando';
import { IconoAlerta, IconoBuscar, IconoCalendario, IconoEditar, IconoMas, IconoX } from '../../componentes/Iconos';

// RF 07 - Gestión de reservaciones (espacio de empleados)
export default function Reservaciones() {
  const navegar = useNavigate();
  const { avisarExito, avisarError, confirmar } = useAvisos();
  const [reservaciones, setReservaciones] = useState(null);
  const [buscar, setBuscar] = useState('');
  const [estatus, setEstatus] = useState('');
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(
    () => api.reservaciones.listar({ buscar, ...(estatus && { estatus }) }).then(setReservaciones).catch((e) => avisarError('No se pudieron cargar', e.message)),
    [buscar, estatus, avisarError]
  );
  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);

  async function cancelar(reservacion) {
    const confirmado = await confirmar({
      titulo: `¿Cancelar la reservación #${reservacion.idReservacion}?`,
      mensaje: `${reservacion.nombreCliente} · ${formatearFecha(reservacion.fecha)}. Se le enviará un correo avisándole.`,
      textoAceptar: 'Sí, cancelar',
      textoCancelar: 'No',
      peligro: true,
    });
    if (!confirmado) return;
    try {
      await api.reservaciones.cancelar(reservacion.idReservacion);
      avisarExito('Reservación cancelada', 'Se notificó al cliente por correo.');
      cargar();
    } catch (error) {
      avisarError('No se pudo cancelar', error.message);
    }
  }

  async function atender(reservacion) {
    const confirmado = await confirmar({
      titulo: '¿Atender esta reservación?',
      mensaje: `Se creará el servicio para ${reservacion.nombreCliente} y la reservación quedará como Atendida.`,
      textoAceptar: 'Sí, atender',
    });
    if (!confirmado) return;
    // RF 0901 - crea el servicio y lleva al detalle para agregar tratamientos
    try {
      const servicio = await api.servicios.crear({ idReservacion: reservacion.idReservacion, fecha: formatearFechaBd() });
      avisarExito('Servicio creado', 'Ahora agrega los tratamientos realizados.');
      navegar(`/empleado/servicios?id=${servicio.idServicio}`);
    } catch (errorServicio) {
      avisarError('No se pudo crear el servicio', errorServicio.message);
    }
  }

  return (
    <section>
      <div className="encabezadoPagina">
        <div>
          <h1>Reservaciones</h1>
          <p>De la más reciente a la más antigua. Atiende, edita o cancela las pendientes.</p>
        </div>
        <button onClick={() => setEditando({})}><IconoMas /> Nueva reservación</button>
      </div>
      <div className="barraBusqueda">
        <div className="campoBusqueda">
          <IconoBuscar />
          <input placeholder="Buscar por cliente, sala, sucursal, fecha…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        </div>
        <select value={estatus} onChange={(e) => setEstatus(e.target.value)}>
          <option value="">Todos los estatus</option>
          {Object.values(estatusReservacion).map((valor) => <option key={valor}>{valor}</option>)}
        </select>
      </div>

      {!reservaciones ? <EsqueletoTabla /> : !reservaciones.length ? (
        <div className="contenedorTabla"><EstadoVacio titulo="No hay reservaciones" mensaje="Cuando un cliente reserve, aparecerá aquí." Icono={IconoCalendario} /></div>
      ) : (
        <div className="contenedorTabla">
          <table>
            <thead><tr><th>Folio</th><th>Fecha</th><th>Cliente</th><th>Sala</th><th>Sucursal</th><th>Estatus</th><th /></tr></thead>
            <tbody>
              {reservaciones.map((reservacion) => (
                <tr key={reservacion.idReservacion}>
                  <td><b>#{reservacion.idReservacion}</b></td>
                  <td>{formatearFecha(reservacion.fecha)}</td>
                  <td>{reservacion.nombreCliente}</td>
                  <td>{reservacion.nombreSala}</td>
                  <td>{reservacion.nombreSucursal}</td>
                  <td><span className={`etiqueta etiqueta${reservacion.estatus}`}>{reservacion.estatus}</span></td>
                  <td>
                    <div className="accionesFila">
                      {reservacion.estatus === estatusReservacion.pendiente && (
                        <>
                          <button className="botonChico" onClick={() => atender(reservacion)}>Atender</button>
                          <button className="botonSecundario botonChico" onClick={() => setEditando(reservacion)} title="Editar"><IconoEditar tamanio={15} /></button>
                          <button className="botonPeligro botonChico" onClick={() => cancelar(reservacion)} title="Cancelar"><IconoX tamanio={15} /></button>
                        </>
                      )}
                      {reservacion.idServicio && (
                        <button className="botonSecundario botonChico" onClick={() => navegar(`/empleado/servicios?id=${reservacion.idServicio}`)}>Ver servicio</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <FormularioReservacion reservacion={editando} alCerrar={() => setEditando(null)}
          alGuardar={(esAlta) => { setEditando(null); avisarExito(esAlta ? 'Reservación creada' : 'Reservación actualizada', esAlta ? 'Se envió un correo al cliente.' : undefined); cargar(); }} />
      )}
    </section>
  );
}

function FormularioReservacion({ reservacion, alCerrar, alGuardar }) {
  const esAlta = !reservacion.idReservacion;
  const [clientes, setClientes] = useState([]);
  const [salas, setSalas] = useState([]);
  const [datos, setDatos] = useState({
    idCliente: reservacion.idCliente ?? '',
    idSala: reservacion.idSala ?? '',
    fecha: reservacion.fecha ? reservacion.fecha.slice(0, 16).replace(' ', 'T') : '',
  });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.clientes.listar().then(setClientes);
    api.salas.listar().then(setSalas);
  }, []);

  async function guardar(evento) {
    evento.preventDefault();
    const cuerpo = { ...datos, fecha: datos.fecha.replace('T', ' ') };
    setGuardando(true);
    try {
      if (esAlta) await api.reservaciones.crear(cuerpo);
      else await api.reservaciones.actualizar(reservacion.idReservacion, { fecha: cuerpo.fecha, idSala: cuerpo.idSala });
      alGuardar(esAlta);
    } catch (errorGuardar) {
      setError(errorGuardar.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fondoModal" onClick={alCerrar}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <h2>{esAlta ? 'Nueva reservación' : `Editar reservación #${reservacion.idReservacion}`}</h2>
        <label className="campo"><span>Cliente</span>
          <select required disabled={!esAlta} value={datos.idCliente} onChange={(e) => setDatos({ ...datos, idCliente: e.target.value })}>
            <option value="">Selecciona…</option>
            {clientes.map((cliente) => (
              <option key={cliente.idCliente} value={cliente.idCliente}>{cliente.nombre} {cliente.apellidoPaterno} ({cliente.numeroUnico})</option>
            ))}
          </select>
        </label>
        <div className="rejillaFormulario">
          <label className="campo"><span>Sala</span>
            <select required value={datos.idSala} onChange={(e) => setDatos({ ...datos, idSala: e.target.value })}>
              <option value="">Selecciona…</option>
              {salas.map((sala) => <option key={sala.idSala} value={sala.idSala}>{sala.nombre} — {sala.nombreSucursal}</option>)}
            </select>
          </label>
          <label className="campo"><span>Fecha y hora</span>
            <input type="datetime-local" required value={datos.fecha} onChange={(e) => setDatos({ ...datos, fecha: e.target.value })} />
          </label>
        </div>
        {error && <p className="mensajeError"><IconoAlerta tamanio={16} /> {error}</p>}
        <div className="accionesModal">
          <button type="button" className="botonSecundario" onClick={alCerrar}>Cerrar</button>
          <BotonCarga type="submit" cargando={guardando}>Guardar</BotonCarga>
        </div>
      </form>
    </div>
  );
}
