import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { catalogos, validarCliente } from '@myspa/compartido';
import { api } from '../api';
import { useSesion } from '../contexto/SesionContexto';
import { useAvisos } from '../contexto/AvisosContexto';
import CampoFormulario from '../componentes/CampoFormulario';
import { BotonCarga } from '../componentes/Cargando';
import { IconoAlerta } from '../componentes/Iconos';
import { PanelMarca } from './IniciarSesion';

// RNF 0104 - Registro de clientes en la web
export default function Registro() {
  const { iniciarSesion } = useSesion();
  const { avisarExito } = useAvisos();
  const navegar = useNavigate();
  const [datos, setDatos] = useState({});
  const [errores, setErrores] = useState([]);
  const [cargando, setCargando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    const erroresValidacion = validarCliente(datos); // misma validación que la API y la app móvil
    if (erroresValidacion.length) return setErrores(erroresValidacion);
    setCargando(true);
    try {
      const { numeroUnico } = await api.autenticacion.registrarCliente(datos);
      await iniciarSesion(datos.nombreUsuario, datos.contrasenia);
      avisarExito('¡Cuenta creada!', `Tu número de cliente es ${numeroUnico}.`);
      navegar('/cliente/salas');
    } catch (errorRegistro) {
      setErrores([errorRegistro.message]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="pantallaAcceso">
      <PanelMarca />
      <main className="panelFormulario">
        <form className="formularioAcceso formularioRegistro" onSubmit={enviar}>
          <h1>Crea tu cuenta</h1>
          <p className="subtituloAcceso">Regístrate para reservar y consultar tu historial</p>
          <div className="rejillaFormulario">
            {catalogos.clientes.campos.map((campo) => (
              <CampoFormulario key={campo.nombre} campo={campo} esAlta valor={datos[campo.nombre]}
                alCambiar={(valor) => setDatos({ ...datos, [campo.nombre]: valor })} />
            ))}
          </div>
          {errores.map((error) => <p key={error} className="mensajeError"><IconoAlerta tamanio={16} /> {error}</p>)}
          <BotonCarga type="submit" className="botonBloque" cargando={cargando}>{cargando ? 'Creando cuenta…' : 'Registrarme'}</BotonCarga>
          <p className="textoTenue textoCentro">¿Ya tienes cuenta? <Link to="/iniciarSesion">Inicia sesión</Link></p>
        </form>
      </main>
    </div>
  );
}
