import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { conexionBd, enTransaccion } from '../config/baseDatos.js';
import { generarToken, verificarToken, permitirRoles } from '../middlewares/autenticacion.js';
import { ErrorNegocio, lanzarSiHayErrores } from '../utilidades/errores.js';
import { crearCliente, actualizarPersonaCompleta } from '../servicios/personasServicio.js';
import { roles, validarCliente } from '@myspa/compartido';

export const autenticacionRutas = Router();

async function buscarPerfil(idUsuario, rol) {
  const tabla = rol === roles.empleado ? 'empleado' : 'cliente';
  const [filas] = await conexionBd.query(
    `SELECT x.*, p.nombre, p.apellidoPaterno, p.apellidoMaterno, p.genero, p.rfc, p.domicilio, p.telefono
     FROM ${tabla} x JOIN persona p ON p.idPersona = x.idPersona
     WHERE x.idUsuario = ? AND x.estatus = 'Activo'`,
    [idUsuario]
  );
  return filas[0];
}

// RNF 0101 - inicio de sesión para clientes y empleados (web y móvil)
autenticacionRutas.post('/iniciarSesion', async (peticion, respuesta) => {
  const { nombreUsuario, contrasenia } = peticion.body;
  const [usuarios] = await conexionBd.query('SELECT * FROM usuario WHERE nombreUsuario = ?', [nombreUsuario]);
  const usuario = usuarios[0];
  if (!usuario || !(await bcrypt.compare(contrasenia ?? '', usuario.contrasenia))) {
    throw new ErrorNegocio('Usuario o contraseña incorrectos', 401);
  }
  const perfil = await buscarPerfil(usuario.idUsuario, usuario.rol);
  if (!perfil) throw new ErrorNegocio('Tu cuenta está inactiva', 403);

  const sesion = {
    idUsuario: usuario.idUsuario,
    rol: usuario.rol,
    nombre: `${perfil.nombre} ${perfil.apellidoPaterno}`,
    idEmpleado: perfil.idEmpleado ?? null,
    idCliente: perfil.idCliente ?? null,
  };
  respuesta.json({ token: generarToken(sesion), sesion });
});

// RNF 0104 - registro de clientes desde la web
autenticacionRutas.post('/registro', async (peticion, respuesta) => {
  lanzarSiHayErrores(validarCliente(peticion.body, { esAlta: true }));
  const resultado = await enTransaccion((conexion) => crearCliente(conexion, peticion.body));
  respuesta.status(201).json(resultado);
});

autenticacionRutas.get('/miPerfil', verificarToken, async (peticion, respuesta) => {
  const perfil = await buscarPerfil(peticion.sesion.idUsuario, peticion.sesion.rol);
  respuesta.json({ ...perfil, nombreUsuario: undefined, rol: peticion.sesion.rol });
});

// RNF 0104 - el cliente modifica sus propios datos
autenticacionRutas.put('/miPerfil', verificarToken, permitirRoles(roles.cliente), async (peticion, respuesta) => {
  const { estatus, numeroUnico, ...datos } = peticion.body; // el cliente no puede cambiar estos
  await enTransaccion((conexion) =>
    actualizarPersonaCompleta(conexion, {
      tabla: 'cliente',
      llave: 'idCliente',
      id: peticion.sesion.idCliente,
      datos,
      columnasPropias: ['correo'],
    })
  );
  respuesta.json({ mensaje: 'Datos actualizados' });
});
