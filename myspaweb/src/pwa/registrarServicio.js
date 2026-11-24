// Registro del service worker y utilidades de la PWA.
// El service worker solo se registra en producción (npm run build / npm run pwa)
// para no interferir con la recarga en caliente de Vite en desarrollo.

let registro = null;
let recargando = false;

const hayServiceWorker = () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

/** Archivos del mismo origen que la página ya descargó (JS, CSS, imágenes…). */
function recursosCargados() {
  const urls = performance.getEntriesByType('resource')
    .map((entrada) => entrada.name)
    .filter((url) => url.startsWith(location.origin));
  return [...new Set([location.href.split('#')[0], ...urls])];
}

/**
 * Registra sw.js. Opciones:
 *  - alHaberActualizacion(): hay una versión nueva esperando a activarse.
 *  - alQuedarListo(): el service worker ya está activo (la app funciona sin conexión).
 */
export async function registrarServicio({ alHaberActualizacion, alQuedarListo } = {}) {
  if (!hayServiceWorker() || !import.meta.env.PROD) return null;
  try {
    registro = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
  } catch (error) {
    console.error('No se pudo registrar el service worker:', error);
    return null;
  }

  const avisarSiEspera = () => {
    if (registro.waiting && navigator.serviceWorker.controller) alHaberActualizacion?.();
  };
  avisarSiEspera();
  registro.addEventListener('updatefound', () => {
    const nuevo = registro.installing;
    nuevo?.addEventListener('statechange', () => {
      if (nuevo.state === 'installed') avisarSiEspera();
    });
  });

  // Cuando la nueva versión toma el control, se recarga una sola vez
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return;
    recargando = true;
    location.reload();
  });

  const listo = await navigator.serviceWorker.ready;
  listo.active?.postMessage({ tipo: 'guardarRecursos', urls: recursosCargados() });
  alQuedarListo?.();
  return registro;
}

/** Activa la versión nueva que está esperando (la página se recarga sola). */
export function aplicarActualizacion() {
  registro?.waiting?.postMessage({ tipo: 'activarYa' });
}

/** ¿El service worker ya controla esta página? (entonces hay datos guardados para trabajar sin conexión) */
export function controlaLaPagina() {
  return hayServiceWorker() && Boolean(navigator.serviceWorker.controller);
}

/** Borra la caché privada de la API (datos del usuario). Se llama al cerrar sesión. */
export function limpiarDatosPrivadosSinConexion() {
  if (hayServiceWorker()) navigator.serviceWorker.controller?.postMessage({ tipo: 'limpiarPrivados' });
}

/** ¿La app está abierta como app instalada (ventana standalone)? */
export function estaEnModoApp() {
  return Boolean(globalThis.matchMedia?.('(display-mode: standalone)').matches || globalThis.navigator?.standalone);
}

/**
 * Registra un evento de uso para el dashboard de marketing.
 * tipo: 'visita' (una sola vez por sesión del navegador) o 'instalacion'.
 */
export function registrarEventoUso(urlApi, tipo) {
  if (tipo === 'visita') {
    if (sessionStorage.getItem('visitaRegistradaMySpa')) return;
    sessionStorage.setItem('visitaRegistradaMySpa', '1');
  }
  fetch(`${urlApi}/metricas/eventos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, enPwa: estaEnModoApp() }),
    keepalive: true,
  }).catch(() => {}); // sin conexión no pasa nada: solo es estadística
}
