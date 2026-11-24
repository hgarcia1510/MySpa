-- =========================================================
--  MySPA - Extensiones para el Dashboard administrativo
--  La API lo ejecuta sola al arrancar si la base de datos ya existía.
--  (La columna reservacion.canal también la agrega la API si falta.)
-- =========================================================
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
