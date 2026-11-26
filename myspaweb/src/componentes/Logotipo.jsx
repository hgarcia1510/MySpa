import { useId } from 'react';

/**
 * Logo de MySPA: emblema de loto trazado en línea fina dorada dentro de un
 * doble anillo (estilo sello de casa de lujo) + logotipo serif espaciado.
 * tamanio: alto en px. conTexto: muestra "MYSPA" a un lado. animado: el loto "respira".
 * claro: versión para fondos oscuros (dorado claro sobre transparente).
 */
export default function Logotipo({ tamanio = 40, conTexto = false, animado = false, claro = false }) {
  const id = useId().replace(/:/g, '');
  const idOro = `oroLogo${id}`;
  const idFondo = `fondoLogo${id}`;

  return (
    <span className={`logotipo ${animado ? 'logotipoAnimado' : ''} ${claro ? 'logotipoClaro' : ''}`}>
      <svg width={tamanio} height={tamanio} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id={idOro} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f3e3bd" />
            <stop offset="45%" stopColor="#c9a464" />
            <stop offset="100%" stopColor="#8f6c35" />
          </linearGradient>
          <radialGradient id={idFondo} cx="50%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#24433b" />
            <stop offset="100%" stopColor="#0f1f1b" />
          </radialGradient>
        </defs>
        {/* sello: fondo esmeralda + doble anillo dorado */}
        <circle cx="32" cy="32" r="31" fill={claro ? 'rgba(10, 22, 19, .35)' : `url(#${idFondo})`} />
        <circle cx="32" cy="32" r="29.2" fill="none" stroke={`url(#${idOro})`} strokeWidth="1.3" />
        <circle cx="32" cy="32" r="26.4" fill="none" stroke={`url(#${idOro})`} strokeWidth=".5" opacity=".7" />
        <g className="petalosLogo" fill="none" stroke={`url(#${idOro})`} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
          {/* pétalo central */}
          <path d="M32 14.5 C37.6 21 37.6 31.5 32 39 C26.4 31.5 26.4 21 32 14.5 Z" />
          {/* pétalos medios */}
          <path d="M32 39 C29.6 31 25.4 25.6 19.6 23.6 C19 31.4 23.8 37.4 32 39" />
          <path d="M32 39 C34.4 31 38.6 25.6 44.4 23.6 C45 31.4 40.2 37.4 32 39" />
          {/* pétalos exteriores */}
          <path d="M32 39 C26.6 34.8 20.6 33 14.4 33.6 C17.2 39 24 41 32 39" />
          <path d="M32 39 C37.4 34.8 43.4 33 49.6 33.6 C46.8 39 40 41 32 39" />
          {/* nervadura del pétalo central */}
          <path d="M32 20 V34" strokeWidth=".6" opacity=".7" />
        </g>
        {/* base: agua y punto */}
        <path d="M21 44.5 H43" stroke={`url(#${idOro})`} strokeWidth="1" strokeLinecap="round" />
        <path d="M25 47.6 H39" stroke={`url(#${idOro})`} strokeWidth=".7" strokeLinecap="round" opacity=".7" />
        <circle cx="32" cy="9.6" r="1" fill={`url(#${idOro})`} />
      </svg>
      {conTexto && (
        <span className="textoLogotipo">
          <span className="marcaLogotipo">MY<b>SPA</b></span>
          <small className="lemaLogotipo">Wellness · Retreat</small>
        </span>
      )}
    </span>
  );
}
