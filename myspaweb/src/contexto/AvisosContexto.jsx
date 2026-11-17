import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { IconoAlerta, IconoBasura, IconoCheck, IconoX } from '../componentes/Iconos';

const AvisosContexto = createContext(null);
const duracionAviso = 3800;

/**
 * Avisos (toasts) y diálogo de confirmación propios, en lugar de alert()/confirm() del navegador.
 * Uso:
 *   const { avisarExito, avisarError, confirmar } = useAvisos();
 *   if (await confirmar({ titulo: '¿Eliminar?', mensaje: '...', peligro: true })) { ... }
 */
export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);
  const [confirmacion, setConfirmacion] = useState(null);
  const contador = useRef(0);

  const quitarAviso = useCallback((idAviso) => setAvisos((actuales) => actuales.filter((aviso) => aviso.idAviso !== idAviso)), []);

  const avisar = useCallback((tipo, titulo, mensaje) => {
    const idAviso = ++contador.current;
    setAvisos((actuales) => [...actuales.slice(-3), { idAviso, tipo, titulo, mensaje }]);
    setTimeout(() => quitarAviso(idAviso), duracionAviso);
  }, [quitarAviso]);

  const avisarExito = useCallback((titulo, mensaje) => avisar('exito', titulo, mensaje), [avisar]);
  const avisarError = useCallback((titulo, mensaje) => avisar('error', titulo, mensaje), [avisar]);
  const avisarInfo = useCallback((titulo, mensaje) => avisar('info', titulo, mensaje), [avisar]);

  const confirmar = useCallback(
    (opciones) => new Promise((resolver) => setConfirmacion({ textoAceptar: 'Sí, continuar', textoCancelar: 'Cancelar', ...opciones, resolver })),
    []
  );

  function responder(respuesta) {
    confirmacion.resolver(respuesta);
    setConfirmacion(null);
  }

  const iconosAviso = { exito: <IconoCheck tamanio={16} />, error: <IconoX tamanio={16} />, info: 'i' };

  return (
    <AvisosContexto.Provider value={{ avisarExito, avisarError, avisarInfo, confirmar }}>
      {children}

      <div className="contenedorAvisos" role="status" aria-live="polite">
        {avisos.map((aviso) => (
          <div key={aviso.idAviso} className={`aviso ${aviso.tipo}`}>
            <span className="iconoAviso">{iconosAviso[aviso.tipo]}</span>
            <div className="textoAviso">
              <b>{aviso.titulo}</b>
              {aviso.mensaje}
            </div>
            <button className="cerrarAviso" onClick={() => quitarAviso(aviso.idAviso)} aria-label="Cerrar aviso">×</button>
            <span className="tiempoAviso" style={{ animationDuration: `${duracionAviso}ms` }} />
          </div>
        ))}
      </div>

      {confirmacion && (
        <div className="fondoModal" onClick={() => responder(false)}>
          <div className="modal modalChico" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className={`iconoConfirmacion ${confirmacion.peligro ? 'peligro' : ''}`}>
              {confirmacion.peligro ? <IconoBasura tamanio={28} /> : <IconoAlerta tamanio={28} />}
            </div>
            <h2>{confirmacion.titulo}</h2>
            {confirmacion.mensaje && <p>{confirmacion.mensaje}</p>}
            <div className="accionesModal">
              <button className="botonSecundario" onClick={() => responder(false)}>{confirmacion.textoCancelar}</button>
              <button className={confirmacion.peligro ? 'botonPeligro' : ''} onClick={() => responder(true)} autoFocus>
                {confirmacion.textoAceptar}
              </button>
            </div>
          </div>
        </div>
      )}
    </AvisosContexto.Provider>
  );
}

export const useAvisos = () => useContext(AvisosContexto);
