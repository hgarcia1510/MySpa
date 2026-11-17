import { crearClienteApi } from '@myspa/compartido';

export const urlServidor = import.meta.env.VITE_URL_API ?? 'http://localhost:3000';

export const api = crearClienteApi({
  urlBase: `${urlServidor}/api`,
  obtenerToken: () => localStorage.getItem('tokenMySpa'),
});
