import { generos } from './constantes.js';

/**
 * Definición de cada catálogo. Web y móvil construyen sus listados y
 * formularios a partir de aquí, así un cambio de campo se hace una sola vez.
 *
 * tipos de campo: texto | areaTexto | numero | hora | correo | contrasenia
 *                 | opciones (lista fija) | referencia (otro catálogo) | imagen
 */
const camposPersona = [
  { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
  { nombre: 'apellidoPaterno', etiqueta: 'Apellido paterno', tipo: 'texto', requerido: true },
  { nombre: 'apellidoMaterno', etiqueta: 'Apellido materno', tipo: 'texto' },
  { nombre: 'genero', etiqueta: 'Género', tipo: 'opciones', opciones: generos, requerido: true },
  { nombre: 'domicilio', etiqueta: 'Domicilio', tipo: 'texto' },
  { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'texto' },
];

export const catalogos = {
  empleados: {
    titulo: 'Empleados',
    recurso: 'empleados',
    llave: 'idEmpleado',
    imagenTabla: 'rutaFoto', // miniatura en la tabla
    conEstatus: true,
    columnas: ['numeroEmpleado', 'nombre', 'apellidoPaterno', 'puesto', 'telefono', 'estatus'],
    campos: [
      ...camposPersona,
      { nombre: 'rfc', etiqueta: 'RFC', tipo: 'texto', requerido: true, soloAlta: true },
      { nombre: 'puesto', etiqueta: 'Puesto', tipo: 'texto', requerido: true },
      { nombre: 'foto', etiqueta: 'Fotografía', tipo: 'imagen' },
      { nombre: 'nombreUsuario', etiqueta: 'Usuario', tipo: 'texto', requerido: true },
      { nombre: 'contrasenia', etiqueta: 'Contraseña', tipo: 'contrasenia', requeridoEnAlta: true },
    ],
  },
  clientes: {
    titulo: 'Clientes',
    recurso: 'clientes',
    llave: 'idCliente',
    conEstatus: true,
    columnas: ['numeroUnico', 'nombre', 'apellidoPaterno', 'correo', 'telefono', 'estatus'],
    campos: [
      ...camposPersona,
      { nombre: 'rfc', etiqueta: 'RFC (opcional)', tipo: 'texto' },
      { nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'correo', requerido: true },
      { nombre: 'nombreUsuario', etiqueta: 'Usuario', tipo: 'texto', requerido: true },
      { nombre: 'contrasenia', etiqueta: 'Contraseña', tipo: 'contrasenia', requeridoEnAlta: true },
    ],
  },
  productos: {
    titulo: 'Productos',
    recurso: 'productos',
    llave: 'idProducto',
    imagenTabla: 'rutaFotografia', // foto del producto en la tabla
    imagenCuadrada: true, // los productos se ven mejor en miniatura cuadrada
    conEstatus: true,
    columnas: ['nombre', 'marca', 'precioUso', 'estatus'],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
      { nombre: 'marca', etiqueta: 'Marca', tipo: 'texto', requerido: true },
      { nombre: 'precioUso', etiqueta: 'Precio de uso', tipo: 'numero', requerido: true },
      { nombre: 'fotografia', etiqueta: 'Fotografía del producto', tipo: 'imagen' },
    ],
  },
  sucursales: {
    titulo: 'Sucursales',
    recurso: 'sucursales',
    llave: 'idSucursal',
    conEstatus: true,
    columnas: ['nombre', 'domicilio', 'estatus'],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
      { nombre: 'domicilio', etiqueta: 'Domicilio', tipo: 'texto' },
      { nombre: 'latitud', etiqueta: 'Latitud', tipo: 'numero', requerido: true },
      { nombre: 'longitud', etiqueta: 'Longitud', tipo: 'numero', requerido: true },
    ],
  },
  salas: {
    titulo: 'Salas',
    recurso: 'salas',
    llave: 'idSala',
    imagenTabla: 'rutaFotografia',
    conHorarios: true, // botón para asignar horarios a la sala
    conEstatus: true,
    columnas: ['nombre', 'nombreSucursal', 'descripcion', 'estatus'],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
      { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'areaTexto' },
      {
        nombre: 'idSucursal',
        etiqueta: 'Sucursal',
        tipo: 'referencia',
        origen: 'sucursales',
        llaveOrigen: 'idSucursal',
        etiquetaOrigen: 'nombre',
        requerido: true,
      },
      { nombre: 'fotografia', etiqueta: 'Fotografía', tipo: 'imagen' },
    ],
  },
  horarios: {
    titulo: 'Horarios',
    recurso: 'horarios',
    llave: 'idHorario',
    conEstatus: false, 
    columnas: ['horaInicio', 'horaFin'],
    campos: [
      { nombre: 'horaInicio', etiqueta: 'Hora de inicio', tipo: 'hora', requerido: true },
      { nombre: 'horaFin', etiqueta: 'Hora de término', tipo: 'hora', requerido: true },
    ],
  },
  tratamientos: {
    titulo: 'Tratamientos',
    recurso: 'tratamientos',
    llave: 'idTratamiento',
    conEstatus: true,
    columnas: ['nombre', 'descripcion', 'estatus'],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
      { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'areaTexto' },
    ],
  },
};

export const etiquetasColumnas = {
  numeroEmpleado: 'No. empleado',
  numeroUnico: 'No. cliente',
  nombre: 'Nombre',
  apellidoPaterno: 'Apellido',
  puesto: 'Puesto',
  telefono: 'Teléfono',
  correo: 'Correo',
  marca: 'Marca',
  precioUso: 'Precio de uso',
  domicilio: 'Domicilio',
  nombreSucursal: 'Sucursal',
  descripcion: 'Descripción',
  horaInicio: 'Inicio',
  horaFin: 'Término',
  estatus: 'Estatus',
};