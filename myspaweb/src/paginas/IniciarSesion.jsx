import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSesion } from '../contexto/SesionContexto';
import { useAvisos } from '../contexto/AvisosContexto';
import Logotipo from '../componentes/Logotipo';
import { BotonCarga } from '../componentes/Cargando';
import { IconoAlerta } from '../componentes/Iconos';
import { FondosCarrusel, PuntosCarrusel, useCarrusel } from '../componentes/Carrusel';
import { fotosSpa, urlFotoSpa } from '../fotosSpa';

/**
 * Fotos del carrusel del login: las 6 primeras del banco.
 * Si guardas tus fotos en public/carrusel/1.jpg … 6.jpg se usan esas (sin internet).
 */
const fotosLogin = fotosSpa.slice(0, 6).map((foto, indice) => ({
  ...foto,
  fondo: `url('/carrusel/${indice + 1}.jpg'), url('${urlFotoSpa(foto, 1400, 1600)}')`,
}));

/** Panel de marca con carrusel de fotos que comparten el login y el registro. */
export function PanelMarca() {
  const [fotoActual, setFotoActual] = useCarrusel(fotosLogin.length, 6);

  return (
    <aside className="panelMarca">
      <FondosCarrusel fotos={fotosLogin} actual={fotoActual} />
      <Logotipo tamanio={54} conTexto animado claro />
      <div className="textoMarca">
        <h2>Tu momento de calma empieza aquí.</h2>
        <p>Reserva tu sala favorita, consulta tus tratamientos y vive la experiencia MySPA desde cualquier dispositivo.</p>
      </div>
      <div className="pieCarrusel">
        <p key={fotoActual} className="tituloFoto">{fotosLogin[fotoActual].titulo}</p>
        <PuntosCarrusel fotos={fotosLogin} actual={fotoActual} alCambiar={setFotoActual} />
      </div>
    </aside>
  );
}

export default function IniciarSesion() {
  const { iniciarSesion } = useSesion();
  const { avisarExito } = useAvisos();
  const navegar = useNavigate();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [intentos, setIntentos] = useState(0);

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setCargando(true);
    try {
      const sesion = await iniciarSesion(nombreUsuario.trim(), contrasenia);
      avisarExito(`¡Hola, ${sesion.nombre.split(' ')[0]}!`, 'Iniciaste sesión correctamente.');
      navegar('/');
    } catch (errorSesion) {
      setError(errorSesion.message);
      setIntentos((actual) => actual + 1); // dispara la animación de sacudida
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="pantallaAcceso">
      <PanelMarca />
      <main className="panelFormulario">
        <form key={intentos} className={`formularioAcceso ${error ? 'conError' : ''}`} onSubmit={enviar}>
          <h1>Bienvenido de nuevo</h1>
          <p className="subtituloAcceso">Ingresa a tu cuenta para continuar</p>
          <label className="campo"><span>Usuario</span>
            <input value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} placeholder="Tu nombre de usuario" autoComplete="username" required autoFocus />
          </label>
          <label className="campo"><span>Contraseña</span>
            <input type="password" value={contrasenia} onChange={(e) => setContrasenia(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
          </label>
          {error && <p className="mensajeError"><IconoAlerta tamanio={16} /> {error}</p>}
          <BotonCarga type="submit" className="botonBloque" cargando={cargando}>{cargando ? 'Entrando…' : 'Entrar'}</BotonCarga>
          <div className="separador">o</div>
          <p className="textoTenue textoCentro">¿Eres cliente nuevo? <Link to="/registro">Crea tu cuenta</Link></p>
          <p className="textoTenue textoCentro"><Link to="/salas">Ver salas sin iniciar sesión</Link></p>
        </form>
      </main>
    </div>
  );
}
