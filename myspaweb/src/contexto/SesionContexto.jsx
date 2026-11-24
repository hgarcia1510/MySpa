import { createContext, useContext, useReducer } from 'react';
import { api } from '../api';
import { limpiarDatosPrivadosSinConexion } from '../pwa/registrarServicio';
import { accionesSesion, crearEstadoSesion, sesionReductor } from '../reductores';

const SesionContexto = createContext(null);

export function ProveedorSesion({ children }) {
  // El estado inicial se lee de localStorage.sesionMySpa
  const [{ sesion }, despachar] = useReducer(sesionReductor, undefined, () => crearEstadoSesion());

  async function iniciarSesion(nombreUsuario, contrasenia) {
    const { token, sesion: nuevaSesion } = await api.autenticacion.iniciarSesion(nombreUsuario, contrasenia);
    localStorage.setItem('tokenMySpa', token);
    localStorage.setItem('sesionMySpa', JSON.stringify(nuevaSesion));
    despachar({ type: accionesSesion.iniciar, sesion: nuevaSesion });
    return nuevaSesion;
  }

  function cerrarSesion() {
    localStorage.removeItem('tokenMySpa');
    localStorage.removeItem('sesionMySpa');
    limpiarDatosPrivadosSinConexion(); // borra del service worker los datos de la API de este usuario
    despachar({ type: accionesSesion.cerrar });
  }

  return <SesionContexto.Provider value={{ sesion, iniciarSesion, cerrarSesion }}>{children}</SesionContexto.Provider>;
}

export const useSesion = () => useContext(SesionContexto);
