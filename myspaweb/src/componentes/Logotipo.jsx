/**
 * Logo de MySPA: flor de loto de 5 pétalos sobre una gota de agua,
 * con el degradado lavanda → menta de la marca.
 * tamanio: alto en px. conTexto: muestra "MySPA" a un lado. animado: pétalos que respiran.
 */
export default function Logotipo({ tamanio = 40, conTexto = false, animado = false, claro = false }) {
  const idDegradado = `degradadoLogo${claro ? 'Claro' : ''}`;
  return (
    <span className={`logotipo ${animado ? 'logotipoAnimado' : ''} ${claro ? 'logotipoClaro' : ''}`}>
      <svg width={tamanio} height={tamanio} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id={idDegradado} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={claro ? '#ffffff' : '#8b7fe8'} />
            <stop offset="100%" stopColor={claro ? '#e3fbf6' : '#4fb8a8'} />
          </linearGradient>
        </defs>
        {/* gota / círculo de fondo */}
        <circle cx="32" cy="32" r="30" fill={claro ? 'rgba(255,255,255,.18)' : '#f3f1fe'} />
        <g className="petalosLogo" fill={`url(#${idDegradado})`}>
          {/* pétalo central */}
          <path d="M32 12 C40 22 40 34 32 44 C24 34 24 22 32 12 Z" />
          {/* pétalos medios */}
          <path d="M14 26 C24 24 31 32 32 44 C21 43 14 36 14 26 Z" opacity=".85" />
          <path d="M50 26 C40 24 33 32 32 44 C43 43 50 36 50 26 Z" opacity=".85" />
          {/* pétalos exteriores */}
          <path d="M8 38 C18 34 27 38 32 44 C24 48 14 46 8 38 Z" opacity=".6" />
          <path d="M56 38 C46 34 37 38 32 44 C40 48 50 46 56 38 Z" opacity=".6" />
        </g>
        {/* agua */}
        <path d="M16 50 Q24 47 32 50 T48 50" fill="none" stroke={claro ? '#ffffff' : '#4fb8a8'} strokeWidth="2.4" strokeLinecap="round" opacity=".8" />
      </svg>
      {conTexto && (
        <span className="textoLogotipo">
          My<b>SPA</b>
        </span>
      )}
    </span>
  );
}
