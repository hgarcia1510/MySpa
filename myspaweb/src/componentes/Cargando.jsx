import Logotipo from './Logotipo';
import { IconoHoja } from './Iconos';

/** Pantalla completa de carga con el logo girando (al iniciar la app o cambiar de sesión). */
export function PantallaCarga({ texto = 'Preparando tu espacio de relajación…', children }) {
  return (
    <div className="pantallaCarga">
      <div className="contenidoCarga">
        <div className="anilloCarga"><Logotipo tamanio={52} animado /></div>
        <span>{texto}</span>
        {children}
      </div>
    </div>
  );
}

/** Carga dentro de una sección: renglones con brillo (esqueleto). */
export function EsqueletoTabla({ renglones = 5 }) {
  return (
    <div aria-label="Cargando">
      {Array.from({ length: renglones }, (_, indice) => <div key={indice} className="esqueleto" style={{ opacity: 1 - indice * 0.15 }} />)}
    </div>
  );
}

/** Carga compacta centrada con el logo. */
export function CargaSeccion({ texto = 'Cargando…' }) {
  return (
    <div className="cargaSeccion">
      <div className="contenidoCarga">
        <div className="anilloCarga"><Logotipo tamanio={44} animado /></div>
        <span>{texto}</span>
      </div>
    </div>
  );
}

/** Botón que muestra un girador mientras se guarda. */
export function BotonCarga({ cargando, children, ...propiedades }) {
  return (
    <button {...propiedades} disabled={cargando || propiedades.disabled}>
      {cargando && <span className="giradorBoton" />}
      {children}
    </button>
  );
}

/** Mensaje cuando una lista no tiene registros. */
export function EstadoVacio({ titulo = 'Sin registros', mensaje, Icono = IconoHoja }) {
  return (
    <div className="estadoVacio">
      <div className="iconoVacio"><Icono tamanio={28} /></div>
      <b>{titulo}</b>
      {mensaje && <span>{mensaje}</span>}
    </div>
  );
}
