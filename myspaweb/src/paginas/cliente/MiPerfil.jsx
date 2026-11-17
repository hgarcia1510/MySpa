import { useEffect, useState } from 'react';
import { catalogos, validarCliente } from '@myspa/compartido';
import { api } from '../../api';
import { useAvisos } from '../../contexto/AvisosContexto';
import CampoFormulario from '../../componentes/CampoFormulario';
import { BotonCarga, CargaSeccion } from '../../componentes/Cargando';
import { IconoAlerta } from '../../componentes/Iconos';

// RNF 0104 - El cliente modifica sus propios datos
const camposEditables = catalogos.clientes.campos.filter((campo) => campo.nombre !== 'nombreUsuario');

export default function MiPerfil() {
  const { avisarExito, confirmar } = useAvisos();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { api.autenticacion.obtenerMiPerfil().then(setDatos); }, []);

  async function guardar(evento) {
    evento.preventDefault();
    const errores = validarCliente({ ...datos, nombreUsuario: 'x' }, { esAlta: false });
    if (errores.length) return setError(errores.join('. '));
    if (!(await confirmar({ titulo: '¿Guardar los cambios?', mensaje: 'Se actualizarán tus datos personales.', textoAceptar: 'Guardar' }))) return;
    setGuardando(true);
    try {
      const cuerpo = Object.fromEntries(camposEditables.map((campo) => [campo.nombre, datos[campo.nombre]]));
      await api.autenticacion.actualizarMiPerfil(cuerpo);
      avisarExito('Perfil actualizado', 'Tus datos se guardaron correctamente.');
      setError('');
    } catch (errorGuardar) {
      setError(errorGuardar.message);
    } finally {
      setGuardando(false);
    }
  }

  if (!datos) return <CargaSeccion texto="Cargando tu perfil…" />;
  const iniciales = `${datos.nombre?.[0] ?? ''}${datos.apellidoPaterno?.[0] ?? ''}`.toUpperCase();

  return (
    <form className="tarjeta tarjetaPerfil animarEntrada" onSubmit={guardar}>
      <div className="cabeceraPerfil">
        <span className="avatar">{iniciales}</span>
        <div>
          <h1>{datos.nombre} {datos.apellidoPaterno}</h1>
          <p className="textoTenue">No. de cliente: <b>{datos.numeroUnico}</b></p>
        </div>
      </div>
      <div className="rejillaFormulario">
        {camposEditables.map((campo) => (
          <CampoFormulario key={campo.nombre} campo={campo} esAlta={false} valor={datos[campo.nombre]}
            alCambiar={(valor) => setDatos({ ...datos, [campo.nombre]: valor })} />
        ))}
      </div>
      {error && <p className="mensajeError"><IconoAlerta tamanio={16} /> {error}</p>}
      <div><BotonCarga type="submit" cargando={guardando}>Guardar cambios</BotonCarga></div>
    </form>
  );
}
