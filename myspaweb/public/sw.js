/* =========================================================
   Service worker de MySPA (PWA) — sin librerías
   - App shell en caché para abrir sin internet.
   - Navegación: red primero; sin red, el index.html guardado.
   - API: red primero con respaldo en caché (pública o privada).
   - Imágenes y archivos de la app: caché primero.
   ========================================================= */
const version = 'v3';
// Ruta donde está publicada la app ("/" o, por ejemplo, "/mySpa/")
const base = new URL(self.registration.scope).pathname;

const cacheApp = `mySpa-app-${version}`;
const cacheImagenes = `mySpa-imagenes-${version}`;
const cacheApiPublica = `mySpa-api-publica-${version}`;
const cacheApiPrivada = `mySpa-api-privada-${version}`;
const cachesVigentes = [cacheApp, cacheImagenes, cacheApiPublica, cacheApiPrivada];

const appShell = [
  `${base}index.html`,
  `${base}manifest.webmanifest`,
  `${base}logoMySpa.svg`,
  `${base}iconos/icono-192.png`,
  `${base}iconos/icono-512.png`,
  `${base}iconos/icono-maskable-512.png`,
  `${base}iconos/apple-touch-icon.png`,
];

// Catálogos que no dependen de quién inició sesión
const rutasApiPublicas = ['/api/salas', '/api/sucursales', '/api/horarios'];
// Nunca se guardan: estado del servidor, métricas de uso e inicio de sesión
const rutasApiSinCache = ['/api/estado', '/api/metricas', '/api/autenticacion/iniciarSesion'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(cacheApp).then((cache) => cache.addAll(appShell)));
  // No se llama skipWaiting aquí: la página avisa "Hay una nueva versión" y manda activarYa
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres.filter((nombre) => nombre.startsWith('mySpa-') && !cachesVigentes.includes(nombre)).map((nombre) => caches.delete(nombre))))
      .then(() => self.clients.claim())
  );
});

const sePuedeGuardar = (respuesta) => respuesta && (respuesta.ok || respuesta.type === 'opaque');

// ignoreVary: Vite manda los JS/CSS con "Vary: Origin" y los pide con crossorigin (encabezado Origin).
// Sin esto, lo guardado no coincide con la petición y sin conexión la página se queda en blanco.
const buscarEnCache = (peticion, opciones = {}) => caches.match(peticion, { ignoreVary: true, ...opciones });

async function redPrimero(peticion, nombreCache, respaldo) {
  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) {
      const cache = await caches.open(nombreCache);
      await cache.put(peticion, respuesta.clone());
    }
    return respuesta;
  } catch (error) {
    const guardada = (await buscarEnCache(peticion, { cacheName: nombreCache })) ?? (respaldo && (await buscarEnCache(respaldo)));
    if (guardada) return guardada;
    throw error;
  }
}

async function cachePrimero(peticion, nombreCache) {
  const guardada = await buscarEnCache(peticion);
  if (guardada) return guardada;
  const respuesta = await fetch(peticion);
  if (sePuedeGuardar(respuesta)) {
    const cache = await caches.open(nombreCache);
    await cache.put(peticion, respuesta.clone());
  }
  return respuesta;
}

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return; // altas, cambios y bajas siempre van directo a la red
  const url = new URL(peticion.url);

  // 1. Navegación entre páginas de la app
  if (peticion.mode === 'navigate') {
    evento.respondWith(redPrimero(peticion, cacheApp, `${base}index.html`));
    return;
  }

  // 2. API (puede estar en otro puerto u otro dominio)
  if (url.pathname.startsWith('/api/')) {
    if (rutasApiSinCache.some((ruta) => url.pathname.startsWith(ruta))) return;
    const esPublica = rutasApiPublicas.some((ruta) => url.pathname.startsWith(ruta));
    evento.respondWith(redPrimero(peticion, esPublica ? cacheApiPublica : cacheApiPrivada));
    return;
  }

  // 3. Imágenes subidas, fotos del banco y fuentes de Google
  if (url.pathname.startsWith('/subidas/') || url.hostname === 'images.unsplash.com'
    || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    evento.respondWith(cachePrimero(peticion, cacheImagenes));
    return;
  }

  // 4. Archivos de la propia app (JS, CSS, íconos, fuentes locales)
  if (url.origin === self.location.origin) {
    evento.respondWith(cachePrimero(peticion, cacheApp));
  }
});

self.addEventListener('message', (evento) => {
  const { tipo, urls } = evento.data ?? {};
  if (tipo === 'activarYa') self.skipWaiting();
  if (tipo === 'limpiarPrivados') evento.waitUntil(caches.delete(cacheApiPrivada));
  if (tipo === 'guardarRecursos' && Array.isArray(urls)) {
    // Guarda los archivos que la página ya cargó antes de que existiera el service worker
    evento.waitUntil(
      caches.open(cacheApp).then((cache) => Promise.all(urls.map((recurso) => cache.add(recurso).catch(() => null))))
    );
  }
});
