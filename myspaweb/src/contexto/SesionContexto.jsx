import { createContext, useContext, useState } from 'react';
import { api } from '../api';

const SesionContexto = createContext(null);

export function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(() => JSON.parse(localStorage.getItem('sesionMySpa') ?? 'null'));

  async function iniciarSesion(nombreUsuario, contrasenia) {
    const { token, sesion: nuevaSesion } = await api.autenticacion.iniciarSesion(nombreUsuario, contrasenia);
    localStorage.setItem('tokenMySpa', token);
    localStorage.setItem('sesionMySpa', JSON.stringify(nuevaSesion));
    setSesion(nuevaSesion);
    return nuevaSesion;
  }

  function cerrarSesion() {
    localStorage.removeItem('tokenMySpa');
    localStorage.removeItem('sesionMySpa');
    setSesion(null);
  }

  return <SesionContexto.Provider value={{ sesion, iniciarSesion, cerrarSesion }}>{children}</SesionContexto.Provider>;
}

export const useSesion = () => useContext(SesionContexto);
