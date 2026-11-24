import { useCallback, useEffect, useReducer } from 'react';
import { formatearFecha, formatearMoneda } from '@myspa/compartido';
import { api } from '../../api';
import { useAvisos } from '../../contexto/AvisosContexto';
import { BotonCarga, CargaSeccion, EstadoVacio } from '../../componentes/Cargando';
import { IconoAlerta, IconoBasura, IconoEstrella, IconoGrafica, IconoMas } from '../../componentes/Iconos';
import {
  accionesDashboard, accionesFormulario, crearEstadoFormulario, dashboardReductor, estadoInicialDashboard, formularioReductor, periodosDashboard,
} from '../../reductores';

const canalesMarketing = ['Facebook', 'Instagram', 'Google', 'TikTok', 'WhatsApp', 'Volantes', 'Radio', 'Otro'];
const formatearDia = (dia) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
const formatearPorcentaje = (valor) => `${Number(valor ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 1 })} %`;
const formatearNumero = (valor) => Number(valor ?? 0).toLocaleString('es-MX');

// Dashboard administrativo (espacio de empleados)
export default function Dashboard() {
  const { avisarExito, avisarError, confirmar } = useAvisos();
  const [{ datos, cargando, error, dias, idSucursal, sucursales, registrandoGasto }, despachar] = useReducer(dashboardReductor, estadoInicialDashboard);

  const cargar = useCallback(async () => {
    despachar({ type: accionesDashboard.cargaInicio });
    try {
      despachar({ type: accionesDashboard.cargaExitosa, datos: await api.dashboard.obtener({ dias, idSucursal }) });
    } catch (errorCarga) {
      despachar({ type: accionesDashboard.cargaFallida, error: errorCarga.message });
    }
  }, [dias, idSucursal]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    api.sucursales.listar().then((lista) => despachar({ type: accionesDashboard.sucursalesCargadas, sucursales: lista })).catch(() => {});
  }, []);

  async function eliminarGasto(gasto) {
    const confirmado = await confirmar({
      titulo: '¿Eliminar este gasto?',
      mensaje: `${gasto.canal} · ${formatearMoneda(gasto.monto)} del ${formatearFecha(`${gasto.fecha}T00:00`).slice(0, 10)}.`,
      textoAceptar: 'Sí, eliminar',
      peligro: true,
    });
    if (!confirmado) return;
    try {
      await api.dashboard.eliminarGasto(gasto.idGasto);
      avisarExito('Gasto eliminado', 'Los indicadores de marketing se recalcularon.');
      cargar();
    } catch (errorEliminar) {
      avisarError('No se pudo eliminar', errorEliminar.message);
    }
  }

  return (
    <section className="dashboard">
      <div className="encabezadoPagina">
        <div>
          <h1>Dashboard</h1>
          <p>{datos ? `Del ${formatearDia(datos.periodo.desde)}/${datos.periodo.desde.slice(0, 4)} al ${formatearDia(datos.periodo.hasta)}/${datos.periodo.hasta.slice(0, 4)}` : 'Indicadores del negocio'}</p>
        </div>
        <button onClick={() => despachar({ type: accionesDashboard.abrirGasto })}><IconoMas /> Registrar gasto de marketing</button>
      </div>

      <div className="barraBusqueda filtrosDashboard">
        <select aria-label="Periodo" value={dias} onChange={(e) => despachar({ type: accionesDashboard.cambiarDias, dias: e.target.value })}>
          {periodosDashboard.map((periodo) => <option key={periodo.dias} value={periodo.dias}>{periodo.etiqueta}</option>)}
        </select>
        <select aria-label="Sucursal" value={idSucursal} onChange={(e) => despachar({ type: accionesDashboard.cambiarSucursal, idSucursal: e.target.value })}>
          <option value="">Todas las sucursales</option>
          {sucursales.map((sucursal) => <option key={sucursal.idSucursal} value={sucursal.idSucursal}>{sucursal.nombre}</option>)}
        </select>
        {cargando && datos && <span className="textoTenue">Actualizando…</span>}
      </div>

      {!datos ? (
        cargando ? <CargaSeccion texto="Calculando indicadores…" /> : (
          <div className="tarjeta">
            <p className="mensajeError"><IconoAlerta tamanio={16} /> {error || 'No se pudo cargar el dashboard'}</p>
            <div><button className="botonSecundario" onClick={cargar}>Reintentar</button></div>
          </div>
        )
      ) : (
        <ContenidoDashboard datos={datos} actualizando={cargando} alEliminarGasto={eliminarGasto} />
      )}

      {registrandoGasto && (
        <FormularioGasto
          alCerrar={() => despachar({ type: accionesDashboard.cerrarGasto })}
          alGuardar={() => {
            despachar({ type: accionesDashboard.cerrarGasto });
            avisarExito('Gasto registrado', 'Se tomó en cuenta para el ROI y el costo por cliente nuevo.');
            cargar();
          }}
        />
      )}
    </section>
  );
}

