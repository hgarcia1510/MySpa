import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatearFecha, formatearMoneda } from '@myspa/compartido';
import { api } from '../../api';
import { useAvisos } from '../../contexto/AvisosContexto';
import DetalleServicio from '../../componentes/DetalleServicio';
import { BotonCarga, CargaSeccion, EsqueletoTabla, EstadoVacio } from '../../componentes/Cargando';
import { IconoBasura, IconoBuscar, IconoFlechaIzquierda, IconoMas, IconoMasaje } from '../../componentes/Iconos';

// RF 09 y RF 10 - Servicios y tratamientos en servicios
export default function Servicios() {
  const { avisarExito, avisarError, confirmar } = useAvisos();
  const [parametros, setParametros] = useSearchParams();
  const idSeleccionado = parametros.get('id');
  const [servicios, setServicios] = useState(null);
  const [buscar, setBuscar] = useState('');
  const [servicio, setServicio] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargar = useCallback(() => api.servicios.listar({ buscar }).then(setServicios), [buscar]);
  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);

  useEffect(() => {
    if (!idSeleccionado) return setServicio(null);
    setCargandoDetalle(true);
    api.servicios.obtenerDetalle(idSeleccionado)
      .then(setServicio)
      .catch((error) => avisarError('No se pudo abrir el servicio', error.message))
      .finally(() => setCargandoDetalle(false));
  }, [idSeleccionado, avisarError]);

  async function quitarTratamiento(tratamiento) {
    const confirmado = await confirmar({
      titulo: `¿Quitar "${tratamiento.nombre}"?`,
      mensaje: `Se restarán ${formatearMoneda(tratamiento.costo)} al costo del servicio.`,
      textoAceptar: 'Sí, quitar',
      peligro: true,
    });
    if (!confirmado) return;
    setServicio(await api.servicios.quitarTratamiento(servicio.idServicio, tratamiento.idServicioTratamiento));
    avisarExito('Tratamiento quitado', 'El costo del servicio se recalculó.');
    cargar();
  }

  async function eliminarServicio() {
    const confirmado = await confirmar({
      titulo: `¿Eliminar el servicio #${servicio.idServicio}?`,
      mensaje: 'Se borrarán también sus tratamientos y productos. Esta acción no se puede deshacer.',
      textoAceptar: 'Sí, eliminar',
      peligro: true,
    });
    if (!confirmado) return;
    await api.servicios.eliminar(servicio.idServicio);
    avisarExito('Servicio eliminado');
    setParametros({});
    cargar();
  }

  return (
    <section>
      <div className="encabezadoPagina">
        <div>
          <h1>Servicios</h1>
          <p>Tratamientos realizados en cada reservación, con sus productos y costos.</p>
        </div>
      </div>
      <div className="dosColumnas">
        <div>
          <div className="barraBusqueda">
            <div className="campoBusqueda">
              <IconoBuscar />
              <input placeholder="Buscar por cliente, empleado, sala…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
            </div>
          </div>
          {!servicios ? <EsqueletoTabla renglones={4} /> : !servicios.length ? (
            <EstadoVacio titulo="Sin servicios" mensaje='Usa "Atender" en una reservación pendiente.' Icono={IconoMasaje} />
          ) : (
            <ul className="listaSeleccion">
              {servicios.map((elemento) => (
                <li key={elemento.idServicio} className={String(elemento.idServicio) === idSeleccionado ? 'seleccionado' : ''}
                  onClick={() => setParametros({ id: elemento.idServicio })}>
                  <div className="tituloConEstatus">
                    <b>#{elemento.idServicio} · {elemento.nombreCliente}</b>
                    <span className="costoTratamiento">{formatearMoneda(elemento.costo)}</span>
                  </div>
                  <span className="textoTenue">{formatearFecha(elemento.fecha)} · {elemento.nombreSala}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {cargandoDetalle ? <CargaSeccion texto="Abriendo servicio…" /> : servicio ? (
            <div className="detalleServicio" key={servicio.idServicio}>
              <DetalleServicio servicio={servicio} alQuitarTratamiento={quitarTratamiento} />
              <AgregarTratamiento idServicio={servicio.idServicio} alAgregar={(detalle) => { setServicio(detalle); cargar(); }} />
              <div><button className="botonPeligro" onClick={eliminarServicio}><IconoBasura /> Eliminar servicio</button></div>
            </div>
          ) : (
            <div className="tarjeta"><EstadoVacio titulo="Selecciona un servicio" mensaje="Verás aquí sus tratamientos, productos y el costo total." Icono={IconoFlechaIzquierda} /></div>
          )}
        </div>
      </div>
    </section>
  );
}

// RF 1001 / 1002 - Agregar tratamiento (buscable) con sus productos
function AgregarTratamiento({ idServicio, alAgregar }) {
  const { avisarExito } = useAvisos();
  const [buscarTratamiento, setBuscarTratamiento] = useState('');
  const [tratamientos, setTratamientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [idTratamiento, setIdTratamiento] = useState('');
  const [idsProducto, setIdsProducto] = useState([]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { api.productos.listar().then(setProductos); }, []);
  useEffect(() => { api.tratamientos.listar({ buscar: buscarTratamiento }).then(setTratamientos); }, [buscarTratamiento]);

  const alternarProducto = (id) =>
    setIdsProducto((actuales) => (actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id]));

  const costoEstimado = productos.filter((producto) => idsProducto.includes(producto.idProducto)).reduce((suma, producto) => suma + Number(producto.precioUso), 0);

  async function agregar(evento) {
    evento.preventDefault();
    setGuardando(true);
    try {
      alAgregar(await api.servicios.agregarTratamiento(idServicio, { idTratamiento, idsProducto }));
      avisarExito('Tratamiento agregado', `Se sumaron ${formatearMoneda(costoEstimado)} al servicio.`);
      setIdTratamiento('');
      setIdsProducto([]);
      setError('');
    } catch (errorAgregar) {
      setError(errorAgregar.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="tarjeta" onSubmit={agregar}>
      <h3>Agregar tratamiento</h3>
      <div className="rejillaFormulario">
        <div className="campoBusqueda">
          <IconoBuscar />
          <input placeholder="Buscar tratamiento…" value={buscarTratamiento} onChange={(e) => setBuscarTratamiento(e.target.value)} />
        </div>
        <select required value={idTratamiento} onChange={(e) => setIdTratamiento(e.target.value)}>
          <option value="">Selecciona un tratamiento…</option>
          {tratamientos.map((tratamiento) => <option key={tratamiento.idTratamiento} value={tratamiento.idTratamiento}>{tratamiento.nombre}</option>)}
        </select>
      </div>
      <p className="textoTenue">Productos utilizados:</p>
      <div className="listaCasillas">
        {productos.map((producto) => (
          <label key={producto.idProducto} className="casilla">
            <input type="checkbox" checked={idsProducto.includes(producto.idProducto)} onChange={() => alternarProducto(producto.idProducto)} />
            {producto.nombre} <span className="textoTenue">({formatearMoneda(producto.precioUso)})</span>
          </label>
        ))}
      </div>
      {error && <p className="mensajeError">{error}</p>}
      <div className="barraTitulo">
        <span className="textoTenue">Costo del tratamiento: <b className="costoTratamiento">{formatearMoneda(costoEstimado)}</b></span>
        <BotonCarga type="submit" cargando={guardando} disabled={!idTratamiento || !idsProducto.length}><IconoMas /> Agregar al servicio</BotonCarga>
      </div>
    </form>
  );
}
