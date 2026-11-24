# MySPA

Sistema de reservaciones para un spa. El proyecto tiene 4 partes:

| Carpeta | Qué es | Tecnología |
|---|---|---|
| `api/` | Servidor (backend) | Node.js + Express + MySQL |
| `myspaweb/` | Página web | React + Vite |
| `myspamovil/` | App móvil | React Native + Expo |
| `compartido/` | Código que usan las otras 3 (validaciones, costos, cliente de la API) | JavaScript |
| `baseDatos/` | Script SQL de la base de datos | MySQL |

> La **API debe estar corriendo** para que funcionen la web y la app móvil.

---

## 0. Requisitos (instalar una sola vez)

- **Node.js 20 o superior** → https://nodejs.org (versión LTS)
- **MySQL 8** (o XAMPP/WAMP con MySQL) encendido
- **Git**
- Para la app móvil: la app **Expo Go** en tu celular Android/iPhone (Play Store / App Store)

Clonar el proyecto:

```bash
git clone https://github.com/TU_USUARIO/MySpa.git
cd MySpa
```

---

## 1. API (backend)

```bash
cd api
npm install
```

Crea el archivo de configuración copiando el ejemplo:

```bash
copy .env.example .env
```

(En Mac/Linux: `cp .env.example .env`)

Abre `api/.env` y pon **tu contraseña de MySQL** en `BD_CONTRASENIA` (y tu usuario en `BD_USUARIO` si no es `root`).

Arranca la API:

```bash
npm run dev
```

Debe decir `API MySPA en http://localhost:3000/api`.

- **La primera vez crea sola la base de datos `mySpa`** con el script de `baseDatos/mySpa.sql`.
- Usuario inicial: **`admin` / `admin123`** (rol Empleado).
- Si quieres borrar y recrear la base de datos desde cero:
  ```bash
  node --env-file=.env src/config/inicializarBaseDatos.js --reiniciar
  ```

Deja esta terminal abierta.

---

## 2. Página web

En **otra terminal**:

```bash
cd myspaweb
npm install
npm run dev
```

Abre **http://localhost:5173** en el navegador.

- Los clientes nuevos se registran desde la web (`/registro`).
- Si la API está en otra computadora, crea `myspaweb/.env` con:
  `VITE_URL_API=http://IP_DE_LA_PC:3000`

### PWA (instalar la web como app)

El service worker **solo funciona en la versión de producción** (con `npm run dev` no se activa para no romper la recarga automática). Para probar la PWA:

```bash
cd myspaweb
npm run pwa
```

Abre **http://localhost:4173** en Chrome o Edge y usa el botón **Instalar app** del encabezado. Una vez abierta, la app sigue funcionando sin internet o con la API apagada, mostrando la última información guardada (las altas y cambios sí necesitan conexión). Cuando publiques una versión nueva aparece la barra **«Hay una nueva versión»** con el botón *Actualizar*.

| Archivo | Para qué sirve |
|---|---|
| `myspaweb/public/manifest.webmanifest` | Nombre, colores, íconos y accesos directos de la app |
| `myspaweb/public/iconos/` | Íconos 192/512, maskable y Apple (generados del logo) |
| `myspaweb/public/sw.js` | Service worker: caché de la app, de la API y de las imágenes |
| `myspaweb/src/pwa/registrarServicio.js` | Registro del service worker, actualizaciones y métricas de uso |
| `myspaweb/src/contexto/PwaContexto.jsx` | Estado de la PWA (conexión, instalar, actualizar) |
| `myspaweb/src/componentes/BarraPwa.jsx` | Botón *Instalar app* y barras de aviso |

### Reducers

El estado de la web se maneja con `useReducer` + Context (sin Redux). Los reducers están en `myspaweb/src/reductores/` y son funciones puras: sesión, avisos, catálogos, listados (reservaciones, mis reservaciones, salas, servicios), formularios, PWA y dashboard.

### Dashboard administrativo

Menú **Dashboard** del empleado (es su página de inicio). Se filtra por periodo (7, 30, 90 o 365 días) y por sucursal, y muestra:

