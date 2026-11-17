import { useCallback, useEffect, useState } from 'react';
import { catalogos, etiquetasColumnas, formatearMoneda } from '@myspa/compartido';
import { api, urlServidor } from '../api';
import { useAvisos } from '../contexto/AvisosContexto';
import CampoFormulario from './CampoFormulario';
import AsignarHorarios from './AsignarHorarios';
import { BotonCarga, EsqueletoTabla, EstadoVacio } from './Cargando';
import { IconoAlerta, IconoBasura, IconoBuscar, IconoEditar, IconoMas, IconoReloj } from './Iconos';

const subtitulos = {
  empleados: 'Personal del spa, sus puestos y accesos al sistema.',
  clientes: 'Clientes registrados y su número único.',
  productos: 'Productos que se usan en los tratamientos y su precio de uso.',
  salas: 'Salas de cada sucursal, sus fotos y horarios.',
  tratamientos: 'Tratamientos que ofrece el spa.',
};

const singulares = { empleados: 'empleado', clientes: 'cliente', productos: 'producto', salas: 'sala', tratamientos: 'tratamiento' };

/**
 * Pantalla genérica de catálogo: listado, búsqueda por cualquier campo,
 * mostrar inactivos, alta, modificación y eliminación (lógica o física).
 */
export default function PaginaCatalogo({ clave }) {
  const catalogo = catalogos[clave];
  const recursoApi = api[catalogo.recurso];
  const { avisarExito, avisarError, confirmar } = useAvisos();

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [registroEditado, setRegistroEditado] = useState(null); // null = cerrado, {} = alta
  const [error, setError] = useState('');
  const [salaHorarios, setSalaHorarios] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setRegistros(await recursoApi.listar({ buscar, inactivos: mostrarInactivos }));
    } catch (errorCarga) {
      avisarError('No se pudo cargar la lista', errorCarga.message);
    } finally {
      setCargando(false);
    }
  }, [recursoApi, buscar, mostrarInactivos, avisarError]);

  useEffect(() => {
    const temporizador = setTimeout(cargar, 300); // búsqueda mientras escribe
    return () => clearTimeout(temporizador);
  }, [cargar]);

  const esAlta = registroEditado && !registroEditado[catalogo.llave];
  const camposVisibles = catalogo.campos.filter((campo) => esAlta || !campo.soloAlta);
  const nombreSingular = singulares[clave] ?? 'registro';

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    const tieneArchivo = camposVisibles.some((campo) => campo.tipo === 'imagen' && registroEditado[campo.nombre] instanceof File);
    let datos = {};
    for (const campo of camposVisibles) {
      const valor = registroEditado[campo.nombre];
      if (valor === undefined || valor === null) continue;
      if (campo.tipo === 'imagen' && !(valor instanceof File)) continue; // solo se envía si eligió una nueva
      datos[campo.nombre] = valor;
    }
    if (catalogo.conEstatus && !esAlta) datos.estatus = registroEditado.estatus;
    if (tieneArchivo) {
      const formulario = new FormData();
      Object.entries(datos).forEach(([nombre, valor]) => formulario.append(nombre, valor));
      datos = formulario;
    }
    setGuardando(true);
    try {
      const resultado = esAlta ? await recursoApi.crear(datos) : await recursoApi.actualizar(registroEditado[catalogo.llave], datos);
      const numeroGenerado = resultado?.numeroEmpleado ?? resultado?.numeroUnico;
      avisarExito(esAlta ? 'Registro creado' : 'Cambios guardados', numeroGenerado ? `Número asignado: ${numeroGenerado}` : 'La información se guardó correctamente.');
      setRegistroEditado(null);
      cargar();
    } catch (errorGuardar) {
      setError(errorGuardar.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(registro) {
    const nombre = registro.nombre ? `"${registro.nombre}${registro.apellidoPaterno ? ' ' + registro.apellidoPaterno : ''}"` : 'este registro';
    const confirmado = await confirmar({
      titulo: catalogo.conEstatus ? `¿Desactivar ${nombre}?` : `¿Eliminar ${nombre}?`,
      mensaje: catalogo.conEstatus
        ? 'Quedará como Inactivo. Podrás verlo con "Mostrar inactivos" y reactivarlo cuando quieras.'
        : 'Se eliminará definitivamente y no se podrá recuperar.',
      textoAceptar: catalogo.conEstatus ? 'Sí, desactivar' : 'Sí, eliminar',
      peligro: true,
    });
    if (!confirmado) return;
    try {
      await recursoApi.eliminar(registro[catalogo.llave]);
      avisarExito(catalogo.conEstatus ? 'Registro desactivado' : 'Registro eliminado', `${nombre} ya no aparece en la lista de activos.`);
      cargar();
    } catch (errorEliminar) {
      avisarError('No se pudo eliminar', errorEliminar.message);
    }
  }

  const urlImagen = (registro) => (catalogo.imagenTabla && registro?.[catalogo.imagenTabla] ? `${urlServidor}${registro[catalogo.imagenTabla]}` : null);

  function mostrarValor(columna, valor) {
    if (columna === 'precioUso') return formatearMoneda(valor);
    if (columna === 'estatus') return <span className={`etiqueta etiqueta${valor}`}>{valor}</span>;
    if (['horaInicio', 'horaFin'].includes(columna)) return String(valor ?? '').slice(0, 5);
    return valor;
  }

  return (
    <section>
      <div className="encabezadoPagina">
        <div>
          <h1>{catalogo.titulo}</h1>
          <p>{subtitulos[clave]}</p>
        </div>
        <button onClick={() => { setError(''); setRegistroEditado({}); }}><IconoMas /> Nuevo</button>
      </div>

      <div className="barraBusqueda">
        <div className="campoBusqueda">
          <IconoBuscar />
          <input placeholder="Buscar por cualquier campo…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        </div>
        {catalogo.conEstatus && (
          <label className="casilla">
            <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} />
            Mostrar inactivos
          </label>
        )}
      </div>

      {cargando ? (
        <EsqueletoTabla />
      ) : !registros.length ? (
        <div className="contenedorTabla">
          <EstadoVacio titulo={buscar ? 'Sin resultados' : `Aún no hay ${catalogo.titulo.toLowerCase()}`}
            mensaje={buscar ? `Nada coincide con "${buscar}".` : 'Usa el botón "Nuevo" para agregar el primero.'} />
        </div>
      ) : (
        <div className="contenedorTabla">
          <table>
            <thead>
              <tr>
                {catalogo.imagenTabla && <th>Foto</th>}
                {catalogo.columnas.map((columna) => <th key={columna}>{etiquetasColumnas[columna] ?? columna}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro[catalogo.llave]} className={registro.estatus === 'Inactivo' ? 'filaInactiva' : ''}>
                  {catalogo.imagenTabla && (
                    <td>
                      {urlImagen(registro)
                        ? <img className="miniatura" src={urlImagen(registro)} alt="" />
                        : <div className="miniatura miniaturaVacia">{String(registro.nombre ?? '?')[0]}</div>}
                    </td>
                  )}
                  {catalogo.columnas.map((columna) => <td key={columna}>{mostrarValor(columna, registro[columna])}</td>)}
                  <td>
                    <div className="accionesFila">
                      {catalogo.conHorarios && (
                        <button className="botonSecundario botonChico" onClick={() => setSalaHorarios(registro)}><IconoReloj tamanio={15} /> Horarios</button>
                      )}
                      <button className="botonSecundario botonChico" onClick={() => { setError(''); setRegistroEditado(registro); }}><IconoEditar tamanio={15} /> Editar</button>
                      {registro.estatus !== 'Inactivo' && (
                        <button className="botonPeligro botonChico" onClick={() => eliminar(registro)}><IconoBasura tamanio={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {salaHorarios && <AsignarHorarios sala={salaHorarios} alCerrar={() => setSalaHorarios(null)} />}

      {registroEditado && (
        <div className="fondoModal" onClick={() => setRegistroEditado(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <h2>{esAlta ? `Nuevo ${nombreSingular}` : `Editar ${nombreSingular}`}</h2>
            <div className="rejillaFormulario">
              {camposVisibles.map((campo) => (
                <CampoFormulario
                  key={campo.nombre}
                  campo={campo}
                  esAlta={esAlta}
                  urlActual={campo.tipo === 'imagen' ? urlImagen(registroEditado) : undefined}
                  valor={registroEditado[campo.nombre]}
                  alCambiar={(valor) => setRegistroEditado({ ...registroEditado, [campo.nombre]: valor })}
                />
              ))}
              {catalogo.conEstatus && !esAlta && (
                <label className="campo">
                  <span>Estatus</span>
                  <select value={registroEditado.estatus} onChange={(e) => setRegistroEditado({ ...registroEditado, estatus: e.target.value })}>
                    <option>Activo</option>
                    <option>Inactivo</option>
                  </select>
                </label>
              )}
            </div>
            {error && <p className="mensajeError"><IconoAlerta tamanio={16} /> {error}</p>}
            <div className="accionesModal">
              <button type="button" className="botonSecundario" onClick={() => setRegistroEditado(null)}>Cancelar</button>
              <BotonCarga type="submit" cargando={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</BotonCarga>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
