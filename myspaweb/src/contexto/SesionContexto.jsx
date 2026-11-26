import { createContext, useContext, useReducer } from 'react';
import { api } from '../api';
import { sesionReductor } from '../reductores/sesionReductor';

const SesionContexto = createContext(null);

export function ProveedorSesion({ children }) {
  const [sesion, despachar] = useReducer(sesionReductor, null, () => JSON.parse(localStorage.getItem('sesionMySpa') ?? 'null'));

  async function iniciarSesion(nombreUsuario, contrasenia) {
    const { token, sesion: nuevaSesion } = await api.autenticacion.iniciarSesion(nombreUsuario, contrasenia);
    localStorage.setItem('tokenMySpa', token);
    localStorage.setItem('sesionMySpa', JSON.stringify(nuevaSesion));
    despachar({ tipo: 'iniciar', sesion: nuevaSesion });
    return nuevaSesion;
  }

  function cerrarSesion() {
    localStorage.removeItem('tokenMySpa');
    localStorage.removeItem('sesionMySpa');
    despachar({ tipo: 'cerrar' });
  }

  return <SesionContexto.Provider value={{ sesion, iniciarSesion, cerrarSesion }}>{children}</SesionContexto.Provider>;
}

export const useSesion = () => useContext(SesionContexto);