- **Indicadores:** ingresos y su variación, servicios, ticket promedio, reservaciones, cancelación, inasistencia y clientes nuevos.
- **Ventas:** reservaciones e ingresos por día, ingresos por sucursal y reservaciones por canal (Web = la hizo el cliente, Sucursal = la capturó un empleado).
- **Clientes:** retención, género y mejores clientes.
- **Comportamiento de compra:** tratamientos, productos y ocupación de salas.
- **Marketing y uso de la PWA:** visitas, instalaciones, conversión, gastos de marketing, ROI y costo por cliente nuevo (los gastos se registran con el botón *Registrar gasto de marketing*).
- **Feedback:** calificaciones que dejan los clientes en *Mis reservaciones → Calificar*.

> Si tu base de datos ya existía, **la API la actualiza sola** al arrancar (crea `eventoUso`, `gastoMarketing` y `resena` desde `baseDatos/extensionesDashboard.sql` y agrega la columna `reservacion.canal`).

---

## 3. App móvil

En **otra terminal**:

```bash
cd myspamovil
npm install
npx expo start
```

Aparece un **código QR**. Tienes 3 formas de abrir la app:

### a) En tu celular por Wi‑Fi (la más fácil)
1. El celular y la PC deben estar en **la misma red Wi‑Fi**.
2. Abre **Expo Go** y escanea el QR (en iPhone, con la cámara).
3. La app encuentra la API sola (usa la IP de tu PC con el puerto 3000).

Si se queda cargando o no conecta a la API: en Windows pon tu red como **Privada** y permite los puertos 8081 y 3000 en el firewall (PowerShell como administrador):
```bash
New-NetFirewallRule -DisplayName "MySpa Expo y API" -Direction Inbound -Protocol TCP -LocalPort 8081,3000 -Action Allow -Profile Any
```

### b) En tu celular Android por cable USB (sin depender del Wi‑Fi)
1. En el celular activa **Opciones de desarrollador → Depuración USB** y conéctalo.
2. Redirige los puertos por el cable:
   ```bash
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:3000 tcp:3000
   adb reverse tcp:5173 tcp:5173
   ```
   (`adb` está en `%LOCALAPPDATA%\Android\Sdk\platform-tools\` si tienes Android Studio)
3. Crea `myspamovil/.env` con:
   ```
   EXPO_PUBLIC_URL_API=http://localhost:3000
   ```
4. Arranca con:
   ```bash
   npx expo start --localhost --android -c
   ```

> Si desconectas el cable, repite el paso 2. Para volver a usar Wi‑Fi o emulador, **borra** `myspamovil/.env`.

### c) En el emulador de Android Studio
1. Abre un emulador desde Android Studio (Device Manager → ▶).
2. Corre `npx expo start` y presiona **`a`**.
3. Si la app abre pero no carga datos, crea `myspamovil/.env` con
   `EXPO_PUBLIC_URL_API=http://10.0.2.2:3000` y reinicia con `npx expo start -c`.

En la terminal de Expo: **`r`** recarga la app, **`Ctrl+C`** la detiene.

---

## Usuarios y roles

Solo hay dos roles: **Empleado** y **Cliente**.

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | Empleado (Gerente) |

- **Empleado** (web y móvil): dashboard, reservaciones, servicios, sucursales, horarios, clientes, productos, salas.
- **Cliente**: se registra en la web; en la app ve sus reservaciones, salas y sucursales.

---

## Pruebas

```bash
cd compartido
npm test        # reglas de negocio e indicadores del dashboard

cd ../api
npm test        # dashboard contra una base SQLite en memoria (Node 22.5 o superior)

cd ../myspaweb
npm test        # reducers
```

---

## Problemas comunes

| Problema | Solución |
|---|---|
| `Access denied for user 'root'` | La contraseña de MySQL en `api/.env` está mal. |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL no está encendido. |
| La web/app dice que no puede conectar | La API no está corriendo (`npm run dev` en `api/`). |
| `Unable to resolve "expo-linear-gradient"` (u otro paquete) | Corre `npm install` dentro de `myspamovil/`. |
| Expo Go no abre el QR | Misma red Wi‑Fi, red Privada en Windows, o usa el cable USB (opción b). |