function ContenidoDashboard({ datos, actualizando, alEliminarGasto }) {
  const { indicadores, reservaciones, ventas, clientes, comportamiento, marketing, feedback } = datos;
  return (
    <div className={actualizando ? 'contenidoDashboard actualizando' : 'contenidoDashboard'}>
      <div className="rejillaIndicadores">
        <Indicador titulo="Ingresos" valor={formatearMoneda(indicadores.ingresos)} variacion={indicadores.variacionIngresos}
          detalle={`Periodo anterior: ${formatearMoneda(indicadores.ingresosAnterior)}`} />
        <Indicador titulo="Servicios" valor={formatearNumero(indicadores.servicios)} detalle={`Ticket promedio ${formatearMoneda(indicadores.ticketPromedio)}`} />
        <Indicador titulo="Reservaciones" valor={formatearNumero(indicadores.reservaciones)} variacion={indicadores.variacionReservaciones}
          detalle={`${formatearNumero(indicadores.proximasReservaciones)} próximas`} />
        <Indicador titulo="Cancelación" valor={formatearPorcentaje(indicadores.tasaCancelacion)} detalle="De las reservaciones del periodo" />
        <Indicador titulo="Inasistencia" valor={formatearPorcentaje(indicadores.tasaInasistencia)} detalle="Citas pasadas que siguen pendientes" />
        <Indicador titulo="Clientes" valor={formatearNumero(indicadores.clientesActivos)} detalle={`${formatearNumero(indicadores.clientesNuevos)} nuevos en el periodo`} />
      </div>

      <SeccionDashboard titulo="Ventas">
        <Panel titulo="Reservaciones por día">
          <GraficaColumnas serie={ventas.serieDiaria} campo="reservaciones" color="var(--colorPrincipal)" formato={formatearNumero} unidad="reservaciones" />
        </Panel>
        <Panel titulo="Ingresos por día">
          <GraficaLinea serie={ventas.serieDiaria} campo="ingresos" color="var(--colorSecundario)" formato={formatearMoneda} />
        </Panel>
        <Panel titulo="Ingresos por sucursal">
          <BarrasHorizontales color="var(--colorSecundario)" filas={ventas.porSucursal.map((sucursal) => ({
            clave: sucursal.idSucursal, etiqueta: sucursal.nombre, valor: sucursal.ingresos,
            texto: `${formatearMoneda(sucursal.ingresos)} · ${formatearPorcentaje(sucursal.participacion)}`,
          }))} />
        </Panel>
        <Panel titulo="Reservaciones por canal">
          <BarrasHorizontales color="var(--colorPrincipal)" filas={reservaciones.porCanal.map((canal) => ({
            clave: canal.canal, etiqueta: canal.canal === 'Web' ? 'Web (cliente)' : 'Sucursal (empleado)', valor: canal.total,
            texto: `${formatearNumero(canal.total)} · ${formatearPorcentaje(canal.porcentaje)}`,
          }))} />
        </Panel>
      </SeccionDashboard>

      <SeccionDashboard titulo="Clientes">
        <Panel titulo="Retención">
          <div className="cifrasPanel">
            <Cifra valor={formatearPorcentaje(clientes.retencion.tasaRetencion)} texto="regresaron 2 veces o más" />
            <Cifra valor={formatearNumero(clientes.retencion.clientesAtendidos)} texto="clientes atendidos" />
            <Cifra valor={formatearNumero(clientes.retencion.clientesRecurrentes)} texto="clientes recurrentes" />
            <Cifra valor={clientes.retencion.frecuenciaPromedio.toLocaleString('es-MX')} texto="servicios por cliente" />
          </div>
        </Panel>
        <Panel titulo="Clientes activos por género">
          <BarrasHorizontales color="var(--colorAcento)" filas={clientes.porGenero.map((fila) => ({
            clave: fila.genero, etiqueta: fila.genero, valor: fila.total, texto: `${formatearNumero(fila.total)} · ${formatearPorcentaje(fila.porcentaje)}`,
          }))} />
        </Panel>
        <Panel titulo="Mejores clientes del periodo" ancho>
          {!clientes.topClientes.length ? <EstadoVacio titulo="Sin servicios en el periodo" /> : (
            <div className="contenedorTabla">
              <table>
                <thead><tr><th>#</th><th>Cliente</th><th>No. cliente</th><th>Servicios</th><th>Importe</th></tr></thead>
                <tbody>
                  {clientes.topClientes.map((cliente, indice) => (
                    <tr key={cliente.idCliente}>
                      <td><b>{indice + 1}</b></td><td>{cliente.nombre}</td><td className="textoTenue">{cliente.numeroUnico}</td>
                      <td>{cliente.servicios}</td><td><b>{formatearMoneda(cliente.importe)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </SeccionDashboard>

      <SeccionDashboard titulo="Comportamiento de compra">
        <Panel titulo="Tratamientos más realizados">
          <BarrasHorizontales color="var(--colorPrincipal)" filas={comportamiento.tratamientos.map((tratamiento) => ({
            clave: tratamiento.idTratamiento, etiqueta: tratamiento.nombre, valor: tratamiento.veces,
            texto: `${formatearNumero(tratamiento.veces)} · ${formatearMoneda(tratamiento.importe)}`,
          }))} />
        </Panel>
        <Panel titulo="Productos más usados">
          <BarrasHorizontales color="var(--colorSecundario)" filas={comportamiento.productos.map((producto) => ({
            clave: producto.idProducto, etiqueta: `${producto.nombre} (${producto.marca})`, valor: producto.usos,
            texto: `${formatearNumero(producto.usos)} usos · ${formatearMoneda(producto.importe)}`,
          }))} />
        </Panel>
        <Panel titulo="Ocupación de salas" ancho subtitulo="Reservaciones no canceladas entre horarios asignados × días del periodo">
          <BarrasHorizontales color="var(--colorPrincipal)" maximo={100} filas={comportamiento.ocupacionSalas.map((sala) => ({
            clave: sala.idSala, etiqueta: `${sala.nombre} · ${sala.nombreSucursal}`, valor: sala.ocupacion,
            texto: sala.horarios ? `${formatearPorcentaje(sala.ocupacion)} (${sala.reservaciones}/${sala.capacidad})` : 'Sin horarios',
          }))} />
        </Panel>
      </SeccionDashboard>

      <SeccionDashboard titulo="Marketing y uso de la PWA">
        <Panel titulo="Engagement">
          <div className="cifrasPanel">
            <Cifra valor={formatearNumero(marketing.visitas)} texto="visitas" />
            <Cifra valor={formatearPorcentaje(marketing.porcentajeVisitasPwa)} texto={`desde la app instalada (${formatearNumero(marketing.visitasPwa)})`} />
            <Cifra valor={formatearNumero(marketing.instalaciones)} texto="instalaciones de la app" />
            <Cifra valor={formatearPorcentaje(marketing.conversion)} texto={`conversión (${formatearNumero(marketing.reservacionesWeb)} reservaciones web)`} />
          </div>
        </Panel>
        <Panel titulo="Inversión">
          <div className="cifrasPanel">
            <Cifra valor={formatearMoneda(marketing.gastoTotal)} texto="gasto del periodo" />
            <Cifra valor={marketing.roi === null ? '—' : `${marketing.roi.toLocaleString('es-MX')}×`} texto="ROI (ingresos − gasto) / gasto"
              tono={marketing.roi === null ? '' : marketing.roi >= 0 ? 'positivo' : 'negativo'} />
            <Cifra valor={marketing.costoPorClienteNuevo === null ? '—' : formatearMoneda(marketing.costoPorClienteNuevo)} texto="costo por cliente nuevo" />
          </div>
          <BarrasHorizontales color="var(--colorAcento)" filas={marketing.gastoPorCanal.map((canal) => ({
            clave: canal.canal, etiqueta: canal.canal, valor: canal.total, texto: formatearMoneda(canal.total),
          }))} vacio="Sin gastos registrados en el periodo" />
        </Panel>
        <Panel titulo="Gastos registrados" ancho>
          {!marketing.gastosRecientes.length ? (
            <EstadoVacio titulo="Sin gastos en el periodo" mensaje='Usa "Registrar gasto de marketing" para medir el ROI.' Icono={IconoGrafica} />
          ) : (
            <ul className="listaGastos">
              {marketing.gastosRecientes.map((gasto) => (
                <li key={gasto.idGasto}>
                  <div>
                    <b>{gasto.canal}</b>
                    <small className="textoTenue">{gasto.concepto || 'Sin concepto'} · {formatearDia(gasto.fecha)}/{gasto.fecha.slice(0, 4)}</small>
                  </div>
                  <span className="accionesFila">
                    <b>{formatearMoneda(gasto.monto)}</b>
                    <button className="botonPeligro botonChico" title="Eliminar gasto" onClick={() => alEliminarGasto(gasto)}><IconoBasura tamanio={14} /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </SeccionDashboard>

      <SeccionDashboard titulo="Feedback">
        <Panel titulo="Calificaciones">
          <div className="cifrasPanel">
            <Cifra valor={feedback.total ? `${feedback.promedio.toLocaleString('es-MX')} / 5` : '—'} texto={`promedio de ${formatearNumero(feedback.total)} reseñas`} />
            <Cifra valor={formatearPorcentaje(feedback.satisfaccion)} texto="clientes satisfechos (4 y 5 ★)" />
          </div>
          <BarrasHorizontales color="var(--colorAdvertencia)" maximo={Math.max(1, ...Object.values(feedback.distribucion))}
            filas={[5, 4, 3, 2, 1].map((estrellas) => ({
              clave: estrellas, etiqueta: `${estrellas} ★`, valor: feedback.distribucion[estrellas], texto: formatearNumero(feedback.distribucion[estrellas]),
            }))} />
        </Panel>
        <Panel titulo="Comentarios recientes">
          {!feedback.comentarios.length ? <EstadoVacio titulo="Sin comentarios" mensaje="Los clientes califican desde Mis reservaciones." Icono={IconoEstrella} /> : (
            <ul className="listaComentarios">
              {feedback.comentarios.map((comentario) => (
                <li key={comentario.idResena}>
                  <div className="barraTitulo">
                    <b>{comentario.nombreCliente}</b>
                    <span className="estrellas" title={`${comentario.calificacion} de 5`}>
                      {[1, 2, 3, 4, 5].map((numero) => (
                        <span key={numero} className={numero <= comentario.calificacion ? 'estrellaMarcada' : ''}>
                          <IconoEstrella tamanio={13} relleno={numero <= comentario.calificacion} />
                        </span>
                      ))}
                    </span>
                  </div>
                  <p>“{comentario.comentario}”</p>
                  <small className="textoTenue">{comentario.nombreSala} · {formatearFecha(comentario.fecha).slice(0, 10)}</small>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </SeccionDashboard>
    </div>
  );
}

function Indicador({ titulo, valor, detalle, variacion }) {
  const hayVariacion = variacion !== undefined;
  const clase = variacion > 0 ? 'positivo' : variacion < 0 ? 'negativo' : '';
  return (
    <div className="tarjeta indicadorDashboard">
      <small>{titulo}</small>
      <b>{valor}</b>
      {hayVariacion && (
        <span className={`variacion ${clase}`}>
          {variacion === null ? 'Sin datos del periodo anterior' : `${variacion > 0 ? '▲' : variacion < 0 ? '▼' : '='} ${formatearPorcentaje(Math.abs(variacion))} vs. periodo anterior`}
        </span>
      )}
      {detalle && <span className="detalleIndicador">{detalle}</span>}
    </div>
  );
}

function SeccionDashboard({ titulo, children }) {
  return (
    <section className="seccionDashboard">
      <h2>{titulo}</h2>
      <div className="rejillaDashboard">{children}</div>
    </section>
  );
}

function Panel({ titulo, subtitulo, ancho = false, children }) {
  return (
    <div className={`tarjeta panelDashboard${ancho ? ' panelAncho' : ''}`}>
      <h3>{titulo}</h3>
      {subtitulo && <p className="textoTenue subtituloPanel">{subtitulo}</p>}
      {children}
    </div>
  );
}

function Cifra({ valor, texto, tono = '' }) {
  return (
    <div className={`cifra ${tono}`}>
      <b>{valor}</b>
      <small>{texto}</small>
    </div>
  );
}

/** Barras horizontales hechas con CSS (un solo color por gráfica). */
function BarrasHorizontales({ filas, color, maximo, vacio = 'Sin datos en el periodo' }) {
  if (!filas.length || filas.every((fila) => !fila.valor)) return <p className="textoTenue sinDatos">{vacio}</p>;
  const tope = maximo ?? Math.max(...filas.map((fila) => fila.valor), 1);
  return (
    <ul className="barrasHorizontales">
      {filas.map((fila) => (
        <li key={fila.clave} title={`${fila.etiqueta}: ${fila.texto}`}>
          <div className="textoBarra"><span>{fila.etiqueta}</span><b>{fila.texto}</b></div>
          <div className="pistaBarra">
            <span style={{ width: `${Math.min((fila.valor / tope) * 100, 100)}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const anchoSvg = 640;
const altoSvg = 220;
const margen = { arriba: 16, derecha: 12, abajo: 26, izquierda: 12 };

/** Etiquetas del eje X: primer día, mitad y último. */
function EtiquetasEjeX({ serie, posicionX }) {
  const indices = [...new Set([0, Math.floor((serie.length - 1) / 2), serie.length - 1])];
  return indices.map((indice) => (
    <text key={indice} x={posicionX(indice)} y={altoSvg - 6} textAnchor={indice === 0 ? 'start' : indice === serie.length - 1 ? 'end' : 'middle'} className="ejeGrafica">
      {formatearDia(serie[indice].dia)}
    </text>
  ));
}

/** Columnas por día dibujadas con SVG propio; cada barra tiene <title> como tooltip. */
function GraficaColumnas({ serie, campo, color, formato, unidad }) {
  const maximo = Math.max(...serie.map((punto) => punto[campo]), 0);
  if (!maximo) return <p className="textoTenue sinDatos">Sin datos en el periodo</p>;
  const anchoUtil = anchoSvg - margen.izquierda - margen.derecha;
  const altoUtil = altoSvg - margen.arriba - margen.abajo;
  const paso = anchoUtil / serie.length;
  const anchoBarra = Math.max(paso - 2, 1);
  const posicionX = (indice) => margen.izquierda + indice * paso + paso / 2;
  return (
    <svg className="graficaSvg" viewBox={`0 0 ${anchoSvg} ${altoSvg}`} role="img" aria-label={`Gráfica de ${unidad} por día`}>
      <line x1={margen.izquierda} x2={anchoSvg - margen.derecha} y1={altoSvg - margen.abajo} y2={altoSvg - margen.abajo} className="lineaBase" />
      <text x={margen.izquierda} y={margen.arriba - 4} className="ejeGrafica">Máx. {formato(maximo)}</text>
      {serie.map((punto, indice) => {
        const alto = (punto[campo] / maximo) * altoUtil;
        return (
          <g key={punto.dia} className="marcaGrafica">
            {/* zona invisible más ancha para que el tooltip sea fácil de alcanzar */}
            <rect x={margen.izquierda + indice * paso} y={margen.arriba} width={paso} height={altoUtil} fill="transparent" />
            <rect x={posicionX(indice) - anchoBarra / 2} y={altoSvg - margen.abajo - alto} width={anchoBarra} height={alto} rx={Math.min(3, anchoBarra / 2)} fill={color} />
            <title>{`${formatearDia(punto.dia)}: ${formato(punto[campo])} ${unidad}`}</title>
          </g>
        );
      })}
      <EtiquetasEjeX serie={serie} posicionX={posicionX} />
    </svg>
  );
}

/** Línea por día con SVG propio; cada punto tiene <title> como tooltip. */
function GraficaLinea({ serie, campo, color, formato }) {
  const maximo = Math.max(...serie.map((punto) => punto[campo]), 0);
  if (!maximo) return <p className="textoTenue sinDatos">Sin ingresos en el periodo</p>;
  const anchoUtil = anchoSvg - margen.izquierda - margen.derecha;
  const altoUtil = altoSvg - margen.arriba - margen.abajo;
  const posicionX = (indice) => margen.izquierda + (serie.length === 1 ? anchoUtil / 2 : (indice / (serie.length - 1)) * anchoUtil);
  const posicionY = (valor) => altoSvg - margen.abajo - (valor / maximo) * altoUtil;
  const puntos = serie.map((punto, indice) => `${posicionX(indice)},${posicionY(punto[campo])}`).join(' ');
  const mostrarPuntos = serie.length <= 31;
  return (
    <svg className="graficaSvg" viewBox={`0 0 ${anchoSvg} ${altoSvg}`} role="img" aria-label="Gráfica de ingresos por día">
      <line x1={margen.izquierda} x2={anchoSvg - margen.derecha} y1={altoSvg - margen.abajo} y2={altoSvg - margen.abajo} className="lineaBase" />
      <text x={margen.izquierda} y={margen.arriba - 4} className="ejeGrafica">Máx. {formato(maximo)}</text>
      <polyline points={puntos} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {serie.map((punto, indice) => (
        <g key={punto.dia} className="marcaGrafica">
          <circle cx={posicionX(indice)} cy={posicionY(punto[campo])} r="9" fill="transparent" />
          {mostrarPuntos && <circle cx={posicionX(indice)} cy={posicionY(punto[campo])} r="4" fill={color} stroke="#fff" strokeWidth="2" />}
          <title>{`${formatearDia(punto.dia)}: ${formato(punto[campo])}`}</title>
        </g>
      ))}
      <EtiquetasEjeX serie={serie} posicionX={posicionX} />
    </svg>
  );
}

/** Modal para registrar un gasto de marketing. */
function FormularioGasto({ alCerrar, alGuardar }) {
  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const [{ datos, error, guardando }, despachar] = useReducer(
    formularioReductor,
    { canal: '', monto: '', fecha: fechaHoy, concepto: '' },
    crearEstadoFormulario
  );
  const cambiarCampo = (campo) => (e) => despachar({ type: accionesFormulario.cambiarCampo, campo, valor: e.target.value });

  async function guardar(evento) {
    evento.preventDefault();
    despachar({ type: accionesFormulario.enviar });
    try {
      await api.dashboard.registrarGasto({ ...datos, monto: Number(datos.monto) });
      despachar({ type: accionesFormulario.exito, reiniciar: true });
      alGuardar();
    } catch (errorGuardar) {
      despachar({ type: accionesFormulario.fallo, error: errorGuardar.message });
    }
  }

  return (
    <div className="fondoModal" onClick={alCerrar}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <h2>Registrar gasto de marketing</h2>
        <p className="textoTenue">Se usa para calcular el ROI y el costo por cliente nuevo del periodo.</p>
        <div className="rejillaFormulario">
          <label className="campo"><span>Canal *</span>
            <select required value={datos.canal} onChange={cambiarCampo('canal')}>
              <option value="">Selecciona…</option>
              {canalesMarketing.map((canal) => <option key={canal}>{canal}</option>)}
            </select>
          </label>
          <label className="campo"><span>Monto *</span>
            <input type="number" required min="0.01" step="0.01" value={datos.monto} onChange={cambiarCampo('monto')} />
          </label>
          <label className="campo"><span>Fecha *</span>
            <input type="date" required value={datos.fecha} onChange={cambiarCampo('fecha')} />
          </label>
        </div>
        <label className="campo"><span>Concepto</span>
          <input maxLength={120} placeholder="Ej. Campaña de verano" value={datos.concepto} onChange={cambiarCampo('concepto')} />
        </label>
        {error && <p className="mensajeError"><IconoAlerta tamanio={16} /> {error}</p>}
        <div className="accionesModal">
          <button type="button" className="botonSecundario" onClick={alCerrar}>Cancelar</button>
          <BotonCarga type="submit" cargando={guardando}>Guardar gasto</BotonCarga>
        </div>
      </form>
    </div>
  );
}
