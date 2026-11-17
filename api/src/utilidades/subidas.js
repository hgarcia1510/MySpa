import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

export const carpetaSubidas = path.resolve('subidas');
fs.mkdirSync(carpetaSubidas, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: carpetaSubidas,
  filename: (peticion, archivo, terminar) =>
    terminar(null, `${Date.now()}-${archivo.originalname.replace(/[^\w.-]/g, '_')}`),
});

export const subirImagen = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (peticion, archivo, terminar) => terminar(null, archivo.mimetype.startsWith('image/')),
});

/** Copia el archivo subido a las columnas nombre/ruta del registro. */
export function asignarArchivo(datos, archivo, columnaNombre, columnaRuta) {
  if (!archivo) return datos;
  return { ...datos, [columnaNombre]: archivo.filename, [columnaRuta]: `/subidas/${archivo.filename}` };
}