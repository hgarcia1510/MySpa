import { Navigate } from 'react-router-dom';
import { useSesion } from '../contexto/SesionContexto';

export default function RutaProtegida({ rol, children }) {
  const { sesion } = useSesion();
  if (!sesion) return <Navigate to="/iniciarSesion" replace />;
  if (sesion.rol !== rol) return <Navigate to="/" replace />;
  return children;
}
