# Mundo Café

Aplicación web full stack para una cafetería con catálogo online, registro e inicio de sesión, carrito, pedidos, perfil de usuario y sistema de fidelización por puntos.

## Qué aporta este proyecto

- Flujo completo de cliente: registro, login, carta, carrito, checkout y confirmación.
- Persistencia real con PostgreSQL para usuarios, pedidos, líneas de pedido y perfil.
- Sistema de recompensas con canje de puntos y trazabilidad de historial.
- Backend en Node.js + Express con validaciones, sesiones y contraseñas hasheadas.
- Proyecto preparado para portfolio: documentación, variables de entorno y tests básicos.

## Stack

- Frontend: HTML, CSS y JavaScript vanilla.
- Backend: Node.js, Express y express-session.
- Base de datos: PostgreSQL.

## Requisitos

- Node.js 20 o superior.
- PostgreSQL 14 o superior.

## Puesta en marcha

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno a partir de [.env.example](C:\Users\Ferran\OneDrive\Escritorio\Proyecto página cafeteria\practicandoprogramasion\.env.example).

3. Crea la base de datos y ejecuta los scripts SQL en este orden:

```sql
\i sql/schema_mundo_cafe.sql
\i sql/seed_mundo_cafe.sql
```

4. Arranca la aplicación:

```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000).

## Usuarios demo

- Cliente principal: `ferran@mundocafe.com` / `DemoCafe2026`
- Cliente secundario: `laura@mundocafe.com` / `ClienteCafe2026`
- Administrador: `admin@mundocafe.com` / `AdminCafe2026`

## Estructura

- [server.js](C:\Users\Ferran\OneDrive\Escritorio\Proyecto página cafeteria\practicandoprogramasion\server.js): servidor Express y API.
- [lib](C:\Users\Ferran\OneDrive\Escritorio\Proyecto página cafeteria\practicandoprogramasion\lib): utilidades de entorno, seguridad y validación.
- [public](C:\Users\Ferran\OneDrive\Escritorio\Proyecto página cafeteria\practicandoprogramasion\public): interfaz cliente.
- [sql](C:\Users\Ferran\OneDrive\Escritorio\Proyecto página cafeteria\practicandoprogramasion\sql): esquema y datos de ejemplo.
- [tests](C:\Users\Ferran\OneDrive\Escritorio\Proyecto página cafeteria\practicandoprogramasion\tests): pruebas automáticas básicas.

## Mejoras aplicadas para versión portfolio

- Contraseñas hasheadas con `scrypt`.
- Configuración por entorno con `.env`.
- Perfil persistente en base de datos.
- Checkout con persistencia de entrega, contacto, notas y método de pago.
- Página de recompensas sincronizada con backend.
- Scripts SQL limpios y mantenibles.
- Tests de utilidades críticas.

## Próximos pasos recomendables

- Añadir panel administrativo real para gestión de pedidos.
- Incorporar tests de integración con base de datos temporal.
- Desplegar backend y base de datos en un entorno público para demo online.
