import { usePwa } from '../contexto/PwaContexto';
import { IconoAlerta, IconoBrillo, IconoDescargar } from './Iconos';

/** Botón del encabezado para instalar la app; solo aparece si el navegador lo permite. */
export function BotonInstalar() {
  const { instalable, instalar } = usePwa();
  if (!instalable) return null;
  return (
    <button type="button" className="botonInstalar botonChico" onClick={instalar} title="Instalar MySPA en este dispositivo">
      <IconoDescargar tamanio={15} /> Instalar app
    </button>
  );
}

/** Barras debajo del encabezado: sin conexión y nueva versión disponible. */
export function AvisosPwa() {
  const { enLinea, servidorDisponible, funcionaSinConexion, actualizacionDisponible, actualizar } = usePwa();
  return (
    <>
      {(!enLinea || !servidorDisponible) && (
        <div className="barraPwa barraPwaSinConexion" role="status">
          <IconoAlerta tamanio={16} />
          <span>
            {!enLinea ? 'Sin conexión a internet.' : 'No hay conexión con el servidor.'}{' '}
            {funcionaSinConexion ? 'Estás viendo la última información guardada; los cambios necesitan conexión.' : 'Algunas funciones no estarán disponibles.'}
          </span>
        </div>
      )}
      {actualizacionDisponible && (
        <div className="barraPwa barraPwaActualizacion" role="status">
          <IconoBrillo tamanio={16} />
          <span>Hay una nueva versión de MySPA.</span>
          <button type="button" className="botonChico" onClick={actualizar}>Actualizar</button>
        </div>
      )}
    </>
  );
}
