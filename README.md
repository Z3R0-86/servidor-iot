# servidor-iot

Proyecto minimal para recibir, almacenar y mostrar datos IoT. Incluye
un servidor Express en `src/`, funciones serverless bajo `api/` (para Vercel)
y un frontend estático en `public/`.

Resumen
- Propósito: recibir datos desde dispositivos IoT y mostrarlos en una UI
- Persistencia: opcional con Supabase (u otro servicio) desde el servidor

Estructura del proyecto
- `src/` — código del servidor (Express)
- `api/` — funciones serverless (Vercel)
- `public/` — frontend estático (HTML, JS, CSS)
- `package.json` — scripts y dependencias

Requisitos
- Node.js 14+ y `npm`
- (Opcional) Cuenta y credenciales de Supabase si quieres persistir datos

Instalación
```bash
npm install
```

Variables de entorno
- `PORT` — puerto en el que corre el servidor (por defecto 3000)
- `SUPABASE_URL` — URL de Supabase (opcional)
- `SUPABASE_KEY` — API key de Supabase (opcional)

Comandos útiles
- `npm run dev` — arranca en modo desarrollo (con nodemon si está instalado)
- `npm start` — arranca en modo producción

Cómo enviar datos IoT
- Endpoint principal (serverless): `POST /api/datos`
	- Espera JSON con al menos: `{ "deviceId": "id", "sensor": "temp", "value": 23.5, "timestamp": 1650000000000 }`
	- El servidor valida y almacena/reenruta los datos (ver `api/datos.js` o `src/server.js`).

Frontend
- `public/index.html` muestra los datos recibidos y refresca la vista mediante
	llamadas fetch o con conexiones en tiempo real según la implementación.

Despliegue
- Vercel: la carpeta `api/` se despliega como funciones serverless.
- Heroku / VPS: arrancar con `npm start` y exponer `PORT`.

Especificación y organización detallada

- Raíz del proyecto:
	- `package.json`: definiciones de scripts y dependencias. Scripts disponibles:
		- `start`: arranca el servidor con `node src/server.js`.
		- `dev`: arranca con `nodemon src/server.js` para desarrollo.

- `src/` (servidor Express):
	- `src/server.js`: entrada principal del servidor cuando se ejecuta como aplicación Node.
		- Expone APIs HTTP (p. ej. `/datos`) y puede encargarse de la lógica de persistencia
			con Supabase si están configuradas las variables de entorno.
	- Aquí puede añadirse: controladores (`controllers/`), rutas (`routes/`), y utilidades (`lib/`).

- `api/` (serverless para Vercel):
	- `api/datos.js`: función que recibe `POST` con datos IoT y los valida/guarda.
	- Cuando se despliega en Vercel, los ficheros en `api/` se convierten en endpoints.

- `public/` (frontend estático):
	- `public/index.html`: interfaz que muestra datos y permite interacción básica.
	- `public/script.js`: lógica del cliente (fetch para obtener datos o suscripción).
	- `public/styles.css`: estilos de la UI.

- `README.md`: documentación y especificaciones del proyecto.

API: Endpoints principales (especificación mínima)
- `POST /api/datos` (o `/datos` si usas `src/server.js`):
	- Descripción: recibe lecturas desde dispositivos IoT.
	- Request body (JSON):
		- `deviceId` (string, requerido)
		- `sensor` (string, requerido)
		- `value` (number, requerido)
		- `timestamp` (number, opcional — ms desde epoch)
	- Ejemplo:
		```json
		{ "deviceId": "device-01", "sensor": "temp", "value": 23.5, "timestamp": 1650000000000 }
		```
	- Respuestas:
		- `200 OK` — dato procesado/almacenado correctamente: `{ "ok": true }`.
		- `400 Bad Request` — payload inválido: `{ "error": "deviceId requerido" }`.
		- `500 Internal Server Error` — error del servidor.

- `GET /api/datos` (opcional):
	- Descripción: devuelve las últimas lecturas paginadas o filtradas por `deviceId`.
	- Query params sugeridos: `deviceId`, `limit`, `offset`.

Esquema de datos (sugerido)
- Tabla/colección `readings`:
	- `id` (uuid / autonumérico)
	- `device_id` (string)
	- `sensor` (string)
	- `value` (number)
	- `timestamp` (timestamp)
	- `received_at` (timestamp server)

Buenas prácticas y notas
- Validar y sanear todos los campos en el servidor antes de guardar.
- Añadir autenticación si el proyecto pasa a producción (API keys o JWT).
- Manejar límites de envío desde dispositivos (rate limiting) y almacenamiento
	creciente (p. ej. limpieza de datos antiguos).

Dónde tocar para extender
- Lógica del servidor: `src/server.js` y nuevos módulos bajo `src/`
- Endpoints serverless: `api/` (añadir más archivos para nuevas rutas)
- UI: `public/` (añadir componentes, mejorar visualización, usar sockets)

Siguientes pasos sugeridos
- Añadir ejemplos de tests para endpoints.
- Documentar esquema de la base de datos con SQL/JSON.
- Implementar autenticación y validación más robusta.

---