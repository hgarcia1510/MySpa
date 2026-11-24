/** Íconos SVG ligeros (trazo) para no depender de librerías. */
function Icono({ children, tamanio = 18 }) {
  return (
    <svg width={tamanio} height={tamanio} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconoBuscar = (p) => <Icono {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icono>;
export const IconoMas = (p) => <Icono {...p}><path d="M12 5v14M5 12h14" /></Icono>;
export const IconoEditar = (p) => <Icono {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Icono>;
export const IconoBasura = (p) => <Icono {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></Icono>;
export const IconoReloj = (p) => <Icono {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icono>;
export const IconoSalir = (p) => <Icono {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Icono>;
export const IconoUbicacion = (p) => <Icono {...p}><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" /><circle cx="12" cy="9" r="2.5" /></Icono>;
export const IconoCalendario = (p) => <Icono {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icono>;
export const IconoCheck = (p) => <Icono {...p}><path d="M20 6 9 17l-5-5" /></Icono>;
export const IconoX = (p) => <Icono {...p}><path d="M18 6 6 18M6 6l12 12" /></Icono>;
export const IconoAlerta = (p) => <Icono {...p}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></Icono>;
export const IconoUsuario = (p) => <Icono {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icono>;
export const IconoCandado = (p) => <Icono {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icono>;
export const IconoHoja = (p) => <Icono {...p}><path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-10 16Z" /><path d="M4 21c4-4 7-6 11-8" /></Icono>;
export const IconoFlechaIzquierda = (p) => <Icono {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></Icono>;
export const IconoMasaje = (p) => <Icono {...p}><circle cx="17" cy="6" r="2" /><path d="M3 15h13a3 3 0 0 0 3-3v-1" /><path d="M2 19h20" /><path d="M7 15l2-4h5" /></Icono>;
export const IconoBrillo = (p) => <Icono {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" /><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8Z" /></Icono>;
export const IconoDescargar = (p) => <Icono {...p}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></Icono>;
export const IconoGrafica = (p) => <Icono {...p}><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 6-6" /></Icono>;
/** Estrella de calificación: con relleno = marcada. */
export const IconoEstrella = ({ relleno = false, ...p }) => (
  <Icono {...p}>
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9Z" fill={relleno ? 'currentColor' : 'none'} />
  </Icono>
);
