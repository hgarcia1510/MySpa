-- =========================================================
--  MySPA - Base de datos (basada en el diagrama E-R)
--  Se puede ejecutar a mano:  mysql -u root -p < baseDatos\mySpa.sql
--  o dejar que la API la cree sola la primera vez que arranca.
-- =========================================================
CREATE DATABASE IF NOT EXISTS mySpa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mySpa;

-- ---------- Seguridad ----------
CREATE TABLE usuario (
  idUsuario      INT AUTO_INCREMENT PRIMARY KEY,
  nombreUsuario  VARCHAR(50)  NOT NULL UNIQUE,
  contrasenia    VARCHAR(255) NOT NULL,              -- hash bcrypt
  rol            ENUM('Cliente','Empleado') NOT NULL
);

-- ---------- Persona (generalización de Cliente y Empleado) ----------
CREATE TABLE persona (
  idPersona        INT AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(60)  NOT NULL,
  apellidoPaterno  VARCHAR(60)  NOT NULL,
  apellidoMaterno  VARCHAR(60),
  genero           ENUM('Masculino','Femenino','Otro') NOT NULL,
  rfc              VARCHAR(13),
  domicilio        VARCHAR(200),
  telefono         VARCHAR(15)
);

CREATE TABLE cliente (
  idCliente    INT AUTO_INCREMENT PRIMARY KEY,
  numeroUnico  VARCHAR(30)  NOT NULL UNIQUE,
  correo       VARCHAR(120) NOT NULL,
  estatus      ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  idPersona    INT NOT NULL UNIQUE,
  idUsuario    INT NOT NULL UNIQUE,
  FOREIGN KEY (idPersona) REFERENCES persona(idPersona),
  FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
);

CREATE TABLE empleado (
  idEmpleado      INT AUTO_INCREMENT PRIMARY KEY,
  numeroEmpleado  VARCHAR(30) NOT NULL UNIQUE,
  puesto          VARCHAR(60) NOT NULL,
  foto            VARCHAR(150),
  rutaFoto        VARCHAR(255),
  estatus         ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  idPersona       INT NOT NULL UNIQUE,
  idUsuario       INT NOT NULL UNIQUE,
  FOREIGN KEY (idPersona) REFERENCES persona(idPersona),
  FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario)
);

-- ---------- Sucursales, salas y horarios ----------
CREATE TABLE sucursal (
  idSucursal  INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(80)  NOT NULL,
  domicilio   VARCHAR(200),
  latitud     DECIMAL(10,7) NOT NULL,
  longitud    DECIMAL(10,7) NOT NULL,
  estatus     ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo'
);

CREATE TABLE sala (
  idSala          INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(80) NOT NULL,
  descripcion     VARCHAR(500),
  fotografia      VARCHAR(150),
  rutaFotografia  VARCHAR(255),
  estatus         ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  idSucursal      INT NOT NULL,
  FOREIGN KEY (idSucursal) REFERENCES sucursal(idSucursal)
);

CREATE TABLE horario (
  idHorario   INT AUTO_INCREMENT PRIMARY KEY,
  horaInicio  TIME NOT NULL,
  horaFin     TIME NOT NULL
);

-- Sala N:N Horario
CREATE TABLE salaHorario (
  idSala     INT NOT NULL,
  idHorario  INT NOT NULL,
  PRIMARY KEY (idSala, idHorario),
  FOREIGN KEY (idSala) REFERENCES sala(idSala),
  FOREIGN KEY (idHorario) REFERENCES horario(idHorario) ON DELETE CASCADE
);

-- ---------- Reservaciones ----------
CREATE TABLE reservacion (
  idReservacion  INT AUTO_INCREMENT PRIMARY KEY,
  fecha          DATETIME NOT NULL,
  estatus        ENUM('Pendiente','Atendida','Cancelada') NOT NULL DEFAULT 'Pendiente',
  canal          ENUM('Web','Sucursal') NOT NULL DEFAULT 'Web',   -- Web = la hizo el cliente; Sucursal = un empleado
  idCliente      INT NOT NULL,
  idSala         INT NOT NULL,
  FOREIGN KEY (idCliente) REFERENCES cliente(idCliente),
  FOREIGN KEY (idSala) REFERENCES sala(idSala)
);

-- ---------- Catálogos de productos y tratamientos ----------
CREATE TABLE producto (
  idProducto  INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(80) NOT NULL,
  marca       VARCHAR(80) NOT NULL,
  precioUso   DECIMAL(10,2) NOT NULL,
  estatus     ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo'
);

