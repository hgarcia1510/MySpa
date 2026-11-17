import { formatearFecha, formatearMoneda } from '@myspa/compartido';
import { IconoBasura } from './Iconos';

/**
 * RF 0905 - Maestro-Detalle: Servicio -> Tratamientos -> Productos con costos.
 * Lo usan el empleado (Servicios) y el cliente (histórico de reservaciones).
 */
export default function DetalleServicio({ servicio, alQuitarTratamiento }) {
  return (
    <div className="detalleServicio">
      <div className="maestro">
        <small>Servicio #{servicio.idServicio} · {formatearFecha(servicio.fecha)}</small>
        <b>{servicio.nombreCliente}</b>
        <small>Atendió: {servicio.nombreEmpleado} · Sala: {servicio.nombreSala}</small>
        <div className="costoTotal">{formatearMoneda(servicio.costo)}</div>
        <small>Costo total del servicio</small>
      </div>

      {servicio.tratamientos.map((tratamiento) => (
        <div key={tratamiento.idServicioTratamiento} className="detalleTratamiento">
          <div className="barraTitulo">
            <b>{tratamiento.nombre}</b>
            <span className="accionesFila">
              <span className="costoTratamiento">{formatearMoneda(tratamiento.costo)}</span>
              {alQuitarTratamiento && (
                <button className="botonPeligro botonChico" title="Quitar tratamiento" onClick={() => alQuitarTratamiento(tratamiento)}>
                  <IconoBasura tamanio={14} />
                </button>
              )}
            </span>
          </div>
          <table>
            <thead><tr><th>Producto</th><th>Marca</th><th>Costo de uso</th></tr></thead>
            <tbody>
              {tratamiento.productos.map((producto) => (
                <tr key={producto.idProducto}>
                  <td>{producto.nombre}</td><td>{producto.marca}</td><td>{formatearMoneda(producto.precioUso)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {!servicio.tratamientos.length && <p className="textoTenue">Aún no hay tratamientos en este servicio.</p>}
    </div>
  );
}
