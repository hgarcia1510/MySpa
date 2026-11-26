import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: {
        id: '/',
        name: 'MySPA',
        short_name: 'MySPA',
        description: 'Reserva tu sala y tus tratamientos en MySPA.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#12221e',
        background_color: '#12221e',
        icons: [
          { src: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/iconos/icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/iconos/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        // Los datos de la API nunca se guardan en caché: siempre vienen del servidor
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fuentes', expiration: { maxEntries: 20 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fotosSpa',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  // Permite a Vite leer la carpeta ../compartido
  server: { fs: { allow: ['..'] } },
});
