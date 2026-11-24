import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from '../contexto/SesionContexto';
import { useAvisos } from '../contexto/AvisosContexto';
import Logotipo from './Logotipo';
import { IconoSalir } from './Iconos';
import { AvisosPwa, BotonInstalar } from './BarraPwa';

export default function Diseno({ menu, children }) {
  const { sesion, cerrarSesion } = useSesion();
  const { confirmar, avisarInfo } = useAvisos();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  async function salir() {
    const confirmado = await confirmar({ titulo: '¿Cerrar sesión?', mensaje: 'Tendrás que volver a ingresar tu usuario y contraseña.', textoAceptar: 'Cerrar sesión' });
    if (!confirmado) return;
    cerrarSesion();
    avisarInfo('Sesión cerrada', '¡Vuelve pronto a relajarte!');
    navegar('/iniciarSesion');
  }

  const iniciales = sesion?.nombre?.split(' ').map((parte) => parte[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="contenedorApp">
      <header className="encabezado">
        <Link to="/" className="logotipo"><Logotipo tamanio={38} conTexto /></Link>
        <nav className="menu">
          {menu.map((opcion) => (
            <NavLink key={opcion.ruta} to={opcion.ruta}>{opcion.texto}</NavLink>
          ))}
        </nav>
        <div className="usuarioActual">
          <BotonInstalar />
          {sesion ? (
            <>
              <span className="avatar">{iniciales}</span>
              <span className="datosUsuario">
                <b>{sesion.nombre}</b>
                <small>{sesion.rol}</small>
              </span>
              <button className="botonFantasma botonChico" onClick={salir} title="Cerrar sesión"><IconoSalir /> Salir</button>
            </>
          ) : (
            <Link to="/iniciarSesion" className="boton">Iniciar sesión</Link>
          )}
        </div>
      </header>
      <AvisosPwa />
      {/* key = ruta: reinicia la animación de entrada al cambiar de página */}
      <main className="contenido" key={ubicacion.pathname}>{children ?? <Outlet />}</main>
    </div>
  );
}
