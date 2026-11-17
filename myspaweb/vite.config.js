import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Permite a Vite leer la carpeta ../compartido
  server: { fs: { allow: ['..'] } },
});
