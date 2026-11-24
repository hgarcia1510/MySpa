import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { urlServidor } from '../api';
import { aplicarActualizacion, estaEnModoApp, registrarEventoUso, registrarServicio } from '../pwa/registrarServicio';
import { accionesPwa, crearEstadoPwa, pwaReductor } from '../reductores';

const PwaContexto = createContext(null);
const urlApi = `${urlServidor}/api`;

/** Estado de la PWA: conexión, instalación, actualizaciones y servidor. */
export function ProveedorPwa({ children }) {
  const [estado, despachar] = useReducer(pwaReductor, undefined, () =>
    crearEstadoPwa({ enLinea: navigator.onLine, instalada: estaEnModoApp() })
  );
  const eventoInstalacion = useRef(null);

  useEffect(() => {
    const alConectar = () => despachar({ type: accionesPwa.cambiarConexion, enLinea: true });
    const alDesconectar = () => despachar({ type: accionesPwa.cambiarConexion, enLinea: false });
    const alPedirInstalacion = (evento) => {
      evento.preventDefault(); // se guarda para mostrar nuestro propio botón "Instalar"
      eventoInstalacion.current = evento;
      despachar({ type: accionesPwa.instalacionDisponible });
    };
    const alInstalar = () => {
      eventoInstalacion.current = null;
      despachar({ type: accionesPwa.instalada });
      registrarEventoUso(urlApi, 'instalacion');
    };

    window.addEventListener('online', alConectar);
    window.addEventListener('offline', alDesconectar);
    window.addEventListener('beforeinstallprompt', alPedirInstalacion);
    window.addEventListener('appinstalled', alInstalar);

    registrarEventoUso(urlApi, 'visita');
    registrarServicio({
      alHaberActualizacion: () => despachar({ type: accionesPwa.actualizacionDisponible }),
      alQuedarListo: () => despachar({ type: accionesPwa.listaSinConexion }),
    });

    return () => {
      window.removeEventListener('online', alConectar);
      window.removeEventListener('offline', alDesconectar);
      window.removeEventListener('beforeinstallprompt', alPedirInstalacion);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);

  const instalar = useCallback(async () => {
    const evento = eventoInstalacion.current;
    if (!evento) return false;
    eventoInstalacion.current = null; // el aviso del navegador solo se puede usar una vez
    despachar({ type: accionesPwa.instalacionUsada });
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    return outcome === 'accepted';
  }, []);

  const actualizar = useCallback(() => aplicarActualizacion(), []);
  const marcarServidor = useCallback((disponible) => despachar({ type: accionesPwa.marcarServidor, disponible }), []);

  return (
    <PwaContexto.Provider value={{ ...estado, instalar, actualizar, marcarServidor }}>
      {children}
    </PwaContexto.Provider>
  );
}

export const usePwa = () => useContext(PwaContexto);
