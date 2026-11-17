import { useEffect, useState } from 'react';
import { api } from '../api';

/** Dibuja un campo a partir de su definición en @myspa/compartido (catalogos.js). */
export default function CampoFormulario({ campo, valor, alCambiar, esAlta, urlActual }) {
  const [opcionesReferencia, setOpcionesReferencia] = useState([]);

  useEffect(() => {
    // RNF 03: el usuario elige de una lista, nunca escribe IDs
    if (campo.tipo === 'referencia') api[campo.origen].listar().then(setOpcionesReferencia);
  }, [campo]);

  const requerido = campo.requerido || (esAlta && campo.requeridoEnAlta);
  const comun = { id: campo.nombre, required: requerido };

  let control;
  switch (campo.tipo) {
    case 'areaTexto':
      control = <textarea {...comun} value={valor ?? ''} onChange={(e) => alCambiar(e.target.value)} />;
      break;
    case 'opciones':
      control = (
        <select {...comun} value={valor ?? ''} onChange={(e) => alCambiar(e.target.value)}>
          <option value="">Selecciona…</option>
          {campo.opciones.map((opcion) => <option key={opcion}>{opcion}</option>)}
        </select>
      );
      break;
    case 'referencia':
      control = (
        <select {...comun} value={valor ?? ''} onChange={(e) => alCambiar(e.target.value)}>
          <option value="">Selecciona…</option>
          {opcionesReferencia.map((opcion) => (
            <option key={opcion[campo.llaveOrigen]} value={opcion[campo.llaveOrigen]}>{opcion[campo.etiquetaOrigen]}</option>
          ))}
        </select>
      );
      break;
    case 'imagen': {
      // Vista previa: la imagen nueva elegida o la que ya tenía guardada
      const vistaPrevia = valor instanceof File ? URL.createObjectURL(valor) : urlActual;
      control = (
        <div className="campoImagen">
          {vistaPrevia && <img className="vistaPrevia" src={vistaPrevia} alt={campo.etiqueta} />}
          <input id={campo.nombre} type="file" accept="image/*" onChange={(e) => alCambiar(e.target.files[0])} />
        </div>
      );
      break;
    }
    default: {
      const tiposHtml = { numero: 'number', hora: 'time', correo: 'email', contrasenia: 'password' };
      control = (
        <input
          {...comun}
          type={tiposHtml[campo.tipo] ?? 'text'}
          step={campo.tipo === 'numero' ? 'any' : undefined}
          placeholder={campo.tipo === 'contrasenia' && !esAlta ? 'Déjala vacía para no cambiarla' : ''}
          value={valor instanceof File ? '' : valor ?? ''}
          onChange={(e) => alCambiar(e.target.value)}
        />
      );
    }
  }

  return (
    <label className="campo" htmlFor={campo.nombre}>
      <span>{campo.etiqueta}{requerido && ' *'}</span>
      {control}
    </label>
  );
}
