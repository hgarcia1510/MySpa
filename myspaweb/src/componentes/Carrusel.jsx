import { useEffect, useState } from 'react';

/** Controla qué foto se muestra y avanza sola cada `segundos`. Al elegir una, el conteo se reinicia. */
export function useCarrusel(cantidad, segundos = 6) {
  const [actual, setActual] = useState(0);
  useEffect(() => {
    const intervalo = setInterval(() => setActual((indice) => (indice + 1) % cantidad), segundos * 1000);
    return () => clearInterval(intervalo);
  }, [actual, cantidad, segundos]);
  return [actual, setActual];
}

/** Fotos apiladas: solo la activa es visible, con desvanecido y acercamiento suave. fotos: [{ fondo }] */
export function FondosCarrusel({ fotos, actual }) {
  return fotos.map((foto, indice) => (
    <span key={indice} className={`fotoMarca ${indice === actual ? 'activa' : ''}`} style={{ backgroundImage: foto.fondo }} aria-hidden="true" />
  ));
}

/** Puntos para elegir la foto; el activo se alarga. */
export function PuntosCarrusel({ fotos, actual, alCambiar }) {
  return (
    <div className="puntosCarrusel" role="tablist" aria-label="Fotos">
      {fotos.map((foto, indice) => (
        <button key={indice} type="button" role="tab" aria-selected={indice === actual} aria-label={foto.titulo}
          className={indice === actual ? 'activo' : ''} onClick={() => alCambiar(indice)} />
      ))}
    </div>
  );
}
