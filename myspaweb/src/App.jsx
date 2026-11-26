import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { roles } from '@myspa/compartido';
import { useSesion } from './contexto/SesionContexto';
import RutaProtegida from './componentes/RutaProtegida';
import Diseno from './componentes/Diseno';
import PaginaCatalogo from './componentes/PaginaCatalogo';
import IniciarSesion from './paginas/IniciarSesion';
import Registro from './paginas/Registro';
import CatalogoSalas from './paginas/CatalogoSalas';
import Reservaciones from './paginas/empleado/Reservaciones';
import Servicios from './paginas/empleado/Servicios';
import MisReservaciones from './paginas/cliente/MisReservaciones';
import MiPerfil from './paginas/cliente/MiPerfil';
import { PantallaCarga } from './componentes/Cargando';
import { api } from './api';

const menuEmpleado = [
  { ruta: '/empleado/reservaciones', texto: 'Reservaciones' },
  { ruta: '/empleado/servicios', texto: 'Servicios' },
  { ruta: '/empleado/clientes', texto: 'Clientes' },
  { ruta: '/empleado/empleados', texto: 'Empleados' },
  { ruta: '/empleado/salas', texto: 'Salas' },
  { ruta: '/empleado/tratamientos', texto: 'Tratamientos' },
  { ruta: '/empleado/productos', texto: 'Productos' },
];

const menuCliente = [
  { ruta: '/cliente/salas', texto: 'Salas' },
  { ruta: '/cliente/reservaciones', texto: 'Mis reservaciones' },
  { ruta: '/cliente/perfil', texto: 'Mi perfil' },
];

export default function App() {
  const { sesion } = useSesion();
  const inicio = sesion?.rol === roles.empleado ? '/empleado/reservaciones' : sesion ? '/cliente/salas' : '/salas';
  const [estadoServidor, setEstadoServidor] = useState('verificando'); // verificando | listo | sinConexion
  const [intento, setIntento] = useState(0);

  // Pantalla de carga inicial: verifica que la API responda (mínimo 900 ms para que se aprecie la animación)
  useEffect(() => {
    const espera = new Promise((resolver) => setTimeout(resolver, 900));
    Promise.all([api.peticion('/estado'), espera])
      .then(() => setEstadoServidor('listo'))
      .catch(() => espera.then(() => setEstadoServidor('sinConexion')));
  }, [intento]);

  // Sin conexión: se puede reintentar a mano, y se reintenta solo cuando regresa el internet
  const reintentar = () => { setEstadoServidor('verificando'); setIntento((actual) => actual + 1); };
  useEffect(() => {
    if (estadoServidor !== 'sinConexion') return;
    window.addEventListener('online', reintentar);
    return () => window.removeEventListener('online', reintentar);
  }, [estadoServidor]);

  if (estadoServidor === 'verificando') return <PantallaCarga />;
  if (estadoServidor === 'sinConexion') {
    const texto = navigator.onLine
      ? 'No hay conexión con el servidor. Revisa que la API esté encendida (npm run dev en la carpeta api).'
      : 'No tienes internet. En cuanto vuelva la conexión, MySPA se abrirá solo.';
    return <PantallaCarga texto={texto}><button onClick={reintentar}>Reintentar</button></PantallaCarga>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={inicio} replace />} />
      <Route path="/iniciarSesion" element={<IniciarSesion />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/salas" element={<Diseno menu={[]}><CatalogoSalas /></Diseno>} />

      {/* RNF 0103 - Espacio de empleados */}
      <Route element={<RutaProtegida rol={roles.empleado}><Diseno menu={menuEmpleado} /></RutaProtegida>}>
        <Route path="/empleado/reservaciones" element={<Reservaciones />} />
        <Route path="/empleado/servicios" element={<Servicios />} />
        {['clientes', 'empleados', 'salas', 'tratamientos', 'productos'].map((clave) => (
          <Route key={clave} path={`/empleado/${clave}`} element={<PaginaCatalogo clave={clave} />} />
        ))}
      </Route>

      {/* RNF 0104 - Espacio de clientes */}
      <Route element={<RutaProtegida rol={roles.cliente}><Diseno menu={menuCliente} /></RutaProtegida>}>
        <Route path="/cliente/salas" element={<CatalogoSalas />} />
        <Route path="/cliente/reservaciones" element={<MisReservaciones />} />
        <Route path="/cliente/perfil" element={<MiPerfil />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
