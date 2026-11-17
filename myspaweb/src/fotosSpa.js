/**
 * Banco de fotos de spa (Unsplash, uso libre). Todas se verificaron.
 * Se usan en los carruseles y como foto de las salas que aún no tienen una propia.
 */
export const fotosSpa = [
  { idUnsplash: '1544161515-4ab6ce6db874', titulo: 'Masajes con aceites esenciales' },
  { idUnsplash: '1600334129128-685c5582fd35', titulo: 'Terapia de piedras calientes' },
  { idUnsplash: '1570172619644-dfd03ed5d881', titulo: 'Faciales y mascarillas' },
  { idUnsplash: '1507652313519-d4e9174996dd', titulo: 'Espacios para desconectarte' },
  { idUnsplash: '1620733723572-11c53f73a416', titulo: 'Aromaterapia' },
  { idUnsplash: '1610402601271-5b4bd5b3eba4', titulo: 'Relajación profunda' },
  { idUnsplash: '1540555700478-4be289fbecef', titulo: 'Cuidado personal' },
  { idUnsplash: '1515377905703-c4788e51af15', titulo: 'Rituales de bienestar' },
  { idUnsplash: '1519823551278-64ac92734fb1', titulo: 'Masaje terapéutico' },
  { idUnsplash: '1596178060671-7a80dc8059ea', titulo: 'Tratamientos holísticos' },
  { idUnsplash: '1552693673-1bf958298935', titulo: 'Tratamientos faciales' },
];

export const urlFotoSpa = (foto, ancho = 1400, alto = 1000) =>
  `https://images.unsplash.com/photo-${foto.idUnsplash}?w=${ancho}&h=${alto}&fit=crop&q=75&fm=jpg`;

/** Foto distinta para cada sala sin fotografía propia (siempre la misma para la misma sala). */
export const fotoParaSala = (idSala) => fotosSpa[(Number(idSala) * 7) % fotosSpa.length];
