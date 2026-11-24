import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { roles } from '@myspa/compartido';
import { useSesion } from './contexto/SesionContexto';
import { usePwa } from './contexto/PwaContexto';
import { controlaLaPagina } from './pwa/registrarServicio';
import RutaProtegida from './componentes/RutaProtegida';
import Diseno from './componentes/Diseno';
import PaginaCatalogo from './componentes/PaginaCatalogo';
import IniciarSesion from './paginas/IniciarSesion';
import Registro from './paginas/Registro';
import CatalogoSalas from './paginas/CatalogoSalas';
import Dashboard from './paginas/empleado/Dashboard';
import Reservaciones from './paginas/empleado/Reservaciones';
import Servicios from './paginas/empleado/Servicios';
import MisReservaciones from './paginas/cliente/MisReservaciones';
import MiPerfil from './paginas/cliente/MiPerfil';
import { PantallaCarga } from './componentes/Cargando';
import { api } from './api';

const menuEmpleado = [
  { ruta: '/empleado/dashboard', texto: 'Dashboard' },
  { ruta: '/empleado/reservaciones', texto: 'Reservaciones' },
  { ruta: '/empleado/servicios', texto: 'Servicios' },
  { ruta: '/empleado/clientes', texto: 'Clientes' },
  { ruta: '/empleado/empleados', texto: 'Empleados' },
  { ruta: '/empleado/sucursales', texto: 'Sucursales' },
  { ruta: '/empleado/salas', texto: 'Salas' },
  { ruta: '/empleado/horarios', texto: 'Horarios' },
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
  const inicio = sesion?.rol === roles.empleado ? '/empleado/dashboard' : sesion ? '/cliente/salas' : '/salas';
  const { marcarServidor } = usePwa();
  const [estadoServidor, setEstadoServidor] = useState('verificando'); // verificando | listo | sinConexion

  // Pantalla de carga inicial: verifica que la API responda (mínimo 900 ms para que se aprecie la animación)
  useEffect(() => {
    const espera = new Promise((resolver) => setTimeout(resolver, 900));
    Promise.all([api.peticion('/estado'), espera])
      .then(() => {
        marcarServidor(true);
        setEstadoServidor('listo');
      })
      .catch(() => espera.then(() => {
        marcarServidor(false);
        // PWA: si el service worker ya controla la página, se abre con los datos guardados
        setEstadoServidor(controlaLaPagina() ? 'listo' : 'sinConexion');
      }));
  }, [marcarServidor]);

  if (estadoServidor === 'verificando') return <PantallaCarga />;
  if (estadoServidor === 'sinConexion') {
    return <PantallaCarga texto="No hay conexión con el servidor. Revisa que la API esté encendida (npm run dev en la carpeta api)." />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={inicio} replace />} />
      <Route path="/iniciarSesion" element={<IniciarSesion />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/salas" element={<Diseno menu={[]}><CatalogoSalas /></Diseno>} />

      {/* RNF 0103 - Espacio de empleados */}
      <Route element={<RutaProtegida rol={roles.empleado}><Diseno menu={menuEmpleado} /></RutaProtegida>}>
        <Route path="/empleado/dashboard" element={<Dashboard />} />
        <Route path="/empleado/reservaciones" element={<Reservaciones />} />
        <Route path="/empleado/servicios" element={<Servicios />} />
        {['clientes', 'empleados', 'sucursales', 'salas', 'horarios', 'tratamientos', 'productos'].map((clave) => (
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