CREATE TABLE tratamiento (
  idTratamiento  INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(80) NOT NULL,
  descripcion    VARCHAR(500),
  estatus        ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo'
);

-- ---------- Servicios (maestro-detalle) ----------
CREATE TABLE servicio (
  idServicio     INT AUTO_INCREMENT PRIMARY KEY,
  fecha          DATETIME NOT NULL,
  costo          DECIMAL(10,2) NOT NULL DEFAULT 0,  -- costo total del servicio
  idReservacion  INT NOT NULL UNIQUE,               -- Servicio 1:1 Reservación
  idEmpleado     INT NOT NULL,                      -- Empleado 1:N Servicio (Atiende)
  FOREIGN KEY (idReservacion) REFERENCES reservacion(idReservacion),
  FOREIGN KEY (idEmpleado) REFERENCES empleado(idEmpleado)
);

-- Servicio N:N Tratamiento
CREATE TABLE servicioTratamiento (
  idServicioTratamiento  INT AUTO_INCREMENT PRIMARY KEY,
  costo                  DECIMAL(10,2) NOT NULL DEFAULT 0,  -- costo total del tratamiento
  idServicio             INT NOT NULL,
  idTratamiento          INT NOT NULL,
  FOREIGN KEY (idServicio) REFERENCES servicio(idServicio) ON DELETE CASCADE,
  FOREIGN KEY (idTratamiento) REFERENCES tratamiento(idTratamiento)
);

-- ServicioTratamiento N:N Producto (con precioUso al momento del servicio)
CREATE TABLE servicioTratamientoProducto (
  idServicioTratamiento  INT NOT NULL,
  idProducto             INT NOT NULL,
  precioUso              DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (idServicioTratamiento, idProducto),
  FOREIGN KEY (idServicioTratamiento) REFERENCES servicioTratamiento(idServicioTratamiento) ON DELETE CASCADE,
  FOREIGN KEY (idProducto) REFERENCES producto(idProducto)
);

-- ---------- Dashboard: uso de la PWA, marketing y reseñas ----------
-- Visitas a la web y altas de la app instalada (PWA)
CREATE TABLE IF NOT EXISTS eventoUso (
  idEvento  INT AUTO_INCREMENT PRIMARY KEY,
  tipo      ENUM('visita','instalacion') NOT NULL,
  enPwa     TINYINT(1) NOT NULL DEFAULT 0,          -- 1 = abierta como app instalada
  fecha     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inversión en publicidad (para ROI y costo por cliente nuevo)
CREATE TABLE IF NOT EXISTS gastoMarketing (
  idGasto   INT AUTO_INCREMENT PRIMARY KEY,
  canal     VARCHAR(40)   NOT NULL,                 -- Facebook, Instagram, Google, Volantes…
  concepto  VARCHAR(120),
  monto     DECIMAL(10,2) NOT NULL,
  fecha     DATE          NOT NULL
);

-- Calificación del cliente a una reservación atendida (1 por reservación)
CREATE TABLE IF NOT EXISTS resena (
  idResena       INT AUTO_INCREMENT PRIMARY KEY,
  calificacion   TINYINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario     VARCHAR(500),
  fecha          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idReservacion  INT NOT NULL UNIQUE,
  FOREIGN KEY (idReservacion) REFERENCES reservacion(idReservacion)
);

-- ---------- Datos de arranque ----------
-- Empleado administrador:  usuario "admin"  /  contraseña "admin123"
INSERT INTO usuario (nombreUsuario, contrasenia, rol)
VALUES ('admin', '$2b$10$szaC9XwfDZqUMXBsyWpo1OZbzB6ybACyWgGkATwQSlYu64t5uZH7K', 'Empleado');
INSERT INTO persona (nombre, apellidoPaterno, apellidoMaterno, genero, rfc, domicilio, telefono)
VALUES ('Administrador', 'MySPA', NULL, 'Otro', 'ADMI900101AAA', 'León, Gto.', '4770000000');
INSERT INTO empleado (numeroEmpleado, puesto, idPersona, idUsuario)
VALUES ('EADMI1700000000000', 'Gerente', 1, 1);

INSERT INTO sucursal (nombre, domicilio, latitud, longitud) VALUES
('MySPA Centro', 'Centro, León, Gto.', 21.1220000, -101.6830000);