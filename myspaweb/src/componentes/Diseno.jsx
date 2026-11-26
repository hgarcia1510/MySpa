import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { roles } from '@myspa/compartido';
import { useSesion } from '../contexto/SesionContexto';
import { useAvisos } from '../contexto/AvisosContexto';
import Logotipo from './Logotipo';
import { IconoFlechaAbajo, IconoSalir, IconoUsuario } from './Iconos';

export default function Diseno({ menu, children }) {
  const { sesion } = useSesion();
  const ubicacion = useLocation();

  return (
    <div className="contenedorApp">
      <header className="encabezado">
        <Link to="/" className="logotipo"><Logotipo tamanio={42} conTexto claro /></Link>
        <nav className="menu">
          {menu.map((opcion) => (
            <NavLink key={opcion.ruta} to={opcion.ruta}>{opcion.texto}</NavLink>
          ))}
        </nav>
        <div className="usuarioActual">
          {sesion ? <MenuUsuario /> : <Link to="/iniciarSesion" className="boton">Iniciar sesión</Link>}
        </div>
      </header>
      {/* key = ruta: reinicia la animación de entrada al cambiar de página */}
      <main className="contenido" key={ubicacion.pathname}>{children ?? <Outlet />}</main>
    </div>
  );
}

/** Menú desplegable con el nombre de quien inició sesión y el cierre de sesión. */
function MenuUsuario() {
  const { sesion, cerrarSesion } = useSesion();
  const { confirmar, avisarInfo } = useAvisos();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  // Se cierra al hacer clic fuera o con la tecla Escape
  useEffect(() => {
    if (!abierto) return;
    const alClicFuera = (evento) => { if (!contenedor.current?.contains(evento.target)) setAbierto(false); };
    const alTecla = (evento) => { if (evento.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', alClicFuera);
    document.addEventListener('keydown', alTecla);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      document.removeEventListener('keydown', alTecla);
    };
  }, [abierto]);

  async function salir() {
    setAbierto(false);
    const confirmado = await confirmar({ titulo: '¿Cerrar sesión?', mensaje: 'Tendrás que volver a ingresar tu usuario y contraseña.', textoAceptar: 'Cerrar sesión' });
    if (!confirmado) return;
    cerrarSesion();
    avisarInfo('Sesión cerrada', '¡Vuelve pronto a relajarte!');
    navegar('/iniciarSesion');
  }

  const iniciales = sesion.nombre?.split(' ').map((parte) => parte[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div ref={contenedor}>
      <button className="botonUsuario" aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto((actual) => !actual)}>
        <span className="avatar">{iniciales}</span>
        <span className="datosUsuario">
          <b>{sesion.nombre}</b>
          <small>{sesion.rol}</small>
        </span>
        <IconoFlechaAbajo tamanio={16} className="flechaUsuario" />
      </button>
      {abierto && (
        <div className="menuDesplegable" role="menu">
          <div className="cabeceraDesplegable">
            <span className="avatar">{iniciales}</span>
            <div>
              <b>{sesion.nombre}</b>
              <small>{sesion.rol}</small>
            </div>
          </div>
          {sesion.rol === roles.cliente && (
            <button className="opcionDesplegable" role="menuitem" onClick={() => { setAbierto(false); navegar('/cliente/perfil'); }}>
              <IconoUsuario tamanio={17} /> Mi perfil
            </button>
          )}
          <button className="opcionDesplegable peligro" role="menuitem" onClick={salir}>
            <IconoSalir tamanio={17} /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
